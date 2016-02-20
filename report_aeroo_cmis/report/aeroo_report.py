# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import time

from openerp.exceptions import Warning
from openerp.tools.safe_eval import safe_eval
from openerp.addons.report_aeroo import report_aeroo


class Aeroo_report(report_aeroo.Aeroo_report):

    def create_single_pdf(self, cr, uid, ids, data, report_xml, context=None):
        if len(ids) > 1:
            raise Warning(
                "At this stage we should only have recieved 1 object")
        res = super(Aeroo_report, self).create_single_pdf(
            cr, uid, ids, data, report_xml, context=context)
        obj = self. getObjects_mod(
            cr, uid, ids, report_xml.report_type, context=context)[0]
        if obj.cmis_filename:
            name = safe_eval(obj.cmis_filename, {'object': obj, 'time': time})
        return res
