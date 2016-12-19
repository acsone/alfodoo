# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import mock
from openerp.exceptions import UserError
from openerp.addons.cmis_field.tests import common


class TestCmisReportWrite(common.BaseTestCmis):

    @classmethod
    def create_sample_report(cls):
        cls.cmis_folder_field_id = cls.env['ir.model.fields'].search([
            ('model', '=', 'cmis.test.model'),
            ('name', '=', 'cmis_folder')])
        action_report = cls.env['ir.actions.report.xml']
        cls.report = action_report.create({
            "name": "test_report_cmis_write",
            "model": "cmis.test.model",
            "type": "ir.actions.report.xml",
            "report_name": "cmis_report_write.cmis_test_model_report",
            "report_type": "qweb-pdf",
            "paperformat_id": cls.env.ref("report.paperformat_euro").id,
            "cmis_filename": "cmis_backend.sanitize_cmis_name(object.name)"
                             " + '.pdf'",
            "cmis_folder_field_id": cls.cmis_folder_field_id.id,
            "cmis_parent_type": "folder_field",
            "cmis_duplicate_handler": "error"
        })

    @classmethod
    def setUpClass(cls):
        super(TestCmisReportWrite, cls).setUpClass()
        # mock commit since it"s called in the _auto_init method
        cls.cr.commit = mock.MagicMock()
        cls.create_sample_report()
        cls.inst = cls.env['cmis.test.model'].create({'name': 'folder_name'})
        cls.report_name = cls.report._lookup_report(cls.report.report_name)

    def test_simple_report(self):
        inst = self.inst
        with mock.patch('openerp.addons.cmis_report_write.models.'
                        'report.Report._save_in_cmis') as mocked_save:
            # test the call the the create method inside our custom parser
            self.registry['report'].get_pdf(
                self.env.cr, self.env.uid, inst.ids, self.report_name)
            # check that the method is called
            self.assertEqual(mocked_save.call_count, 1)
            content, res_id, report_xml = mocked_save.call_args[0]
            self.assertEqual(inst.id, res_id)
            self.assertEqual(self.report, report_xml)

    def test_conditional_save(self):
        """If the cmis_filename is evaluated as False, the report is not saved
        in cmis
        """
        self.report.cmis_filename = 'False'
        with mock.patch('openerp.addons.cmis_report_write.models.'
                        'report.Report.'
                        '_create_or_update_cmis_document') as mocked_save:
            # test the call the the create method inside our custom parser
            self.registry['report'].get_pdf(
                self.env.cr, self.env.uid, self.inst.ids, self.report_name)
            # check that the method is called
            self.assertEqual(mocked_save.call_count, 0)

    def test_duplicate_handle_error(self):
        self.report.cmis_duplicate_handler = 'error'
        with mock.patch(
                'openerp.addons.cmis_report_write.models.'
                'report.Report.'
                '_get_cmis_parent_folder') as mocked_cmis_parent,\
                mock.patch(
                    'openerp.addons.cmis_report_write.models.'
                    'report.Report.'
                    '_create_cmis_document') as mocked_create,\
                self.env.cr.savepoint():
            m = mock.MagicMock()
            mocked_cmis_parent.return_value = m
            rp = mock.MagicMock()
            m.repository = rp
            rs = mock.MagicMock()
            rp.query.return_value = rs
            rs.getNumItems.return_value = 0
            # test the call the the create method inside our custom parser
            self.registry['report'].get_pdf(
                self.env.cr, self.env.uid, self.inst.ids, self.report_name)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 1)

            with self.assertRaises(UserError):
                # a second call must fails
                rs.getNumItems.return_value = 1
                self.registry['report'].get_pdf(
                    self.env.cr, self.env.uid, self.inst.ids, self.report_name)

    def test_duplicate_handle_new_version(self):
        self.report.cmis_duplicate_handler = 'new_version'
        with mock.patch(
                'openerp.addons.cmis_report_write.models.'
                'report.Report.'
                '_get_cmis_parent_folder') as mocked_cmis_parent,\
                mock.patch(
                    'openerp.addons.cmis_report_write.models.'
                    'report.Report.'
                    '_create_cmis_document') as mocked_create,\
                mock.patch(
                    'openerp.addons.cmis_report_write.models.'
                    'report.Report.'
                    '_update_cmis_document') as mocked_update,\
                self.env.cr.savepoint():
            m = mock.MagicMock()
            mocked_cmis_parent.return_value = m
            rp = mock.MagicMock()
            m.repository = rp
            rs = mock.MagicMock()
            rp.query.return_value = rs
            rs.getNumItems.return_value = 1
            # test the call the the create method inside our custom parser
            self.registry['report'].get_pdf(
                self.env.cr, self.env.uid, self.inst.ids, self.report_name)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 0)
            self.assertEqual(mocked_update.call_count, 1)

    def test_duplicate_handle_increment(self):
        self.report.cmis_duplicate_handler = 'increment'
        with mock.patch(
                'openerp.addons.cmis_report_write.models.'
                'report.Report.'
                '_get_cmis_parent_folder') as mocked_cmis_parent,\
                mock.patch(
                    'openerp.addons.cmis_report_write.models.'
                    'report.Report.'
                    '_create_cmis_document') as mocked_create,\
                self.env.cr.savepoint():
            cmis_parent_folder = mock.MagicMock()
            mocked_cmis_parent.return_value = cmis_parent_folder
            rp = mock.MagicMock()
            cmis_parent_folder.repository = rp
            rs = mock.MagicMock()
            rp.query.return_value = rs
            rs.getNumItems.return_value = 1
            rs = mock.MagicMock()
            cmis_parent_folder.getChildren.return_value = rs
            rs.getNumItems.return_value = 1
            # test the call the the create method inside our custom parser
            self.registry['report'].get_pdf(
                self.env.cr, self.env.uid, self.inst.ids, self.report_name)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 1)
            file_name = mocked_create.call_args[0][3]
            self.assertEqual(file_name, 'folder_name(1).pdf')
