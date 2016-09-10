# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, fields, models, _
from openerp import tools
from ..controllers import CMIS_PROXY_PATH

class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    @api.model
    @tools.cache('backend_id')
    def get_by_id(self, backend_id):
        backend = self.browse(backend_id)
        backend.ensure_one()
        return backend

    @api.multi
    def write(self, vals):
        self.get_by_id.clear_cache()
        if 'is_cmis_proxy' in vals and \
            vals['is_cmis_proxy'] == False:
            vals['apply_odoo_security'] = False
        return super(CmisBackend, self).write(vals)

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

    @api.model
    def _get_web_description(self, record):
        """ Return the desciption of backend record to be included into the
        field description of cmis fields that reference the backend.
        """
        descr = super(CmisBackend, self)._get_web_description(record)
        descr.update({
            'apply_odoo_security': record.apply_odoo_security,
            'cmis_location': CMIS_PROXY_PATH + '/' + record.id,
        })
        return descr