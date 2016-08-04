# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import functools
import json
import requests
import logging

from openerp import http
from openerp.http import request
from openerp.addons.web.controllers import main

_logger = logging.getLogger(__name__)

try:
    import werkzeug
except ImportError:
    _logger.debug('Cannot `import werkzeug`.')

CMIS_PROXY_PATH = '/cmis/1.1/browser'


def cmis_proxy_security_wrapper(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        # TODO Check token
        if 'token' in kwargs:
            kwargs.pop('token')
        res = f(*args, **kwargs)
        # TODO filter response
        return res
    return wrapper


class CmisProxy(http.Controller):

    def _get_cmis_backend(self):
        return request.env['cmis.backend'].search([(1, '=', 1)])

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

    def _foward_get_file(self, url, params):
        """Method called to retrieved the content associated to a cmis object.
        The content is streamed between the cmis container and the caller to
        avoid to suck the server memory
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

    def _forward_get(self, url_path, params):
        cmis_backend = self._get_cmis_backend()
        cmis_location = cmis_backend.location
        if cmis_location.endswith('/'):
            cmis_location = cmis_location[:-1]
        url = cmis_location + url_path
        if params.get('cmisselector') == 'content':
            return self._foward_get_file(url, params)
        r = requests.get(
            url, params=params,
            auth=(cmis_backend.username, cmis_backend.password))
        r.raise_for_status()
        if r.text:
            result = r.json()
            self._clean_url_in_dict(result, cmis_location,
                                    "CMIS_PROXY_PATH")
            response = werkzeug.Response(json.dumps(
                result), mimetype='application/json',
                headers=dict(r.headers.items()))
        else:
            response = werkzeug.Response()
        return response

    def _forward_post(self, url_path, params):
        """The CMIS Browser binding is designed to be queried from the browser
        Therefore, the parameters in a POST are expected to be submitted as
        HTTP multipart forms. Therefore each parameter in the request is
        forwarded as a part of a multipart/form-data.
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
            files[k] = (None, v)
        cmis_backend = self._get_cmis_backend()
        cmis_location = cmis_backend.location
        if cmis_location.endswith('/'):
            cmis_location = cmis_location[:-1]
        url = cmis_location + url_path
        r = requests.post(url, files=files,
                          auth=(cmis_backend.username, cmis_backend.password))
        r.raise_for_status()
        if r.text:
            result = r.json()
            self._clean_url_in_dict(result, cmis_location,
                                    CMIS_PROXY_PATH)
            response = werkzeug.Response(json.dumps(
                result), mimetype='application/json',
                headers=dict(r.headers.items()))
        else:
            response = werkzeug.Response()
        return response

    @cmis_proxy_security_wrapper
    @http.route(CMIS_PROXY_PATH, type='http', auth="user", methods=['GET'])
    @main.serialize_exception
    def call_cmis_services(self, *args, **kwargs):
        """Call at the root of the cmis repository. These calls are for
        requesting the global services provided by the CMIS Container
        """
        return self._forward_get('', kwargs)

    @cmis_proxy_security_wrapper
    @http.route(CMIS_PROXY_PATH + '/<root>', type='http', auth="user",
                methods=['GET'])
    @main.serialize_exception
    def call_get_cmis_repository(self, *args, **kwargs):
        """Call services provided by a specific repository. These calls are for
        requestion services on cmis contents
        """
        root = kwargs.pop('root')
        return self._forward_get("/" + root, kwargs)

    @cmis_proxy_security_wrapper
    @http.route(CMIS_PROXY_PATH + '/<root>', type='http', auth="user",
                methods=['POST'], csrf=False)
    @main.serialize_exception
    def call_post_cmis_repository(self, *args, **kwargs):
        """The base url to retrieve the repositories definition
        """
        root = kwargs.pop('root')
        return self._forward_post("/" + root, kwargs)
