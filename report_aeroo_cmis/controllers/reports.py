# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import json
import time
import base64
import zlib
import werkzeug.utils
from openerp import http
from openerp.http import request
from openerp.addons.web.controllers import main


class Reports(main.Reports):

    @http.route('/web/report', type='http', auth="user")
    @main.serialize_exception
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

    def redirect_to_cmis(self, cmis_objectid, backend_id, token):
        backend = request.env['cmis.backend'].browse(int(backend_id))
        repo = backend.check_auth()
        url = "%s?objectId=%s&selector=content" % (
             repo.getRootFolderUrl(), cmis_objectid)
        # here we don't use http.redirect_with_hash
        # since we need to return the token in the
        # redirect response to unlock the UI
        response = werkzeug.utils.redirect(url, 303)
        response.set_cookie('fileToken', token)
        return response
