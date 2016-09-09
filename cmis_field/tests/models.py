# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

# DON'T IMPORT THIS MODULE IN INIT TO AVOID THE CREATION OF THE MODELS
# DEFINED FOR TESTS INTO YOUR ODOO INSTANCE

from openerp import api, fields, models
from ..fields import CmisFolder


class CmisTestModel(models.Model):
    _name = 'cmis.test.model'
    _rec_name = 'name'

    @api.multi
    def _get_name(self, field, backend):
        return dict.fromkeys(self.ids, "custom_name")

    @api.multi
    def _get_parent(self, field, backend):
        return dict.fromkeys(self.ids, "custom_parent")

    @api.multi
    def _get_properties(self, field, backend):
        return dict.fromkeys(self.ids, {'cmis:propkey': 'custom value'})

    @api.multi
    def _cmis_create(self, field, backend):
        self.cmis_folder2 = '_create_method'

    name = fields.Char(required=True)
    cmis_folder = CmisFolder(
        backend_name='cmis.test')
    cmis_folder1 = CmisFolder(
        backend_name='cmis.test',
        create_parent_get='_get_parent',
        create_name_get='_get_name',
        create_properties_get='_get_properties')

    cmis_folder2 = CmisFolder(
        backend_name='cmis.test',
        create_method='_cmis_create')
