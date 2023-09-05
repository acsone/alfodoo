# Copyright 2023 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

import io

from odoo import api, models


class IrAttachment(models.Model):

    _inherit = "ir.attachment"

    @api.model_create_multi
    def create(self, vals_list):
        if not self._context.get("cmis_report_keys", False):
            return super().create(vals_list)
        new_vals_list = []
        cmis_report, save_in_cmis_marker = self._context.get("cmis_report_keys")
        for vals in vals_list:
            if "'{}'".format(vals["name"]) != save_in_cmis_marker:
                # Case of other attachments created when the pdf is rendered
                # (e.g. web assets)
                new_vals_list.append(vals)
            else:
                if cmis_report.attachment != save_in_cmis_marker:
                    new_vals_list.append(vals)
                if (cmis_report.attachment == save_in_cmis_marker) or (
                    cmis_report.cmis_filename and cmis_report.cmis_folder_field_id
                ):
                    record = self.env[vals["res_model"]].browse(vals["res_id"])
                    buffer = io.BytesIO(vals["raw"])
                    cmis_report._save_in_cmis(record, buffer)
        return super().create(new_vals_list)
