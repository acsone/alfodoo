# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import time
import os.path

import openerp
from openerp.exceptions import Warning
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
                env = openerp.api.Environment(cr, uid, context).sudo()
                report = env[report_xml._name].browse(report_xml.id)
                self.store_in_cmis(
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
            cmis_parent_objectid = obj.cmis_objectid
            backend = obj.backend_id
        else:
            backend = report_xml.backend_id
        if not backend:
            raise Warning("No CMIS Backend configured")
        path = os.path.dirname(name) or '/'
        target_folder_objectid = backend.get_folder_by_path(
            path, create_if_not_found=True,
            cmis_parent_objectid=cmis_parent_objectid)
            #backend 
