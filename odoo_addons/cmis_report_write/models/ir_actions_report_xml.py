# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from openerp import api, fields, models, _
from openerp.exceptions import ValidationError


class IrActionsReportXml(models.Model):

    _inherit = 'ir.actions.report.xml'

    @api.constrains('cmis_filename', 'cmis_backend_id', 'cmis_folder_field_id',
                    'cmis_parent_type')
    def _check_cmis_config(self):
            for rec in self:
                if not rec.cmis_filename:
                    continue
                if rec.cmis_parent_type == 'backend' and \
                        not rec.cmis_backend_id:
                    raise ValidationError(
                        _('You must specify a backend to use to store your '
                          'file in CMIS'))
                elif rec.cmis_parent_type == 'folder_field' and \
                        not rec.cmis_folder_field_id:
                    raise ValidationError(
                        _('You must select the folder field to use to '
                          'store your file in CMIS'))

    def _cleanup_vals(self, vals):
        cmis_parent_type = vals.get('cmis_parent_type')
        if cmis_parent_type == 'backend':
            vals['cmis_folder_field_id'] = None
        elif cmis_parent_type == 'folder_field':
            vals['cmis_backend_id'] = None

    @api.model
    @api.returns('self', lambda value: value.id)
    def create(self, vals):
        self._cleanup_vals(vals)
        return super(IrActionsReportXml, self).create(vals)

    @api.multi
    def write(self, vals):
        self._cleanup_vals(vals)
        return super(IrActionsReportXml, self).write(vals)

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
    cmis_parent_type = fields.Selection(
        selection=[
            ('backend', _('Store as child of the directory defined on the '
                          'backend')),
            ('folder_field', _('Store as child of the folder on the related '
                               'model'))
        ],
        default='backend'
    )
    cmis_backend_id = fields.Many2one(
        comodel_name="cmis.backend",
        string="Backend",
        help='The backend to use if no CmisFolder field is specified')
    cmis_folder_field_id = fields.Many2one(
        comodel_name='ir.model.fields', string="Save generated report into",
        help="""If empty, deadline will be computed
                from the task creation date""")
    cmis_duplicate_handler = fields.Selection(
        selection=[
            ('error', _('Raise exception')),
            ('new_version', _('Create a new version')),
            ('increment', _('Rename as file(X).pdf'))
        ],
        string='Strategy in case of duplicate',
        default='error')
    cmis_objectTypeId = fields.Char(
        "CMIS content type",
        default="cmis:document",
        help='Only applied at creation')
    cmis_properties = fields.Text(
        "CMIS properties",
        help="Use this field to put additiannal properties to apply to "
             "content created in CMIS. If used, the text will be interpreted "
             "as a python expression that must return a valid python "
             "dictionary that will be passed as parameter to the cmislib. "
             "The object and time are available as variable into the python "
             "context i.e.:\n"
             "{'cmis:secondaryObjectTypeIds': ['P:cm:titled'], \n "
             " 'cmis:title': object.name,\n"
             " 'cm:description': object.notes}\n")
