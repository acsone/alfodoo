# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, fields, models, _
from openerp.addons.base.ir import ir_model
from ..fields import CmisFolder


class IrModelFields(models.Model):

    _inherit = 'ir.model.fields'

    @api.model
    def _get_ttype(self):
        selection = ir_model._get_fields_type(
            self, self.env.cr, self.env.uid)
        selection.append((CmisFolder.ttype, 'CmisFolder'))
        return sorted(selection)

    ttype = fields.Selection(selection='_get_ttype')
