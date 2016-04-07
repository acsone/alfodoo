# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import json
import werkzeug
from openerp import http
from openerp.http import request
from openerp.addons.report_aeroo_cmis.controllers import reports
from openerp.addons.web.controllers import main


class Reports(reports.Reports):

    @http.route('/web/report', type='http', auth="user")
    @main.serialize_exception
    def index(self, action, token):
        return super(Reports, self).index(action, token)

    def redirect_to_cmis(self, cmis_objectid, backend_id, token):
        backend = request.env['cmis.backend'].browse(int(backend_id))
        url = backend.get_content_details_url(cmis_objectid)
        response = werkzeug.Response(json.dumps(
            {'url': url}),  mimetype='application/json')
        response.set_cookie('fileToken', token)
        return response
