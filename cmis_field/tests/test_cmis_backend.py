# -*- coding: utf-8 -*-
# © 2014-2015 Savoir-faire Linux (<http://www.savoirfairelinux.com>).
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import mock
from odoo.exceptions import UserError, ValidationError
from odoo.tests import common


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
        self.assertFalse(backend.is_valid_cmis_name(r'abc.'))
        self.assertFalse(backend.is_valid_cmis_name(r'abc '))
        self.assertTrue(backend.is_valid_cmis_name('my directory'))
        with self.assertRaises(UserError):
            backend.is_valid_cmis_name(r'my\/:*?"<>| directory',
                                       raise_if_invalid=True)

    def test_sanitize_cmis_name(self):
        self.backend_instance.sanitize_replace_char = "_"
        sanitized = self.backend_instance.sanitize_cmis_name('m/y dir*', '_')
        self.assertEqual(sanitized, 'm_y dir_')
        sanitized = self.backend_instance.sanitize_cmis_name('m/y dir*', None)
        self.assertEqual(sanitized, 'm_y dir_')
        sanitized = self.backend_instance.sanitize_cmis_name('m/y dir*', '')
        self.assertEqual(sanitized, 'my dir')
        sanitized = self.backend_instance.sanitize_cmis_name('m/y dir*', '-')
        self.assertEqual(sanitized, 'm-y dir-')
        sanitized = self.backend_instance.sanitize_cmis_name('/y dir*', ' ')
        self.assertEqual(sanitized, 'y dir')
        sanitized = self.backend_instance.sanitize_cmis_name('xyz.', ' ')
        self.assertEqual(sanitized, 'xyz')
        sanitized = self.backend_instance.sanitize_cmis_name('xyz.....', ' ')
        self.assertEqual(sanitized, 'xyz')
        sanitized = self.backend_instance.sanitize_cmis_name('.x.y.z..', ' ')
        self.assertEqual(sanitized, '.x.y.z')
        with self.assertRaises(ValidationError):
            self.backend_instance.sanitize_replace_char = "/"

        sanitized = self.backend_instance.sanitize_cmis_names(
            ['/y dir*', 'sub/dir'], ' ')
        self.assertEqual(sanitized, ['y dir', 'sub dir'])

    def test_get_unique_folder_name(self):
        mocked_parent = mock.MagicMock()
        # if no name found, the method return the same name
        repository = mock.MagicMock()
        mocked_parent.repository = repository
        query_result = mock.MagicMock()
        repository.query.side_effect = lambda *a: query_result
        query_result.getNumItems.side_effect = lambda *a: 0
        self.assertEqual('test', self.backend_instance.get_unique_folder_name(
            'test', mocked_parent))
        # if the same name is found and the folder_name_conflict_handler ==
        # 'error' a ValidationError is raised
        query_result.getNumItems.side_effect = lambda *a: 1
        self.backend_instance.folder_name_conflict_handler = 'error'
        with self.assertRaises(ValidationError):
            self.backend_instance.get_unique_folder_name('test', mocked_parent)

        self.cpt = 0

        def query(q):
            if self.cpt == 0:
                self.cpt += 1
                query_result.getNumItems.side_effect = lambda *a: 1
                return query_result
            if self.cpt == 1:
                test = mock.Mock()
                test.configure_mock()
                ret = []
                for v in ['test_(1)', 'test_(3)']:
                    m = mock.Mock()
                    m.configure_mock(name=v)
                    ret.append(m)
                query_result.__iter__.return_value = ret
                return query_result
            return None
        # if the same name is found and the folder_name_conflict_handler ==
        # 'increment' the method must return a new name with a suffix _(X)
        # where X is the value max found as X for the same name + 1
        self.backend_instance.folder_name_conflict_handler = 'increment'
        repository.query.side_effect = query
        name = self.backend_instance.get_unique_folder_name(
            'test', mocked_parent)
        self.assertEqual('test_(4)', name)
