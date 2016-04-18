# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from openerp import api, fields, models
from openerp.tools.translate import _
from openerp.report import interface

from ..report import Aeroo_report


class IrActionsReportXml(models.Model):
    _name = 'ir.actions.report.xml'
    _inherit = 'ir.actions.report.xml'

    cmis_filename = fields.Char(
        'Save in CMIS Prefix',
        help='This is the filename of the attachment used to store the '
             'printing result. Keep empty to not save the printed reports. '
             'You can use a python expression with the object and time '
             'variables. If your name contains path separators "/", the file '
             'will be stored into sthe specified subdirectory. (missing path'
             'elements are created if not found). The path is always '
             'interpreted as subpath of of the initial_directory_write '
             'defined on the cmis.bakend if the related object is not a '
             'cmis.folder, otherwise as a subpath of the cmis folder linked'
             'to the associated object of the report.')
    cmis_backend_id = fields.Many2one(
        comodel_name="cmis.backend",
        string="Backend",
        oldname="bakend_id",
        help='The backend to use if your report is not linked to an object or'
             'the linked object is not a cmis folder')
    cmis_duplicate_handler = fields.Selection(
        selection=[
            ('error',       _('Raise exception')),
            ('new_version', _('Create a new version')),
            ('increment',   _('Rename as file(X).pdf'))
        ],
        string='Strategy in case of duplicate',
        default='error')

    @api.model
    def register_report(self, name, model, tmpl_path, parser):
        name = 'report.%s' % name
        if name in interface.report_int._reports:
            del interface.report_int._reports[name]
        res = Aeroo_report(self.env.cr, name, model, tmpl_path, parser=parser)
        return res
