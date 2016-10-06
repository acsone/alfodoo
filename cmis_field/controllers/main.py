# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html)
from odoo import http


class CmisController(http.Controller):

    @http.route('/web/cmis/field/create_value', type='json', methods=['POST'],
                auth="user")
    def create_field_value(self, model_name, res_id, field_name):
        model_inst = http.request.env[model_name].browse(int(res_id))
        model_inst._fields[field_name].create_value(model_inst)
        value = getattr(model_inst, field_name)
        return {'value': value}
