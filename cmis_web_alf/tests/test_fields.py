# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from openerp.addons.cmis_field.tests import common


class TestCmisFields(common.BaseTestCmis):

    def test_cmis_folder_get_desciption(self):
        inst = self.env['cmis.test.model'].create({'name': 'folder_name'})
        # get_description is the method call by the method fields_get
        # to return to the UI the desciption of the UI
        descr = inst._fields['cmis_folder'].get_description(self.env)
        backend_description = descr.get('backend')
        share_location = backend_description.get(
            'share_location')
        alfresco_api_location = backend_description.get(
            'alfresco_api_location')
        self.assertEqual(
            self.cmis_backend.share_location, share_location)
        self.assertEqual(
            self.cmis_backend.alfresco_api_location, alfresco_api_location)
