# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import time
import os.path
import logging
from collections import namedtuple
import mimetypes
from cStringIO import StringIO

import openerp
from openerp.exceptions import UserError
from openerp.tools.translate import _
from openerp.tools.safe_eval import safe_eval
from openerp.addons.cmis.models.cmis_folder import CmisFolder
from openerp.addons.report_aeroo import report_aeroo

logger = logging.getLogger(__name__)


class Aeroo_report(report_aeroo.Aeroo_report):

    def create_single_pdf(self, cr, uid, ids, data, report_xml, context=None):
        if len(ids) > 1:
            raise UserError(
                "At this stage we should only have recieved 1 object")
        res = super(Aeroo_report, self).create_single_pdf(
            cr, uid, ids, data, report_xml, context=context)
        obj = self.getObjects(cr, uid, ids, context)[0]
        if report_xml.cmis_filename:
            with openerp.api.Environment.manage():
                env = openerp.api.Environment(cr, uid, context)
                report = env[report_xml._name].browse(report_xml.id)
                return self.store_in_cmis(
                    env, report, env[obj._name].browse(obj.id), res)
        return res

    def _get_eval_context(self, env, report_xml, obj):
        return {'object': obj,
                'time': time,
                '_': _,
                'user': env.user,
                'context': env.context}

    def _safe_eval(self, source, env, report_xml, obj):
        return safe_eval(
            source,
            self._get_eval_context(env, report_xml, obj)
            )

    def store_in_cmis(self, env, report_xml, obj, res):
        name = self._safe_eval(
            report_xml.cmis_filename, env, report_xml, obj
            )
        if not name:
            return
        pdf = res[0]
        cmis_parent_objectid = None
        # if the linked object is CmisFolder, the report will be
        # stored as child of the referenced cmis object otherwise the report
        # will be saved as child of the repository
        if isinstance(obj, CmisFolder):
            if not obj.cmis_objectid:
                if not report_xml.cmis_backend_id:
                    raise UserError(_('Not able to store document into cmis\n'
                                      'No backend defined on the report'))
                obj.create_in_cmis(report_xml.cmis_backend_id.id)
            cmis_parent_objectid = obj.cmis_objectid
            backend = obj.cmis_backend_id
        else:
            backend = report_xml.cmis_backend_id
        if not backend:
            raise UserError(_("No CMIS Backend configured"))
        # the generated name can contains sub directories
        path = os.path.dirname(name) or '/'

        # get the target folder according to the path to the name
        target_folder_objectid = backend.get_folder_by_path(
            path, create_if_not_found=True,
            cmis_parent_objectid=cmis_parent_objectid)
        file_name = os.path.basename(name)
        repo = backend.check_auth()
        parent_folder = repo.getObject(target_folder_objectid)
        docInfo = self.create_or_update_cmis_document(
            env, file_name, parent_folder, pdf, report_xml, repo, obj)
        someDoc = docInfo.doc
        cmis_objectid = someDoc.getObjectId()
        return (cmis_objectid, 'cmis@%d' % backend.id)

    def _get_cmis_properties(self, env, report_xml, obj):
        if report_xml.cmis_properties:
            return self._safe_eval(
                report_xml.cmis_properties, env, report_xml, obj
            )
        return {}

    def get_mimetype(self, env, file_name, cmis_parent_folder_obj,
                     report_xml, repo):
        return mimetypes.guess_type(file_name)[0]

    def create_or_update_cmis_document(self, env, file_name,
                                       cmis_parent_folder_obj, content,
                                       report_xml, repo, obj):
        """Create or update a cmis document accoring to cmis_duplicate_handler
        return the created or update cmis doc
        """
        mimetype = self.get_mimetype(
            env, file_name, cmis_parent_folder_obj, report_xml, repo)
        cmis_qry = ("SELECT cmis:objectId FROM cmis:document WHERE "
                    "IN_FOLDER('%s') AND cmis:name='%s'" %
                    (cmis_parent_folder_obj.getObjectId(), file_name))
        logger.debug("Query CMIS with %s", cmis_qry)
        rs = repo.query(cmis_qry)
        isNew = False
        num_found_items = rs.getNumItems()
        if (num_found_items == 0 or
                report_xml.cmis_duplicate_handler == 'increment'):
            if num_found_items > 0:
                name, ext = os.path.splitext(file_name)
                testname = name + '(*)' + ext
                rs = cmis_parent_folder_obj.getChildren(
                    filter='cmis:name=%s' % testname)
                file_name = name + '(%d)' % rs.getNumItems() + ext
            doc = self._create_cmis_document(
                env, file_name, cmis_parent_folder_obj, content, mimetype,
                report_xml, repo, obj)
            return UniqueDocInfo(doc, isNew)
        if (num_found_items > 0 and
                report_xml.cmis_duplicate_handler == 'new_version'):
            doc = repo.getObject(rs.getResults()[0].getObjectId())
            doc = self._update_cmis_document(
                env, file_name, doc, content, mimetype, report_xml, repo, obj)
            return UniqueDocInfo(doc, isNew)

        raise UserError(
            _('Document "%s" already exists in CMIS at %s') % (
                file_name, rs.getResults()[0].getPaths()[0]))

    def _create_cmis_document(self, env, file_name, cmis_parent_folder_obj,
                              content, mimetype, report_xml, repo, obj):
        props = {
            'cmis:name': file_name,
        }
        if report_xml.cmis_objectTypeId:
            props['cmis:objectTypeId'] = report_xml.cmis_objectTypeId
        props.update(self._get_cmis_properties(env, report_xml, obj))
        print props
        doc = cmis_parent_folder_obj.createDocument(
            file_name,
            properties=props,
            contentFile=StringIO(content),
            contentType=mimetype
        )
        return doc

    def _update_cmis_document(self, env, file_name, cmis_doc_obj,
                              content, mimetype, report_xml, repo, obj):
        # increment version
        props = self._get_cmis_properties(env, report_xml, obj)
        if 'cmis:secondaryObjectTypeIds' in props:
            # no update aspects
            del props['cmis:secondaryObjectTypeIds']
        cmis_doc_obj = cmis_doc_obj.checkout()
        cmis_doc_obj = cmis_doc_obj.checkin(
            checkinComment=_("Generated by Odoo"),
            contentFile=StringIO(content),
            contentType=mimetype,
            major=False,
            properties=props
            )

        return cmis_doc_obj

UniqueDocInfo = namedtuple('UniqueDoc', ['doc', 'isNew'])
