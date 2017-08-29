# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, fields, models
from odoo.addons.cmis_web_proxy_alf.controllers import alfresco


class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    @api.depends('alfresco_api_location')
    @api.multi
    def _compute_proxy_api_location(self):
        for record in self:
            record.proxy_api_location = (
                alfresco.ALFRESCO_API_PROXY_PATH + '/%s' % record.id)

    alfresco_api_location = fields.Char(
        string='Alfresco Api Url',
        required=True)
    proxy_api_location = fields.Char(
        readonly=True, compute='_compute_proxy_api_location')

    @api.model
    def _get_web_description(self, record):
        """ Return the desciption of backend record to be included into the
        field description of alfresco fields that reference the backend.
        """
        descr = super(CmisBackend, self)._get_web_description(record)
        descr.update({
            'alfresco_api_location': record.proxy_api_location
        })
        return descr
