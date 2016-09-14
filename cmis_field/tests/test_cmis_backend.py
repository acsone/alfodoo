# -*- coding: utf-8 -*-
# © 2014-2015 Savoir-faire Linux (<http://www.savoirfairelinux.com>).
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp.tests import common


class TestCmisBackend(common.SavepointCase):

    def setUp(self):
        super(TestCmisBackend, self).setUp()
        self.vals = {
            'name': "Test cmis",
            'location': "http://localhost:8081/alfresco/s/cmis",
            'username': 'admin',
            'password': 'admin',
            'initial_directory_write': '/',
        }
        self.cmis_backend = self.env['cmis.backend']
        self.backend_instance = self.cmis_backend.create(
            self.vals)

    def test_get_by_name(self):
        backend = self.cmis_backend.get_by_name(name=self.vals['name'])
        self.assertEquals(self.backend_instance, backend)
        with self.assertRaises(ValueError):
            self.cmis_backend.get_by_name('error')
        backend = self.cmis_backend.get_by_name(
            'error', raise_if_not_found=False)
        self.assertFalse(backend)
