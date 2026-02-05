# Copyright 2022 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

import base64
import logging
import mimetypes
import os
from io import BytesIO

from odoo import _, api, fields, models
from odoo.exceptions import UserError
from odoo.osv.expression import AND

_logger = logging.getLogger(__name__)


class MailComposeMessage(models.TransientModel):
    _inherit = "mail.compose.message"

    is_save_in_cmis_enabled = fields.Boolean(
        string="Save attachments in CMIS",
        default=False,
    )
    cmis_folder_selection = fields.Selection(
        selection="_selection_cmis_folder_selection",
        string="CMIS Folder",
    )
    has_cmis_fields = fields.Boolean(
        default=False,
    )
    is_multiple_cmis_fields = fields.Boolean(
        readonly=True,
    )
    cmis_folder_field_id = fields.Many2one(
        compute="_compute_cmis_folder_field_id",
        compute_sudo=True,
        comodel_name="ir.model.fields",
    )
    cmis_duplicate_handler = fields.Selection(
        selection=[
            ("use_existing", "Use existing"),
            ("error", "Raise exception"),
            ("new_version", "Create a new version"),
            ("increment", "Rename as file(X).pdf"),
        ],
        string="Duplicate strategy",
        default="increment",
    )

    @api.model
    def default_get(self, fields):  # pylint:disable=redefined-outer-name
        res = super().default_get(fields)
        related_model = res.get("model")
        if not related_model:
            return res
        cmis_fields = self.with_context(
            cmis_mail_model_required=True
        )._selection_cmis_folder_selection()
        if cmis_fields:
            res.update(
                {
                    "cmis_folder_selection": str(cmis_fields[0][0]),
                    "has_cmis_fields": True,
                    "is_multiple_cmis_fields": len(cmis_fields) > 1,
                }
            )
        return res

    @api.model
    def _selection_cmis_folder_selection(self):
        related_model = self.env.context.get("default_model")
        domain = [("ttype", "=", "cmis_folder")]
        if related_model:
            domain = AND([domain, [("model", "=", related_model)]])
        elif self.env.context.get("cmis_mail_model_required"):
            return []
        cmis_fields = self.env["ir.model.fields"].sudo().search(domain)
        return [
            (str(cmis_field.id), cmis_field.display_name) for cmis_field in cmis_fields
        ]

    @api.depends("cmis_folder_selection")
    def _compute_cmis_folder_field_id(self):
        fields_model = self.env["ir.model.fields"].sudo()
        for rec in self:
            field_id = rec.cmis_folder_selection
            if not field_id:
                rec.cmis_folder_field_id = False
                continue
            rec.cmis_folder_field_id = fields_model.search(
                [("id", "=", int(rec.cmis_folder_selection))]
            )

    def _get_cmis_parent_folder(self):
        self.ensure_one()
        field_name = self.cmis_folder_field_id.sudo().name
        related_record = self.env[self.model].browse(self.res_id)
        field = related_record._fields[field_name]
        cmis_backend = field.get_backend(self.env)
        root_objectId = related_record[field_name]
        if not root_objectId:
            field.create_value(related_record)
            root_objectId = related_record[field_name]
        return cmis_backend.get_cmis_repository().getObject(root_objectId)

    @api.model
    def get_mimetype(self, file_name):
        return mimetypes.guess_type(file_name)[0]

    @api.model
    def _sanitize_query_arg(self, arg):
        return arg.replace("'", r"\'")

    def _cmis_document_exists(self, cmis_parent_folder, file_name):
        qfile_name = self._sanitize_query_arg(file_name)
        cmis_qry = (
            "SELECT cmis:objectId FROM cmis:document WHERE "
            "IN_FOLDER('%s') AND cmis:name='%s'"
            % (cmis_parent_folder.getObjectId(), qfile_name)
        )
        _logger.debug("Query CMIS with %s", cmis_qry)
        rs = cmis_parent_folder.repository.query(cmis_qry)
        num_found_items = rs.getNumItems()
        return num_found_items > 0, rs

    def _save_attachments_in_cmis(self):
        self.ensure_one()
        if not self.model or not self.res_id:
            return
        cmis_parent_folder = self._get_cmis_parent_folder()
        for attachment in self.attachment_ids:
            file_name = attachment.name
            buffer = BytesIO(base64.b64decode(attachment.datas))
            cmis_document_exists, rs = self._cmis_document_exists(
                cmis_parent_folder, file_name
            )
            if not cmis_document_exists or self.cmis_duplicate_handler == "increment":
                if cmis_document_exists:
                    name, ext = os.path.splitext(file_name)
                    testname = name + "(*)" + ext
                    rs = cmis_parent_folder.getChildren(
                        filter="cmis:name=%s" % testname
                    )
                    file_name = name + "(%d)" % rs.getNumItems() + ext
                self._create_cmis_document(
                    buffer,
                    file_name,
                    cmis_parent_folder,
                )
            if cmis_document_exists and self.cmis_duplicate_handler == "new_version":
                doc = cmis_parent_folder.repository.getObject(
                    rs.getResults()[0].getObjectId()
                )
                self._update_cmis_document(buffer, file_name, doc)
            if self.cmis_duplicate_handler == "error":
                raise UserError(_('Document "%s" already exists in CMIS') % (file_name))

    def _create_cmis_document(self, buffer, file_name, cmis_parent_folder):
        self.ensure_one()
        props = {
            "cmis:name": file_name,
        }
        mimetype = self.get_mimetype(file_name)
        return cmis_parent_folder.createDocument(
            file_name,
            properties=props,
            contentFile=buffer,
            contentType=mimetype,
        )

    def _update_cmis_document(self, buffer, file_name, cmis_doc):
        self.ensure_one()
        props = {
            "cmis:name": file_name,
        }
        mimetype = self.get_mimetype(file_name)
        cmis_doc = cmis_doc.checkout()
        return cmis_doc.checkin(
            checkinComment=_("Saved from Odoo mail composer"),
            contentFile=buffer,
            contentType=mimetype,
            major=False,
            properties=props,
        )

    def _action_send_mail(self, auto_commit=False):
        res = super()._action_send_mail(auto_commit=auto_commit)
        for rec in self:
            if rec.is_save_in_cmis_enabled:
                rec._save_attachments_in_cmis()
        return res
