# Copyright 2020 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import base64
from io import BytesIO
import threading
import time
from functools import partial
from odoo import api, fields, registry, SUPERUSER_ID, _
from odoo.exceptions import UserError
from odoo.tools.sql import pg_varchar
from cmislib.exceptions import ObjectNotFoundException


class CmisDocument(fields.Field):
    type = 'cmis_document'
    column_type = ('varchar', pg_varchar())
    _slots = {
        'backend_name': None,
        'copy': False,  # noderef are not copied by default
        'create_parent_get': None,
        'create_properties_get': None,
        'create_method': None
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

    def get_cmis_object(self, record):
        """Returns an instance of
        :class:`cmislib.browser.binding.BrowserDocument`
        This instance is a proxy object that can be used to perform action on
        the document into the cmis container
        :param record:
        """
        val = self.__get__(record, record)
        if not val:
            return None
        backend = self.get_backend(record.env)
        repo = backend.get_cmis_repository()
        return repo.getObject(val)

    def create_value(self, records, documents):
        """Create a new folder for each record into the cmis container and
        store the value as field value
        """
        for record in records:
            self._check_null(record)
        self._create_value(records, documents)

    def _create_value(self, records, documents):
        backend = self.get_backend(records.env)
        if self.create_method:
            fct = self.create_method
            if not callable(fct):
                fct = getattr(records, fct)
            fct(self, backend)
            return
        self._create_in_cmis(records, backend, documents)

    def _create_in_cmis(self, records, backend, documents):
        parents = self.get_create_parents(records, backend)
        properties = self.get_create_properties(records, backend)
        for record in records:
            document = documents[record.id]
            name = document.get("name")
            backend.is_valid_cmis_name(name, raise_if_invalid=True)
            parent = parents[record.id]
            props = properties[record.id] or {}
            content = self._decode_file(document)
            value = parent.createDocument(
                name=name,
                properties=props,
                contentFile=content,
                contentType=document.get("mimetype"),
            )

            def clean_up_document(cmis_object_id, backend_id, dbname):
                db_registry = registry(dbname)
                with api.Environment.manage(), db_registry.cursor() as cr:
                    env = api.Environment(cr, SUPERUSER_ID, {})
                    backend = env["cmis.backend"].browse(backend_id)
                    _repo = backend.get_cmis_repository()
                    # The rollback is delayed by an arbitrary length of time to give
                    # the GED time to create the folder. If the folder is not properly
                    # created at the time the rollback executes, it cannot be deleted.
                    time.sleep(0.5)
                    try:
                        _repo.getObject(cmis_object_id).delete()
                    except ObjectNotFoundException:
                        pass

            # remove created resource in case of rollback
            test_mode = getattr(threading.currentThread(), 'testing', False)
            if not test_mode:
                record.env.cr.after(
                    'rollback',
                    partial(
                        clean_up_document,
                        value.getObjectId(),
                        backend.id,
                        record.env.cr.dbname
                    )
                )

            self.__set__(record, value.getObjectId())

    @staticmethod
    def _decode_file(document):
        file = document.get("data")
        _, content = file.split(",")
        return BytesIO(base64.b64decode(content))

    def get_create_parents(self, records, backend):
        """return the cmis:objectId of the cmis folder to use as parent of the
        new folder.
        :rtype: dict
        :return: a dictionay with an entry for each record with the following
        structure ::

            {record.id: 'cmis:objectId'}

        """
        if self.create_parent_get:
            fct = self.create_parent_get
            if not callable(fct):
                fct = getattr(records, fct)
            return fct(self, backend)
        path_parts = self.get_default_parent_path_parts(records, backend)
        parent_cmis_object = backend.get_folder_by_path_parts(
            path_parts, create_if_not_found=True)
        return dict.fromkeys(records.ids, parent_cmis_object)

    def get_default_parent_path_parts(self, records, backend):
        """Return the default path parts into the cmis container to use as
        parent on folder create. By default:
        backend.initial_directory_write / record._name
        """
        path_parts = backend.initial_directory_write.split('/')
        path_parts.append(records[0]._name.replace('.', '_'))
        return path_parts

    def get_create_properties(self, records, backend):
        """Return the properties to use to created the folder into the CMIS
        container.
        :rtype: dict
        :return: a dictionay with an entry for each record with the following
        structure ::

            {record.id: {'cmis:xxx': 'val1', ...}}

        """
        if self.create_properties_get:
            fct = self.create_properties_get
            if not callable(fct):
                fct = getattr(records, fct)
            return fct(self, backend)
        return dict.fromkeys(records.ids, None)

    def _check_null(self, record, raise_exception=True):
        val = self.__get__(record, record)
        if val and raise_exception:
            raise UserError(_('A value is already assigned to %s') % self)
        return val
