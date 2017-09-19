# -*- coding: utf-8 -*-
# © 2014-2015 Savoir-faire Linux (<http://www.savoirfairelinux.com>).
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import mock

from openerp.tests import common


class TestCmisBackend(common.SavepointCase):

    def setUp(self):
        super(TestCmisBackend, self).setUp()
        self.cmis_backend = self.env['cmis.backend']
        self.backend_instance = self.env.ref('cmis.cmis_backend_alfresco')

    def test_get_content_details_url(self):
        with mock.patch("openerp.addons.cmis.models.cmis_backend."
                        "CmisBackend.get_cmis_repository") as \
                mocked_get_repository:
            mocked_cmis_repository = mock.MagicMock()
            mocked_get_repository.return_value = mocked_cmis_repository
            mocked_cmis_object = mock.MagicMock()
            mocked_cmis_repository.getObject.return_value = mocked_cmis_object
            # test folder url without cmis:path
            mocked_cmis_object.getProperties.return_value = {
                'cmis:baseTypeId': 'cmis:folder',
                'cmis:path': None,
                'alfcmis:nodeRef': 'alfnoderef'}
            url = self.backend_instance.get_content_details_url('my_id')
            self.assertEqual(
                url,
                'http://localhost:8080/share/page/folder-details'
                '?nodeRef=alfnoderef')
            # test folder url with cmis:path
            mocked_cmis_object.getProperties.return_value = {
                'cmis:baseTypeId': 'cmis:folder',
                'cmis:path': '/odoo/my-folder',
                'alfcmis:nodeRef': 'alfnoderef'}
            url = self.backend_instance.get_content_details_url('my_id')
            self.assertEqual(
                url,
                'http://localhost:8080/share/page/repository'
                '#filter=path%7C%2Fodoo%2Fmy-folder')
            # test document
            mocked_cmis_object.getProperties.return_value = {
                'cmis:baseTypeId': 'cmis:document',
                'alfcmis:nodeRef': 'alfnoderef'}
            url = self.backend_instance.get_content_details_url('my_id')
            self.assertEqual(
                url,
                'http://localhost:8080/share/page/document-details'
                '?nodeRef=alfnoderef')
