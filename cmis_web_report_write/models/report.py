# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, models


class Report(models.Model):

    _inherit = 'report'

    @api.model
    def _save_in_cmis(self, content, res_id, report_xml):
        res = super(Report, self)._save_in_cmis(content, res_id, report_xml)
        res_model = report_xml.model
        record = self.env[res_model].browse(res_id)
        bus = self.env['bus.bus']
        if report_xml.cmis_folder_field_id:
            # only notify on the root folder
            field_name = report_xml.cmis_folder_field_id.name
            field = record._fields[field_name]
            cmis_backend = field.get_backend(self.env)
            root_objectId = record[field_name]
            bus._notify_cmis_node_changed(root_objectId, cmis_backend)
        return res
