# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, fields, models, _


class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    is_cmis_proxy = fields.Boolean(
        required=True, default=False, 
        help=_("If checked, all the CMIS requests from the client will be "
               "done to the Odoo server in place of to a direct call to the"
               "CMIS Container. In such a case, Odoo act as a proxy server "
               "between the widget and the cmis container and all the requets "
               "are done by using the configured account on the backend. "
               "Moreover the Odoo security rules are applied to the content "
               "retrieved from the cmis container and the available actions "
               "on this content."))