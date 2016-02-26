# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import time
import os.path

import openerp
import mimetypes
from cStringIO import StringIO
from openerp.exceptions import Warning, UserError
from openerp.tools.translate import _
from openerp.tools.safe_eval import safe_eval
from openerp.addons.cmis.models.cmis_folder import CmisFolder
from openerp.addons.report_aeroo import report_aeroo


class Aeroo_report(report_aeroo.Aeroo_report):

    def create_single_pdf(self, cr, uid, ids, data, report_xml, context=None):
        if len(ids) > 1:
            raise Warning(
                "At this stage we should only have recieved 1 object")
        res = super(Aeroo_report, self).create_single_pdf(
            cr, uid, ids, data, report_xml, context=context)
        obj = self. getObjects_mod(
            cr, uid, ids, report_xml.report_type, context=context)[0]
        if report_xml.cmis_filename:
            with openerp.api.Environment.manage():
                env = openerp.api.Environment(cr, uid, context)
                report = env[report_xml._name].browse(report_xml.id)
                return self.store_in_cmis(
                    env, report, env[obj._name].browse(obj.id), res)
        return res

    def store_in_cmis(self, env, report_xml, obj, res):
        name = safe_eval(
            report_xml.cmis_filename, {'object': obj, 'time': time})
        if not name:
            return
        pdf = res[0]
        cmis_parent_objectid = None
        # if the linked object is CmisFolder, the report will be
        # stored as child of the referenced cmis object otherwise the report
        # will be saved as child of the repository
        if isinstance(obj, CmisFolder):
            if not obj.cmis_objectid:
                if not report_xml.backend_id:
                    raise UserError(_('Not able to store document into cmis\n'
                                      'No backend defined on the report'))
                obj.create_in_cmis(report_xml.backend_id.id)
            cmis_parent_objectid = obj.cmis_objectid
            backend = obj.backend_id
        else:
            backend = report_xml.backend_id
        if not backend:
            raise Warning(_("No CMIS Backend configured"))
        path = os.path.dirname(name) or '/'
        target_folder_objectid = backend.get_folder_by_path(
            path, create_if_not_found=True,
            cmis_parent_objectid=cmis_parent_objectid)
        file_name = os.path.basename(name)
        repo = backend.check_auth()
        parent_folder = repo.getObject(target_folder_objectid)
        someDoc = self.ensure_unique_document(
            env, file_name, parent_folder, report_xml, repo)
        someDoc.setContentStream(
            StringIO(pdf),
            contentType=self.get_mimetype(
                env, file_name, parent_folder, report_xml, repo))
        cmis_objectid = someDoc.getObjectId()
        return (cmis_objectid, 'cmis@%d' % backend.id)

    def get_mimetype(self, env, file_name, cmis_parent_folder_obj,
                     report_xml, repo):
        return mimetypes.guess_type(file_name)[0]

    def ensure_unique_document(self, env, file_name, cmis_parent_folder_obj,
                               report_xml, repo):
        """Create a cmis document or return an existing one if a document
        already exists with the same name and the cmis_duplicate_handler
        == 'new_version'
        """
        rs = cmis_parent_folder_obj.getChildren(
            filter='cmis:name=%s' % file_name)
        num_found_items = rs.getNumItems()
        if (num_found_items == 0 or
                report_xml.cmis_duplicate_handler == 'increment'):
            if num_found_items > 0:
                name, ext = os.path.splitext(file_name)
                testname = name + '(*)' + ext
                rs = cmis_parent_folder_obj.getChildren(
                    filter='cmis:name=%s' % testname)
                file_name = name + '(%d)' % rs.getNumItems() + ext
            props = {
                'cmis:name': file_name,
            }
            doc = cmis_parent_folder_obj.createDocument(
                file_name,
                properties=props,
            )
            return doc
        if (num_found_items > 0 and
                report_xml.cmis_duplicate_handler == 'new_version'):
            return repo.getObject(rs.getResults()[0].getObjectId())

        raise UserError(
            _('Document "%s" already exists in CMIS at %s') % (
             file_name, rs.getResults()[0].getPaths()[0]))
