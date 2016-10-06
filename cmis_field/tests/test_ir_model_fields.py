# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import mock
from .common import BaseTestCmis
from ..fields import CmisFolder


class TestIrModelFields(BaseTestCmis):

    def test_add_cmis_folder(self):
        """Test the addition of CmisFolder field to an existing model by
        using the functionnality provided by ir_model_fields
        """
        x_field = 'x_cmis_field'
        res_company = self.env['res.company']
        model_id = self.env['ir.model'].search(
            [('model', "=", "res.company")]).id
        ir_model_fields = self.env['ir.model.fields']
        self.assertFalse(x_field in res_company._fields)
        ir_model_fields.create({
            'ttype': CmisFolder.type,
            'name': x_field,
            'model': 'res.company',
            'model_id': model_id,
            })
        ir_model_fields = self.env['ir.model.fields']
        self.assertTrue(x_field in res_company._fields)
        with mock.patch.object(CmisFolder, 'create_value') as mocked:
            main_company = self.env.ref('base.main_company')
            res_company._fields[x_field].create_value(main_company)
            self.assertEqual(mocked.call_count, 1)
