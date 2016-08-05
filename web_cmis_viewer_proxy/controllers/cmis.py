# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import json
import werkzeug
import logging
import urlparse

from openerp import http
from openerp.http import request
from openerp.exceptions import AccessError
from openerp.addons.web.controllers import main

_logger = logging.getLogger(__name__)

try:
    import requests
except ImportError:
    _logger.debug('Cannot `import requests`.')

CMIS_PROXY_PATH = '/cmis/1.1/browser'


class CmisProxy(http.Controller):

    def _get_cmis_backend(self):
        return request.env['cmis.backend'].search([(1, '=', 1)])

    @property
    def _cmis_proxy_base_url(self):
        return urlparse.urljoin(request.httprequest.host_url, CMIS_PROXY_PATH)

    @classmethod
    def _clean_url_in_dict(cls, values, original, new):
        """Replace all occurences of the cmis container url in the json
        returned by a call to the cmis container by the one of the proxy"""
        if original.endswith('/'):
            original = original[:-1]
        for k, v in values.iteritems():
            if isinstance(v, dict):
                cls._clean_url_in_dict(v, original, new)
            elif hasattr(v, 'replace'):
                values[k] = v.replace(original, new)

    def _prepare_json_response(self, value, headers, cmis_backend,
                               model_inst=None):
        cmis_location = cmis_backend.location
        self._clean_url_in_dict(value,
                                urlparse.urlparse(cmis_location).geturl(),
                                self._cmis_proxy_base_url)
        headers['transfer-encoding'] = None
        response = werkzeug.Response(
            json.dumps(value), mimetype='application/json',
            headers=headers)
        return response

    @classmethod
    def _get_redirect_url(cls, cmis_backend, url_path):
        cmis_location = cmis_backend.location
        return urlparse.urljoin(cmis_location, url_path)

    def _foward_get_file(self, url, params):
        """Method called to retrieved the content associated to a cmis object.
        The content is streamed between the cmis container and the caller to
        avoid to suck the server memory
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        cmis_backend = self._get_cmis_backend()
        r = requests.get(
            url, params=params,
            stream=True,
            auth=(cmis_backend.username, cmis_backend.password))
        r.raise_for_status()
        return werkzeug.Response(
            r, headers=dict(r.headers.items()),
            direct_passthrough=True)

    def _forward_get(self, url_path, params, model_inst):
        """
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        cmis_backend = self._get_cmis_backend()
        url = self._get_redirect_url(cmis_backend, url_path)
        if params.get('cmisselector') == 'content':
            return self._foward_get_file(url, params)
        r = requests.get(
            url, params=params,
            auth=(cmis_backend.username, cmis_backend.password))
        r.raise_for_status()
        if r.text:
            return self._prepare_json_response(
                r.json(), dict(r.headers.items()), cmis_backend, model_inst)
        else:
            response = werkzeug.Response()
        return response

    def _forward_post(self, url_path, params, model_inst):
        """The CMIS Browser binding is designed to be queried from the browser
        Therefore, the parameters in a POST are expected to be submitted as
        HTTP multipart forms. Therefore each parameter in the request is
        forwarded as a part of a multipart/form-data.
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        files = {}
        if 'content' in params:
            # we are in a mulitpart form data'
            content = params.pop('content')
            files['content'] = (
                content.filename,
                content.stream,
                content.mimetype
            )
        for k, v in params.iteritems():
            # no filename for parts dedicated to HTTP Form data
            files[k] = (None, v, 'text/plain;charset=utf-8')
        cmis_backend = self._get_cmis_backend()
        url = self._get_redirect_url(cmis_backend, url_path)
        r = requests.post(url, files=files,
                          auth=(cmis_backend.username, cmis_backend.password))
        r.raise_for_status()
        if r.text:
            return self._prepare_json_response(
                r.json(), dict(r.headers.items()), cmis_backend, model_inst)
        else:
            response = werkzeug.Response()
        return response

    def _check_access(self, cmis_path, params):
        if 'token' in params:
            params.pop('token')
            #  TODO
        return None

    @http.route([CMIS_PROXY_PATH,
                 CMIS_PROXY_PATH + '/<path:cmis_path>'
                 ], type='http', auth="user", csrf=False,
                methods=['GET', 'POST'])
    @main.serialize_exception
    def call_cmis_services(self, cmis_path="", **kwargs):
        """Call at the root of the cmis repository. These calls are for
        requesting the global services provided by the CMIS Container
        """
        method = request.httprequest.method
        model_inst = self._check_access(cmis_path, kwargs)
        if method not in ['GET', 'POST']:
            raise AccessError("The HTTP METHOD %s is not supported by CMIS" %
                              method)
        if method == 'GET':
            response = self._forward_get(cmis_path, kwargs, model_inst)
        elif method == 'POST':
            response = self._forward_post(cmis_path, kwargs, model_inst)
        return response
