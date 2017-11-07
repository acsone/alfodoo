# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models
from odoo import tools
from ..controllers import cmis


class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    def _clear_caches(self):
        self.get_by_id.clear_cache(self)

    @api.onchange('is_cmis_proxy')
    def _onchange_is_cmis_proxy(self):
        self.apply_odoo_security = self.is_cmis_proxy

    @api.depends('location')
    @api.multi
    def _compute_proxy_location(self):
        for record in self:
            record.proxy_location = cmis.CMIS_PROXY_PATH + '/%s' % record.id

    is_cmis_proxy = fields.Boolean(
        default=False,
        help="If checked, all the CMIS requests from the client will be "
             "done to the Odoo server in place of to a direct call to the"
             "CMIS Container. In such a case, Odoo act as a proxy server "
             "between the widget and the cmis container and all the requets "
             "are done by using the configured account on the backend. ")
    apply_odoo_security = fields.Boolean(
        default=False,
        help="If checked, the Odoo security rules are applied to the "
             "content retrieved from the cmis container and the available "
             "actions on this content.")
    proxy_location = fields.Char(
        readonly=True, store=True, compute='_compute_proxy_location')

    @api.model
    def _get_web_description(self, record):
        """ Return the desciption of backend record to be included into the
        field description of cmis fields that reference the backend.
        """
        descr = super(CmisBackend, self)._get_web_description(record)
        descr.update({
            'apply_odoo_security': record.apply_odoo_security,
            'location': record.proxy_location,
        })
        return descr

    @api.model
    @tools.cache('backend_id')
    def get_proxy_info_by_id(self, backend_id):
        backend = self.get_by_id(backend_id)
        return {
            'is_cmis_proxy': backend.is_cmis_proxy,
            'apply_odoo_security': backend.apply_odoo_security,
            'username': backend.username,
            'password': backend.password,
            'proxy_location': backend.proxy_location,
            'location': backend.location,
            'cmis_repository': backend.get_cmis_repository()
        }

    @api.model
    def get_by_id(self, backend_id):
        backend = self.browse(backend_id)
        backend.ensure_one()
        return backend

    @api.multi
    def write(self, vals):
        self.get_proxy_info_by_id.clear_cache(self)
        if 'is_cmis_proxy' in vals and \
                vals['is_cmis_proxy'] is False:
            vals['apply_odoo_security'] = False
        return super(CmisBackend, self).write(vals)
