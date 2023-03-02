# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, models


class BusBus(models.Model):

    _inherit = "bus.bus"

    @api.model
    def _notify_cmis_node_changed(self, cmis_objectid, cmis_backend):
        self._notify_cmis_node(cmis_objectid, cmis_backend, action="update")

    @api.model
    def _notify_cmis_node(self, cmis_objectid, cmis_backend, action):
        bus_message = {
            "cmis_objectid": cmis_objectid,
            "backend_id": cmis_backend.id,
            "action": action,
            "user_id": self.env.user.id,
        }
        self.sendone("notify_cmis_node", bus_message)
