# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

from odoo import api, models, _
from odoo.exceptions import UserError


CMIS_NAME_INVALID_CHARS = r'\/:*?"<>|'


class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    @api.model
    def _get_web_description(self, record):
        """ Return the desciption of backend record to be included into the
        field description of cmis fields that reference the backend.
        """
        return {
            'id': record.id,
            'name': record.name,
            'location': record.location
        }

    @api.multi
    def get_web_description(self):
        """ Return informations to be included into the field description of
        cmis fields that reference the backend.
        """
        ret = {}
        for this in self:
            ret[this.id] = self._get_web_description(this)
        return ret

    @api.model
    def get_by_name(self, name, raise_if_not_found=True):
        # simple case: one backend
        domain = [(1, '=', 1)]
        if name:
            # multi backends case
            domain = [('name', '=', name)]
        backend = self.search(domain)
        if len(backend) != 1 and raise_if_not_found:
            if name:
                msg = _("Expected 1 backend named %s, %s found" %
                        (name, len(backend)))
            else:
                msg = _('No backend found')
            raise UserError(msg)
        return backend

    @api.model
    def is_valid_cmis_name(self, name, raise_if_invalid=False):
        if any(c in name for c in CMIS_NAME_INVALID_CHARS):
            if not raise_if_invalid:
                return False
            raise UserError(_("%s is not a valid name.\n"
                              "The following chars are not allowed %s") %
                            (name, CMIS_NAME_INVALID_CHARS))
        return True
