# Copyright 2023 ACSONE SA/NV
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import json

from odoo import api, fields, models
from odoo.tools.safe_eval import safe_eval


class CmisDocumentLinkSrcFolderMixin(models.AbstractModel):
    _name = "cmis.document.link.src.folder.mixin"
    _description = "Allow to search files to link on parent record folders cmis"

    cmis_document_link_src_folders = fields.Char(
        compute='_compute_cmis_document_link_src_folders',
    )

    def _compute_cmis_document_link_src_folders(self):
        fnames = self._get_cmis_document_link_src_folders_fnames()
        for rec in self:
            folders = []
            for fname in fnames:
                folder_value = safe_eval(f"rec.{fname}", globals_dict={
                    "rec": rec,
                })
                if folder_value:
                    folders.append(folder_value)
            rec.cmis_document_link_src_folders = json.dumps(folders)

    # maybe consider to add dynamically the field in the view
    # def fields_view_get(self, view_id=None, view_type='form', toolbar=False, submenu=False):

    @api.model
    def _get_cmis_document_link_src_folders_fnames(self):
        """
        Should return a list of field names linked to the current record:
        For example, if we have a cmis_document on a sale.order.line, and we want to display
        documents from the folder of a sale order, we would need to set "order_id.cmis_folder"
        Then it will be evaluated with "rec.order_id.cmis_folder" where rec is a sale.order.line
        """
        raise NotImplementedError()
