# Copyright 2022 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

import base64
import mimetypes
from io import BytesIO

from odoo import api, fields, models


class MailComposeMessage(models.TransientModel):
    _inherit = "mail.compose.message"

    is_save_in_cmis_enabled = fields.Boolean(
        string="Store attachments in CMIS",
        default=False,
    )
    allowed_cmis_folder_field_ids = fields.Many2many(
        comodel_name="ir.model.fields",
        readonly=True,
    )
    is_multiple_cmis_fields = fields.Boolean(
        readonly=True,
    )
    cmis_folder_field_id = fields.Many2one(
        string="Save attachments into",
        comodel_name="ir.model.fields",
        domain="[('id', 'in', allowed_cmis_folder_field_ids.ids)]",
    )

    @api.model
    def default_get(self, fields):  # pylint:disable=redefined-outer-name
        res = super().default_get(fields)
        related_model = res.get("model")
        if not related_model:
            return res
        cmis_fields = self.env["ir.model.fields"].search(
            [("model", "=", related_model), ("ttype", "=", "cmis_folder")]
        )
        if cmis_fields:
            res.update(
                {
                    "allowed_cmis_folder_field_ids": [(6, 0, cmis_fields.ids)],
                    "cmis_folder_field_id": cmis_fields[0].id,
                    "is_multiple_cmis_fields": len(cmis_fields) > 1,
                }
            )
        return res

    def _get_cmis_parent_folder(self):
        self.ensure_one()
        field_name = self.cmis_folder_field_id.name
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

    def _save_attachments_in_cmis(self):
        self.ensure_one()
        if not self.model or not self.res_id:
            return
        for attachment in self.attachment_ids:
            props = {
                "cmis:name": attachment.name,
            }
            mimetype = self.get_mimetype(attachment.name)
            cmis_parent_folder = self._get_cmis_parent_folder()
            cmis_parent_folder.createDocument(
                attachment.name,
                properties=props,
                contentFile=BytesIO(base64.b64decode(attachment.datas)),
                contentType=mimetype,
            )

    def send_mail(self, auto_commit=False):
        res = super().send_mail(auto_commit=auto_commit)
        for rec in self:
            if rec.is_save_in_cmis_enabled:
                rec._save_attachments_in_cmis()
        return res
