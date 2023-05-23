# Copyright 2019 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
import base64
import logging
import mimetypes
import os
from collections import namedtuple
from contextlib import contextmanager

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError
from odoo.tools import safe_eval
from odoo.tools.safe_eval import time

_logger = logging.getLogger(__name__)

SAVE_IN_CMIS_MARKER = "'{}'".format(id(object()))


class IrActionsReport(models.Model):

    _inherit = "ir.actions.report"

    cmis_filename = fields.Char(
        "Save in CMIS Prefix",
        help="This is the filename of the attachment used to store the "
        "printing result. Keep empty to not save the printed reports. "
        "You can use a python expression with the object and time "
        'variables. If your name contains path separators "/", the file '
        "will be stored into sthe specified subdirectory. (missing path"
        "elements are created if not found). The path is always "
        "interpreted as subpath of of the initial_directory_write "
        "defined on the cmis.bakend if the related object is not a "
        "cmis.folder, otherwise as a subpath of the cmis folder linked"
        "to the associated object of the report.",
    )
    cmis_parent_type = fields.Selection(
        selection=[
            (
                "backend",
                _("Store as child of the directory defined on the " "backend"),
            ),
            (
                "folder_field",
                _("Store as child of the folder on the related " "model"),
            ),
        ],
        default="backend",
    )
    cmis_backend_id = fields.Many2one(
        comodel_name="cmis.backend",
        string="Backend",
        help="The backend to use if no CmisFolder field is specified",
    )
    cmis_folder_field_id = fields.Many2one(
        comodel_name="ir.model.fields",
        string="Save generated report into",
        help="""If empty, deadline will be computed
                from the task creation date""",
    )
    cmis_duplicate_handler = fields.Selection(
        selection=[
            ("use_existing", _("Use existing")),
            ("error", _("Raise exception")),
            ("new_version", _("Create a new version")),
            ("increment", _("Rename as file(X).pdf")),
        ],
        string="Strategy in case of duplicate",
        default="error",
    )
    cmis_objectTypeId = fields.Char(
        "CMIS content type",
        default="cmis:document",
        help="Only applied at creation",
    )
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
        " 'cm:description': object.notes}\n",
    )

    ##################
    # method overrides
    ##################

    @api.model_create_multi
    def create(self, vals_list):
        self._cleanup_vals(vals_list)
        return super().create(vals_list)

    def write(self, vals):
        self._cleanup_vals([vals])
        return super().write(vals)

    @contextmanager
    def save_in_attachment_if_required(self):
        # The call to postprocess_pdf_report method is only triggered
        # if the report is flagged with attachment_use. Force the flag
        # to be sure that this method is also called when we want to store
        # files into cmis
        initial_attachment_use = self.attachment_use
        try:
            if self.cmis_filename and not self.attachment:
                self.sudo().write(
                    {"attachment": SAVE_IN_CMIS_MARKER, "attachment_use": True}
                )
            yield
        finally:
            if self.attachment == SAVE_IN_CMIS_MARKER:
                self.sudo().write(
                    {
                        "attachment": False,
                        "attachment_use": initial_attachment_use,
                    }
                )

    def _render_qweb_pdf(self, report_ref, res_ids, data=None):
        report = self._get_report(report_ref)
        with report.save_in_attachment_if_required():
            return super(
                IrActionsReport,
                self.with_context(cmis_report_keys=(report, SAVE_IN_CMIS_MARKER)),
            )._render_qweb_pdf(report_ref, res_ids, data=data)

    def retrieve_attachment(self, record):
        if self.attachment != SAVE_IN_CMIS_MARKER:
            return super().retrieve_attachment(record)
        if self._get_backend(record) and self.cmis_duplicate_handler == "use_existing":
            return self._retrieve_cmis_attachment(record)
        return None

    ##################
    # specific methods
    ##################

    @api.constrains(
        "cmis_filename",
        "cmis_backend_id",
        "cmis_folder_field_id",
        "cmis_parent_type",
    )
    def _check_cmis_config(self):
        for rec in self:
            if not rec.cmis_filename:
                continue
            if rec.cmis_parent_type == "backend" and not rec.cmis_backend_id:
                raise ValidationError(
                    _("You must specify a backend to use to store your " "file in CMIS")
                )
            if rec.cmis_parent_type == "folder_field" and not rec.cmis_folder_field_id:
                raise ValidationError(
                    _(
                        "You must select the folder field to use to "
                        "store your file in CMIS"
                    )
                )

    def _cleanup_vals(self, vals_list):
        for vals in vals_list:
            cmis_parent_type = vals.get("cmis_parent_type")
            if cmis_parent_type == "backend":
                vals["cmis_folder_field_id"] = None
            elif cmis_parent_type == "folder_field":
                vals["cmis_backend_id"] = None

    def _retrieve_cmis_attachment(self, record):
        res = self.env["ir.attachment"]
        cmis_filename = self._get_cmis_filename(record)
        if not cmis_filename:
            # no filename -> no doc to generate
            return res
        # Get the parent forlder
        cmis_parent_folder = self._get_cmis_parent_folder(record, cmis_filename)
        cmis_filename = os.path.basename(cmis_filename)
        # Search into the folder if a doc with the same name already
        # exists
        cmis_repo = cmis_parent_folder.repository
        cmis_qry = (
            "SELECT cmis:objectId FROM cmis:document WHERE "
            "IN_FOLDER('%s') AND cmis:name='%s'"
            % (cmis_parent_folder.getObjectId(), cmis_filename)
        )
        _logger.debug("Query CMIS with %s", cmis_qry)
        rs = cmis_repo.query(cmis_qry)
        num_found_items = rs.getNumItems()
        if not num_found_items:
            return res
        # A doc exists, load the content...
        cmis_object_id = rs.getResults()[0].getObjectId()
        cmis_document = cmis_repo.getObject(cmis_object_id)
        content = cmis_document.getContentStream().read()
        return res.new(
            {
                "datas": base64.b64encode(content),
                "mimetype": self.get_mimetype(cmis_filename),
            }
        )

    def _get_cmis_filename(self, record):
        self.ensure_one()
        return self._safe_eval(self.cmis_filename, record)

    def _get_backend(self, record):
        self.ensure_one()
        if self.cmis_folder_field_id:
            field = record._fields[self.cmis_folder_field_id.name]
            return field.get_backend(self.env)
        return self.cmis_backend_id

    def _get_eval_context(self, record):
        self.ensure_one()
        return {
            "object": record,
            "time": time,
            "cmis_backend": self._get_backend(record),
            "_": _,
            "user": self.env.user,
            "context": self.env.context,
        }

    def _safe_eval(self, source, record):
        self.ensure_one()
        return safe_eval.safe_eval(source, self._get_eval_context(record))

    def _save_in_cmis(self, record, buffer):
        self.ensure_one()
        cmis_filename = self._get_cmis_filename(record)
        if not cmis_filename:
            # can be false to allow condition in filename
            return None
        cmis_parent_folder = self._get_cmis_parent_folder(record, cmis_filename)
        cmis_filename = os.path.basename(cmis_filename)
        return self._create_or_update_cmis_document(
            buffer, record, cmis_filename, cmis_parent_folder
        )

    def _get_cmis_parent_folder(self, record, cmis_filename):
        self.ensure_one()
        if self.cmis_folder_field_id:
            # the self must be saved into the folder referenced by the
            # CmisFolder field
            field_name = self.cmis_folder_field_id.name
            field = record._fields[field_name]
            cmis_backend = field.get_backend(self.env)
            root_objectId = record[field_name]
            if not root_objectId:
                # the folder must be initialized on demand
                field.create_value(record)
                root_objectId = record[field_name]
        else:
            root_objectId = self.cmis_backend_id.initial_directory_write
            cmis_backend = self.cmis_backend_id
        # the generated name can contains sub directories
        path = os.path.dirname(cmis_filename)
        if not path:
            return cmis_backend.get_cmis_repository().getObject(root_objectId)
        return cmis_backend.get_folder_by_path(
            path, create_if_not_found=True, cmis_parent_objectid=root_objectId
        )

    @api.model
    def get_mimetype(self, file_name):
        return mimetypes.guess_type(file_name)[0]

    @api.model
    def _sanitize_query_arg(self, arg):
        return arg.replace("'", r"\'")

    def _create_or_update_cmis_document(
        self, buffer, record, file_name, cmis_parent_folder
    ):
        """Create or update a cmis document according to
        cmis_duplicate_handler.
        return the created or update cmis doc
        """
        self.ensure_one()
        qfile_name = self._sanitize_query_arg(file_name)
        cmis_qry = (
            "SELECT cmis:objectId FROM cmis:document WHERE "
            "IN_FOLDER('%s') AND cmis:name='%s'"
            % (cmis_parent_folder.getObjectId(), qfile_name)
        )
        _logger.debug("Query CMIS with %s", cmis_qry)
        rs = cmis_parent_folder.repository.query(cmis_qry)
        is_new = False
        num_found_items = rs.getNumItems()
        if num_found_items == 0 or self.cmis_duplicate_handler == "increment":
            if num_found_items > 0:
                name, ext = os.path.splitext(file_name)
                testname = name + "(*)" + ext
                rs = cmis_parent_folder.getChildren(filter="cmis:name=%s" % testname)
                file_name = name + "(%d)" % rs.getNumItems() + ext
            doc = self._create_cmis_document(
                buffer, record, file_name, cmis_parent_folder
            )
            return UniqueDocInfo(doc, is_new)
        if num_found_items > 0 and self.cmis_duplicate_handler == "new_version":
            doc = cmis_parent_folder.repository.getObject(
                rs.getResults()[0].getObjectId()
            )
            doc = self._update_cmis_document(buffer, record, file_name, doc)
            return UniqueDocInfo(doc, is_new)

        raise UserError(_('Document "%s" already exists in CMIS') % (file_name))

    def _create_cmis_document(self, buffer, record, file_name, cmis_parent_folder):
        self.ensure_one()
        props = {"cmis:name": file_name}
        if self.cmis_objectTypeId:
            props["cmis:objectTypeId"] = self.cmis_objectTypeId
        props.update(self._get_cmis_properties(record))
        mimetype = self.get_mimetype(file_name)
        doc = cmis_parent_folder.createDocument(
            file_name,
            properties=props,
            contentFile=buffer,
            contentType=mimetype,
        )
        return doc

    def _update_cmis_document(self, buffer, record, file_name, cmis_doc):
        self.ensure_one()
        # increment version
        props = self._get_cmis_properties(record)
        if "cmis:secondaryObjectTypeIds" in props:
            # no update aspects
            del props["cmis:secondaryObjectTypeIds"]
        mimetype = self.get_mimetype(file_name)
        cmis_doc = cmis_doc.checkout()
        cmis_doc = cmis_doc.checkin(
            checkinComment=_("Generated by Odoo"),
            contentFile=buffer,
            contentType=mimetype,
            major=False,
            properties=props,
        )

        return cmis_doc

    def _get_cmis_properties(self, record):
        self.ensure_one()
        if self.cmis_properties:
            return self._safe_eval(self.cmis_properties, record)
        return {}


UniqueDocInfo = namedtuple("UniqueDoc", ["doc", "is_new"])
