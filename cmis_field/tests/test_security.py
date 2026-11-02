# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from unittest import mock

from odoo.exceptions import AccessError

from . import common


class TestCmisFieldSecurity(common.BaseTestCmis):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        group_user = cls.env.ref("base.group_user")
        cls.env["ir.model.access"].create(
            {
                "name": "cmis.test.model user",
                "model_id": cls.env["ir.model"]._get_id("cmis.test.model"),
                "group_id": group_user.id,
                "perm_read": True,
                "perm_write": True,
                "perm_create": True,
                "perm_unlink": True,
            }
        )
        cls.user = cls.env["res.users"].create(
            {
                "name": "CMIS field internal user",
                "login": "cmis_field_internal_user",
                "groups_id": [(6, 0, [group_user.id])],
            }
        )

    def test_backend_not_accessible(self):
        backend_model = self.env["cmis.backend"].with_user(self.user)
        with self.assertRaises(AccessError):
            backend_model.search([])
        with self.assertRaises(AccessError):
            self.cmis_backend.with_user(self.user).read(["password"])

    def test_field_backend_internal_user(self):
        model = self.env["cmis.test.model"].with_user(self.user)
        backend = model._fields["cmis_folder"].get_backend(model.env)
        self.assertEqual(backend, self.cmis_backend)
        descr = model.fields_get(["cmis_folder"])["cmis_folder"]["backend"]
        self.assertEqual(descr["id"], self.cmis_backend.id)
        self.assertNotIn("backend_error", descr)
        self.assertNotIn("password", descr)
        self.assertNotIn("username", descr)

    def test_create_value_internal_user(self):
        inst = (
            self.env["cmis.test.model"]
            .with_user(self.user)
            .create({"name": "folder_name"})
        )
        with mock.patch(
            "odoo.addons.cmis.models.cmis_backend.CmisBackend.get_cmis_repository"
        ) as mocked_get_repository:
            repo = mocked_get_repository.return_value
            repo.createFolder.return_value.getObjectId.return_value = "cmis_id"
            inst._fields["cmis_folder"].create_value(inst)
        self.assertEqual(inst.cmis_folder, "cmis_id")
