# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import http
from openerp.http import request
from openerp.exceptions import AccessError
from openerp.addons.web.controllers import main

from openerp.addons.cmis_web_proxy.controllers import cmis

ALFRESCO_API_PROXY_PATH = '/alfresco/s/api'


class AlfrescoProxy(cmis.CmisProxy):

    def _check_alfresco_access(self, cmis_backend, params):
        token = self._check_provided_token("/", cmis_backend, params)
        if not token:
            raise AccessError("Bad request")
        # check access to object from token
        model_inst, field_name = self._decode_token(
            "/", cmis_backend, params, token)
        if not self._check_cmis_content_access(
                "/", cmis_backend, params, model_inst, field_name):
            raise AccessError("Bad request")
        if not self._check_access_operation(model_inst, "read"):
            raise AccessError("Bad request")
        return True

    @http.route([
        ALFRESCO_API_PROXY_PATH +
        '/<string:backend_id>'
        '/content/thumbnails/pdf/' +
        '<string:cmis_name>',
        ], type='http', auth="user", csrf=False, methods=['GET'])
    @main.serialize_exception
    def get_thumnails(self, backend_id, cmis_name,
                      **kwargs):
        """Call at the root of the CMIS repository. These calls are for
        requesting the global services provided by the CMIS Container
        """
        # use a dedicated cache to get the backend
        cmis_backend = request.env['cmis.backend'].get_by_id(backend_id)
        if cmis_backend.apply_odoo_security:
            self._check_alfresco_access(cmis_backend, kwargs)
        url = (cmis_backend.alfresco_api_location +
               '/node/workspace/SpacesStore/' +
               kwargs['versionSeriesId'] +
               '/content/thumbnails/pdf/' +
               cmis_name)
        params = {
            'c': kwargs['c'],
            'lastModified': kwargs['lastModified']
        }
        print url
        return self._forward_get_file(url, cmis_backend, params)
