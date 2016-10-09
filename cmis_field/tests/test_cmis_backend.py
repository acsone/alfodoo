# -*- coding: utf-8 -*-
# © 2014-2015 Savoir-faire Linux (<http://www.savoirfairelinux.com>).
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp.tests import common
from openerp.exceptions import UserError


class TestCmisBackend(common.SavepointCase):

    def setUp(self):
        super(TestCmisBackend, self).setUp()
        self.cmis_backend = self.env['cmis.backend']
        self.backend_instance = self.env.ref('cmis.cmis_backend_alfresco')

    def test_get_by_name(self):
        backend = self.cmis_backend.get_by_name(
            name=self.backend_instance.name)
        self.assertEquals(self.backend_instance, backend)
        with self.assertRaises(UserError):
            self.cmis_backend.get_by_name('error')
        backend = self.cmis_backend.get_by_name(
            'error', raise_if_not_found=False)
        self.assertFalse(backend)

    def test_is_valid_cmis_name(self):
        backend = self.cmis_backend.get_by_name(
            name=self.backend_instance.name)
        self.assertFalse(backend.is_valid_cmis_name(r'my\/:*?"<>| directory'))
        self.assertTrue(backend.is_valid_cmis_name('my directory'))
        with self.assertRaises(UserError):
            backend.is_valid_cmis_name(r'my\/:*?"<>| directory',
                                       raise_if_invalid=True)
