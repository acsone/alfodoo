# -*- coding: utf-8 -*-
# © 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from odoo import fields, models


class CmisBackend(models.Model):
    _inherit = 'cmis.backend'
    _backend_type = 'cmis'

    share_location = fields.Char(
        string='Alfresco Share Url',
        required=True,
        default='http://localhost:8080/share'
    )

    alfresco_api_location = fields.Char(
        string='Alfresco Api Url',
        required=True,
        default='http://localhost:8080/alfresco/s/api'
    )
