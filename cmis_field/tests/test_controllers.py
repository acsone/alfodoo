# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from contextlib import contextmanager

import mock
from odoo import http

from . import common
from ..controllers import main


@contextmanager
def mock_http_request_env(env):
    request = http.request
    try:
        http.request = mock.MagicMock()
        http.request.env = env
        yield
    finally:
        http.request = request


class TestCmisController(common.BaseTestCmis):

    @classmethod
    def setUpClass(cls):
        super(TestCmisController, cls).setUpClass()
        cls.cmis_test_model_inst = cls.env['cmis.test.model'].create(
            {'name': 'folder_name'})

    def test_init_field_value(self):
        controller = main.CmisController()
        with mock_http_request_env(self.env):
            val = controller.create_field_value(
                self.cmis_test_model_inst._name, self.cmis_test_model_inst.id,
                'cmis_folder2')
            self.assertDictEqual(val, {"value": "_create_method"})
