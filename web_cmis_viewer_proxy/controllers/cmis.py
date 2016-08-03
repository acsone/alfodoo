# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from cmislib.model import CmisClient
import cmislib.exceptions
from cmislib.net import RESTService as Rest
from cmislib.browser.binding import BrowserBinding, encode_multipart_formdata

import json
import time
import base64
import zlib
import werkzeug
import werkzeug.utils
from openerp import http
from openerp.http import request
from openerp.addons.web.controllers import main
import urllib
from cStringIO import StringIO
from openerp.loglevels import ustr


class CmisProxy(main.Reports):

    def _get_cmis_backend(self):
        return request.env['cmis.backend'].search([(1, '=', 1)])

    def _get_cmis_client(self):
        cmis_backend = self._get_cmis_backend()
        cmis_client = CmisClient(
            cmis_backend.location,
            cmis_backend.username,
            cmis_backend.password,
            binding=BrowserBinding())
        return cmis_client

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

    @http.route('/cmis/1.1/browser', type='http', auth="user")
    @main.serialize_exception
    def call_cmis_services(self, *args, **kwargs):
        """The base url to retrieve the repositories definition
        """
        cmis_backend = self._get_cmis_backend()
        binding = BrowserBinding()
        result = binding.get(
            cmis_backend.location, cmis_backend.username, 
            cmis_backend.password)
        self._clean_url_in_dict(result, cmis_backend.location,
                                "/cmis/1.1/browser")
        response = werkzeug.Response(json.dumps(
            result), mimetype='application/json')
        return response


    @http.route('/cmis/1.1/browser/<root>', type='http', auth="user",
                methods=['GET'])
    @main.serialize_exception
    def call_get_cmis_repository(self, *args, **kwargs):
        """The base url to retrieve the repositories definition
        """
        root = kwargs.pop('root')
        if 'token' in kwargs:
            kwargs.pop('token')
        cmis_backend = self._get_cmis_backend()
        binding = BrowserBinding()
        if kwargs.get('cmisselector') == 'content':
            result, content = Rest().get(
                cmis_backend.location + root, cmis_backend.username, 
                cmis_backend.password, **kwargs)
            if result['status'] != '200':
                return werkzeug.Response(result.reason, status=result.status)
            result['content-location'] = result['content-location'].replace(cmis_backend.location,'/cmis/1.1/browser/' ) 
            return werkzeug.Response(content, headers=result)
        result = binding.get(
            cmis_backend.location + root, cmis_backend.username, 
            cmis_backend.password, **kwargs)
        self._clean_url_in_dict(result, cmis_backend.location,
                                "/cmis/1.1/browser/")
        response = werkzeug.Response(json.dumps(
            result), mimetype='application/json')
        return response

    @http.route('/cmis/1.1/browser/<root>', type='http', auth="user",
                methods=['POST'], csrf=False)
    @main.serialize_exception
    def call_post_cmis_repository(self, *args, **kwargs):
        """The base url to retrieve the repositories definition
        """
        root = kwargs.pop('root')
        if 'token' in kwargs:
            kwargs.pop('token')
        contentType = request.httprequest.headers.get('Content-Type')
        if 'content' in kwargs:
            # we are in a mulitpart form data'
            content = kwargs.pop('content')
            fields = {}
            # remove all unicode key and value. Everything must be utf-8
            # encodede to avoid InicodeDecodeError when processing the request
            for k, v in kwargs.iteritems():
                fields[k.encode('utf-8')] = v.encode('utf-8')
            fields['cmis:name'] = content.filename.encode('utf-8')
            contentType, payload = encode_multipart_formdata(
                fields, content.stream, contentType=content.mimetype.encode('utf-8'))
        else:
            payload = urllib.urlencode(kwargs)
        cmis_backend = self._get_cmis_backend()
        binding = BrowserBinding()
        result = binding.post(
            url=(cmis_backend.location + root).encode('utf-8'),
            payload=payload,
            contentType=contentType,
            username=cmis_backend.username, 
            password=cmis_backend.password)
        if result:
            self._clean_url_in_dict(result, cmis_backend.location,
                                "/cmis/1.1/browser/")
            response = werkzeug.Response(json.dumps(
                result), mimetype='application/json')
        else:
            response = werkzeug.Response()
        return response

    def index(self, action, token):
        """Override the base method to manage custom extension: 'cmis'
        When a report is stored in CMIS the report generator return a tuple
        as (cmis_objectid, cmis@backend.id)
        If the extensiont part (the second one) of the tuple contains @cmis,
        in place of returning the generated content, we redirect the user to
        the report into the cmis container
        """
        action = json.loads(action)

        report_srv = request.session.proxy("report")
        context = dict(request.context)
        context.update(action["context"])

        report_data = {}
        report_ids = context.get("active_ids", None)
        if 'report_type' in action:
            report_data['report_type'] = action['report_type']
        if 'datas' in action:
            if 'ids' in action['datas']:
                report_ids = action['datas'].pop('ids')
            report_data.update(action['datas'])

        report_id = report_srv.report(
            request.session.db, request.session.uid, request.session.password,
            action["report_name"], report_ids,
            report_data, context)

        report_struct = None
        while True:
            report_struct = report_srv.report_get(
                request.session.db, request.session.uid,
                request.session.password, report_id)
            if report_struct["state"]:
                break

            time.sleep(self.POLLING_DELAY)

        report = base64.b64decode(report_struct['result'])
        fmt = report_struct['format']
        if 'cmis@' in fmt:
            return self.redirect_to_cmis(
                report, fmt.replace('cmis@', ''), token)
        if report_struct.get('code') == 'zlib':
            report = zlib.decompress(report)
        report_mimetype = self.TYPES_MAPPING.get(
            report_struct['format'], 'octet-stream')
        file_name = action.get('name', 'report')
        if 'name' not in action:
            reports = request.session.model('ir.actions.report.xml')
            res_id = reports.search(
                [('report_name', '=', action['report_name'])],
                context=context)
            if len(res_id) > 0:
                file_name = reports.read(res_id[0], ['name'], context)['name']
            else:
                file_name = action['report_name']
        file_name = '%s.%s' % (file_name, report_struct['format'])

        return request.make_response(
            report,
            headers=[
                ('Content-Disposition', main.content_disposition(file_name)),
                ('Content-Type', report_mimetype),
                ('Content-Length', len(report))],
            cookies={'fileToken': token})

    def redirect_to_cmis(self, cmis_objectid, cmis_backend_id, token):
        backend = request.env['cmis.backend'].browse(int(cmis_backend_id))
        repo = backend.check_auth()
        url = "%s?objectId=%s&selector=content" % (
            repo.getRootFolderUrl(), cmis_objectid)
        # here we don't use http.redirect_with_hash
        # since we need to return the token in the
        # redirect response to unlock the UI
        response = werkzeug.utils.redirect(url, 303)
        response.set_cookie('fileToken', token)
        return response
