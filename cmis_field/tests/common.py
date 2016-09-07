# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import mock
from openerp.tests import common
from openerp.tools import SUPERUSER_ID
from . import models


class BaseTestCmis(common.SavepointCase):

    @classmethod
    def _init_test_model(cls, model_cls):
        registry = cls.env.registry
        cr = cls.env.cr
        inst = model_cls._build_model(registry, cr)
        inst._prepare_setup(cr, SUPERUSER_ID)
        inst._setup_base(cr, SUPERUSER_ID, partial=False)
        inst._setup_fields(cr, SUPERUSER_ID, partial=False)
        inst._setup_complete(cr, SUPERUSER_ID)
        inst._auto_init(cr, {'module': __name__})
        return inst

    @classmethod
    def setUpClass(cls):
        super(BaseTestCmis, cls).setUpClass()
        # mock commit since it"s called in the _auto_init method
        cls.cr.commit = mock.MagicMock()
        cls.cmis_test_model = cls._init_test_model(models.CmisTestModel)
        cls.cmis_backend = cls.env['cmis.backend'].create({
            'name': "cmis.test",
            'location': "http://localhost:8081/alfresco/s/cmis",
            'username': 'admin',
            'password': 'admin',
            'initial_directory_write': '/odoo',
        })
