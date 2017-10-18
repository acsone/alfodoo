# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import _, http
from odoo.http import request
from odoo.exceptions import AccessError
from odoo.addons.web.controllers import main

from odoo.addons.cmis_web_proxy.controllers import cmis

ALFRESCO_API_PROXY_PATH = '/alfresco/s/api'


class AlfrescoProxy(cmis.CmisProxy):

    def _check_alfresco_access(self, proxy_info, params):
        token = self._check_provided_token("/", proxy_info, params)
        if not token:
            raise AccessError(_("Bad request"))
        # check access to object from token
        model_inst, field_name = self._decode_token(
            "/", proxy_info, params, token)
        if not self._check_cmis_content_access(
                "/", proxy_info, params, model_inst, field_name):
            raise AccessError(_("Bad request"))
        if not self._check_access_operation(model_inst, "read"):
            raise AccessError(_("Bad request"))
        return True

    @http.route([
        ALFRESCO_API_PROXY_PATH +
        '/<int:backend_id>'
        '/content/thumbnails/pdf/' +
        '<string:cmis_name>',
        ], type='http', auth="user", csrf=False, methods=['GET'])
    @main.serialize_exception
    def get_thumnails(self, backend_id, cmis_name,
                      **kwargs):
        """Call at the root of the CMIS repository. These calls are for
        requesting the global services provided by the CMIS Container
        """
        # proxy_info are information available into the cache without loading
        # the cmis.backend from the database
        proxy_info = request.env['cmis.backend'].get_proxy_info_by_id(
            backend_id)
        if proxy_info['apply_odoo_security']:
            self._check_alfresco_access(proxy_info, kwargs)
        url = (proxy_info['alfresco_api_location'] +
               '/node/workspace/SpacesStore/' +
               kwargs['versionSeriesId'] +
               '/content/thumbnails/pdf/' +
               cmis_name)
        params = {
            'c': kwargs['c'],
            'lastModified': kwargs['lastModified']
        }
        return self._forward_get_file(url, proxy_info, params)
