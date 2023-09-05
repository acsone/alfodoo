# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from unittest import mock

from odoo_test_helper import FakeModelLoader

from odoo.tests import common


class BaseTestCmis(common.TransactionCase, FakeModelLoader):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        cls.loader = FakeModelLoader(cls.env, cls.__module__)
        cls.loader.backup_registry()
        from .models import CmisTestModel, CmisTestModelInherits, CmisTestModelRelated

        cls.loader.update_registry(
            (CmisTestModel, CmisTestModelInherits, CmisTestModelRelated)
        )

        # mock commit since it"s called in the _auto_init method
        cls.cr.commit = mock.MagicMock()
        cls.cmis_test_model = cls.env["cmis.test.model"]
        cls.cmis_test_model_inherits = cls.env["cmis.test.model.inherits"]
        cls.cmis_test_model_related = cls.env["cmis.test.model.related"]
        cls.cmis_backend = cls.env.ref("cmis.cmis_backend_alfresco")
        cls.cmis_backend.initial_directory_write = "/odoo"

    def setUp(self):
        super(BaseTestCmis, self).setUp()

        # global patch

        def get_unique_folder_name(name, parent):
            return name

        self.patched_get_unique_folder_name = mock.patch.object(
            self.cmis_backend.__class__,
            "get_unique_folder_name",
            side_effect=get_unique_folder_name,
        )
        self.patched_get_unique_folder_name.start()
        # We are replacing get_unique_folder_name by a mock. If Odoo asks
        # whether a method as _ondelete attr, the answer is always yes.
        # But there is no ondelete method on cmis_backend so we force it
        # to avoid calling it when deleting the record.
        self.cmis_backend.__class__._ondelete_methods = []

    @classmethod
    def tearDownClass(cls):
        cls.loader.restore_registry()
        super().tearDownClass()
