# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import models


class IrActionsReport(models.Model):

    _inherit = "ir.actions.report"

    def _save_in_cmis(self, record, buffer):
        res = super()._save_in_cmis(record, buffer)
        bus = self.env["bus.bus"]
        if self.cmis_folder_field_id:
            # only notify on the root folder
            field_name = self.cmis_folder_field_id.name
            field = record._fields[field_name]
            cmis_backend = field.get_backend(self.env)
            root_objectId = record[field_name]
            bus._notify_cmis_node_changed(root_objectId, cmis_backend)
        return res
