# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import os
from cmislib import CmisClient
from cmislib.browser.binding import BrowserBinding

import openerp.tests.common as common
from ..controllers import cmis


class TestCmisProxy(common.HttpCase):
    
    def setUp(self):
        super(TestCmisProxy, self).setUp()
        cmis_location = os.environ.get('CMIS_LOCATION')
        cmis_user = os.environ.get('CMIS_USER')
        cmis_pwd = os.environ.get('CMIS_PWD')
        if not cmis_location or not cmis_user or not cmis_pwd:
            self.skipTest("To run these tests you must provide the following "
                          "env var: CMIS_LOCATION, CMIS_USER, CMIS_PWD")
        cmis_backend = self.env['cmis.backend']
        cmis_backend.search([(1, '=', 1)]).unlink()
        cmis_backend.create({
            'name' : 'TEST_CMIS_PROXY',
            'location': cmis_location,
            'is_cmis_proxy': True,
            'username': cmis_user,
            'password': cmis_pwd
        })
        url = 'http://%s:%d%s' % (common.HOST, common.PORT,
                                  cmis.CMIS_PROXY_PATH)
        self.cmis_client = CmisClient(url, 'admin', 'admin',
                                      binding=BrowserBinding())


    def test_cmis_services(self):
        """
        """