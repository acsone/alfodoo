# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp.addons.cmis_field.tests import common
from openerp.exceptions import ValidationError


class TestIrActionsReportXml(common.BaseTestCmis):

    def setUp(self):
        super(TestIrActionsReportXml, self).setUp()
        self.cmis_folder_field_id = self.env['ir.model.fields'].search([
            ('model', '=', 'cmis.test.model'),
            ('name', '=', 'cmis_folder')])
        self.vals = {
            "name": "test_report_cmis_write",
            "model": "cmis.test.model",
            "type": "ir.actions.report.xml",
            "report_name": "cmis_report_write.cmis_test_model_report",
            "report_type": "qweb-pdf",
            "paperformat_id": self.env.ref("report.paperformat_euro").id,
            "cmis_filename": "object.name + '.pdf'",
            "cmis_folder_field_id": self.cmis_folder_field_id.id,
            "cmis_parent_type": "folder_field",
            "cmis_duplicate_handler": "error"
        }

    def test_constrains(self):
        action_report = self.env['ir.actions.report.xml']
        with self.assertRaises(ValidationError):
            vals = self.vals.copy()
            vals.update({
                "cmis_folder_field_id": False,
                "cmis_parent_type": "folder_field",
            })
            action_report.create(vals)
            vals.update({
                "cmis_backend_id": False,
                "cmis_parent_type": "backend",
            })
            action_report.create(vals)
        vals.update({
            "cmis_folder_field_id": self.cmis_folder_field_id.id,
            "cmis_parent_type": "folder_field",
        })
        report = action_report.create(vals)
        self.assertTrue(report)

    def test_cleanup(self):
        action_report = self.env['ir.actions.report.xml']
        backend_id = self.env['cmis.backend'].search([(1, '=', 1)])
        self.assertTrue(len(backend_id) >= 1)
        backend_id = backend_id[0]
        vals = self.vals.copy()
        vals.update({
            "cmis_folder_field_id": self.cmis_folder_field_id.id,
            "cmis_parent_type": "folder_field",
            "cmis_backend_id": backend_id.id
        })
        report = action_report.create(self.vals)
        self.assertFalse(report.cmis_backend_id)
        self.assertTrue(report.cmis_folder_field_id)
        vals.update({
            "cmis_folder_field_id": self.cmis_folder_field_id.id,
            "cmis_parent_type": "backend",
            "cmis_backend_id": backend_id.id
        })
        report.write(vals)
        self.assertTrue(report.cmis_backend_id)
        self.assertFalse(report.cmis_folder_field_id)
