# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).


from unittest import mock

import pkg_resources

from odoo.exceptions import UserError, ValidationError
from odoo.tools import mute_logger

from odoo.addons.cmis_field.tests import common


class TestIrActionsReport(common.BaseTestCmis):
    @classmethod
    def create_sample_report(cls):
        cls.cmis_folder_field_id = cls.env["ir.model.fields"].search(
            [("model", "=", "cmis.test.model"), ("name", "=", "cmis_folder")]
        )
        cls.action_report = cls.env["ir.actions.report"].with_context(
            force_report_rendering=True
        )
        cls.vals = {
            "name": "test_report_cmis_write",
            "model": "cmis.test.model",
            "type": "ir.actions.report",
            "report_name": "cmis_report_write.cmis_test_model_report",
            "report_type": "qweb-pdf",
            "paperformat_id": cls.env.ref("base.paperformat_euro").id,
            "cmis_filename": "cmis_backend.sanitize_cmis_name(object.name)" " + '.pdf'",
            "cmis_folder_field_id": cls.cmis_folder_field_id.id,
            "cmis_parent_type": "folder_field",
            "cmis_duplicate_handler": "error",
        }
        cls.report = cls.action_report.create(cls.vals)

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        # mock commit since it"s called in the _auto_init method
        cls.cr.commit = mock.MagicMock()
        cls.create_sample_report()
        cls.pdf_filename_1 = pkg_resources.resource_filename(
            "odoo.addons.cmis_report_write.tests", "dummy.pdf"
        )
        cls.pdf_filename_2 = pkg_resources.resource_filename(
            "odoo.addons.cmis_report_write.tests", "dummy.pdf"
        )
        cls.inst = cls.env["cmis.test.model"].create({"name": "folder_name"})
        with open(cls.pdf_filename_1, "rb") as pdf:
            cls.pdf_content_1 = pdf.read()
        with open(cls.pdf_filename_1, "rb") as pdf:
            cls.pdf_content_2 = pdf.read()

    def setUp(self):
        super().setUp()
        wkhtmltopdf_patcher = mock.patch.object(
            self.report.__class__, "_run_wkhtmltopdf"
        )
        self.mocked_wkhtmltopdf = wkhtmltopdf_patcher.start()
        self.mocked_wkhtmltopdf.return_value = self.pdf_content_1
        merge_pdfs_patcher = mock.patch.object(self.report.__class__, "_merge_pdfs")
        self.mocked_merge_pdfs = merge_pdfs_patcher.start()
        self.mocked_merge_pdfs.return_value = self.pdf_content_1
        get_wkhtmltopdf_state_patcher = mock.patch.object(
            self.report.__class__, "get_wkhtmltopdf_state"
        )
        self.mocked_get_wkhtmltopdf_state = get_wkhtmltopdf_state_patcher.start()
        self.mocked_get_wkhtmltopdf_state.return_value = "ok"

        @self.addCleanup
        def stop_mock():
            wkhtmltopdf_patcher.stop()
            merge_pdfs_patcher.stop()
            get_wkhtmltopdf_state_patcher.stop()

    def test_constrains(self):
        action_report = self.env["ir.actions.report"]
        with self.assertRaises(ValidationError):
            vals = self.vals.copy()
            vals.update(
                {
                    "cmis_folder_field_id": False,
                    "cmis_parent_type": "folder_field",
                }
            )
            action_report.create(vals)
            vals.update({"cmis_backend_id": False, "cmis_parent_type": "backend"})
            action_report.create(vals)
        vals.update(
            {
                "cmis_folder_field_id": self.cmis_folder_field_id.id,
                "cmis_parent_type": "folder_field",
            }
        )
        report = action_report.create(vals)
        self.assertTrue(report)

    def test_cleanup(self):
        action_report = self.env["ir.actions.report"]
        backend_id = self.env["cmis.backend"].search([(1, "=", 1)])
        self.assertTrue(len(backend_id) >= 1)
        backend_id = backend_id[0]
        vals = self.vals.copy()
        vals.update(
            {
                "cmis_folder_field_id": self.cmis_folder_field_id.id,
                "cmis_parent_type": "folder_field",
                "cmis_backend_id": backend_id.id,
            }
        )
        report = action_report.create(self.vals)
        self.assertFalse(report.cmis_backend_id)
        self.assertTrue(report.cmis_folder_field_id)
        vals.update(
            {
                "cmis_folder_field_id": self.cmis_folder_field_id.id,
                "cmis_parent_type": "backend",
                "cmis_backend_id": backend_id.id,
            }
        )
        report.write(vals)
        self.assertTrue(report.cmis_backend_id)
        self.assertFalse(report.cmis_folder_field_id)

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_simple_report(self):
        with mock.patch.object(self.report.__class__, "_save_in_cmis") as mocked_save:
            # test the call the the create method inside our custom parser
            self.action_report._render(self.report, self.inst.ids)
            # check that the method is called
            self.assertEqual(mocked_save.call_count, 1)
            record, bugger = mocked_save.call_args[0]
            self.assertEqual(self.inst, record)

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_conditional_save(self):
        """If the cmis_filename is evaluated as False, the report is not saved
        into cmis
        """
        self.report.cmis_filename = "False"
        with mock.patch.object(
            self.report.__class__, "_create_or_update_cmis_document"
        ) as mocked_save:
            # test the call the the create method inside our custom parser
            self.action_report._render(self.report, self.inst.ids)
            # check that the method is called
            self.assertEqual(mocked_save.call_count, 0)

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_duplicate_handle_error(self):
        self.report.cmis_duplicate_handler = "error"
        with mock.patch.object(
            self.report.__class__, "_get_cmis_parent_folder"
        ) as mocked_cmis_parent, mock.patch.object(
            self.report.__class__, "_create_cmis_document"
        ) as mocked_create, self.env.cr.savepoint():
            m = mock.MagicMock()
            mocked_cmis_parent.return_value = m
            rp = mock.MagicMock()
            m.repository = rp
            rs = mock.MagicMock()
            rp.query.return_value = rs
            rs.getNumItems.return_value = 0
            # test the call the the create method inside our custom parser
            self.action_report._render(self.report, self.inst.ids)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 1)

            with self.assertRaises(UserError):
                # a second call must fails
                rs.getNumItems.return_value = 1
                self.action_report._render(self.report, self.inst.ids)

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_duplicate_handle_new_version(self):
        self.report.cmis_duplicate_handler = "new_version"
        with mock.patch.object(
            self.report.__class__, "_get_cmis_parent_folder"
        ) as mocked_cmis_parent, mock.patch.object(
            self.report.__class__, "_create_cmis_document"
        ) as mocked_create, mock.patch.object(
            self.report.__class__, "_update_cmis_document"
        ) as mocked_update, self.env.cr.savepoint():
            m = mock.MagicMock()
            mocked_cmis_parent.return_value = m
            rp = mock.MagicMock()
            m.repository = rp
            rs = mock.MagicMock()
            rp.query.return_value = rs
            rs.getNumItems.return_value = 1
            # test the call the the create method inside our custom parser
            self.action_report._render(self.report, self.inst.ids)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 0)
            self.assertEqual(mocked_update.call_count, 1)

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_duplicate_handle_increment(self):
        self.report.cmis_duplicate_handler = "increment"
        with mock.patch.object(
            self.report.__class__, "_get_cmis_parent_folder"
        ) as mocked_cmis_parent, mock.patch.object(
            self.report.__class__, "_create_cmis_document"
        ) as mocked_create, self.env.cr.savepoint():
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
            self.action_report._render(self.report, self.inst.ids)
            # the first call must succeed
            self.assertEqual(mocked_create.call_count, 1)
            file_name = mocked_create.call_args[0][2]
            self.assertEqual(file_name, "folder_name(1).pdf")

    @mute_logger("odoo.addons.base.models.assetsbundle")
    def test_use_existing_handler(self):
        self.report.cmis_duplicate_handler = "use_existing"
        with mock.patch.object(
            self.report.__class__, "_get_cmis_parent_folder"
        ) as mocked_cmis_parent, mock.patch.object(
            self.report.__class__, "_create_cmis_document"
        ), mock.patch.object(
            self.report.__class__, "_retrieve_cmis_attachment"
        ) as mocked_retrieve_cmis_attachment, self.env.cr.savepoint():
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
            mocked_retrieve_cmis_attachment.return_value = self.env[
                "ir.attachment"
            ].new(
                {
                    "mimetype": "plain/text",
                    "raw": self.pdf_content_2,
                }
            )
            self.mocked_merge_pdfs.side_effect = lambda a: a[0].getvalue()
            # test the call the the create method inside our custom parser
            res = self.action_report._render(self.report, self.inst.ids)
            self.assertEqual(res[0], self.pdf_content_2)
