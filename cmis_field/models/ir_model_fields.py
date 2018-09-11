# Copyright 2018 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import fields, models


class IrModelFields(models.Model):

    _inherit = 'ir.model.fields'

    ttype = fields.Selection(
        selection_add=[('cmis_folder', 'CMIS Folder')]
    )
