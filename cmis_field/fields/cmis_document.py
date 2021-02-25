# Copyright 2020 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from odoo import fields, _
from odoo.tools.sql import pg_varchar


class CmisDocument(fields.Field):
    type = 'cmis_document'
    column_type = ('varchar', pg_varchar())
    _slots = {
        'backend_name': None,
        'copy': False,  # noderef are not copied by default
    }

    def __init__(self, backend_name=None, string=None, **kwargs):
        super(CmisDocument, self).__init__(
            backend_name=backend_name, string=string, **kwargs)

    def get_backend(self, env, raise_if_not_found=True):
        return env['cmis.backend'].get_by_name(
            self.backend_name, raise_if_not_found)
    
    def _description_backend(self, env):
        backend = self.get_backend(env, raise_if_not_found=False)
        if not backend:
            if self.backend_name:
                msg = (_('Backend named %s not found. '
                         'Please check your configuration.') %
                       self.backend_name)
            else:
                msg = _('No backend found. Please check your configuration.')
            return {'backend_error': msg}
        return backend.get_web_description()[backend.id]
