# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, fields, models, _
from openerp import tools

class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    @api.multi
    def write(self, vals):
        self.get_default_backend.clear_cache(self)
        return super(CmisBackend, self).write(vals)

    @tools.cache()
    def get_default_backend(self):
        res = self.search([(1, '=', 1)])
        res.ensure_one()
        return res

    @api.onchange('is_cmis_proxy')
    def _onchange_is_cmis_proxy(self):
        self.apply_odoo_security = self.is_cmis_proxy

    is_cmis_proxy = fields.Boolean(
        required=True, default=False,
        help=_("If checked, all the CMIS requests from the client will be "
               "done to the Odoo server in place of to a direct call to the"
               "CMIS Container. In such a case, Odoo act as a proxy server "
               "between the widget and the cmis container and all the requets "
               "are done by using the configured account on the backend. "))
    apply_odoo_security = fields.Boolean(
        required=True, default=False, 
        help=_("If checked, the Odoo security rules are applied to the "
               "content retrieved from the cmis container and the available "
               "actions on this content."))
