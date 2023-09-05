# Copyright 2016-2023 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html)

from odoo import http


class CmisController(http.Controller):
    @http.route(
        "/web/cmis/content_details_url", type="json", methods=["POST"], auth="user"
    )
    def get_content_details_url(self, backend_id, cmis_objectid):
        backend = http.request.env["cmis.backend"].search([("id", "=", backend_id)])
        return backend.get_content_details_url(cmis_objectid)
