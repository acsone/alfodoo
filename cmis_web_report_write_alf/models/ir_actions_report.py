# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import models


class IrActionsReport(models.Model):

    _inherit = "ir.actions.report"

    def _create_cmis_document(self, buffer, record, file_name, cmis_parent_folder):
        res = super()._create_cmis_document(
            buffer, record, file_name, cmis_parent_folder
        )

        cmis_filename = self._get_cmis_filename(record)
        if cmis_filename.endswith(".pdf"):
            return res
        # only notify to open documents into an editable format
        bus = self.env["bus.bus"]
        if self.cmis_folder_field_id:
            # only notify on the root folder
            field_name = self.cmis_folder_field_id.name
            field = record._fields[field_name]
            cmis_backend = field.get_backend(self.env)
            root_objectId = record[field_name]
            url = cmis_backend.get_content_details_url(res)
            bus_message = {
                "cmis_objectid": root_objectId,
                "backend_id": cmis_backend.id,
                "url": url,
                "action": "open_url",
                "user_id": self.env.user.id,
            }
            bus.sendone("notify_cmis_node", bus_message)
        return res
