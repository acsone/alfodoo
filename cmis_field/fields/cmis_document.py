# Copyright 2020 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import threading
import time
from functools import partial
from odoo import api, fields, registry, SUPERUSER_ID, _
from odoo.exceptions import UserError
from odoo.tools.sql import pg_varchar
from cmislib.exceptions import ObjectNotFoundException


class CmisDocument(fields.Field):
    type = "cmis_document"
    column_type = ("varchar", pg_varchar())
    backend_name = None
    create_method = None
    create_parent_get = None
    create_properties_get = None
    copy = False  # noderef are not copied by default

    def __init__(self, **kwargs):
        self.backend_name = kwargs.get("backend_name")
        super().__init__(**kwargs)

    def _is_registry_loading_mode(self, env):
        """
        Check if we are in the installation process.
        """
        return env.context.get("install_mode")

    def get_backend(self, env, raise_if_not_found=True):
        return env['cmis.backend'].get_by_name(
            self.backend_name, raise_if_not_found)

    def _description_backend(self, env):
        if self.inherited:
            # In the case of a cmis field inherited from another module
            # the attribute backend_name is not inherited so we have to
            # get it on the original fiel
            backend = self.inherited_field.get_backend(env, raise_if_not_found=False)
        else:
            backend = self.get_backend(env, raise_if_not_found=False)
        if len(backend) > 1:
            if self._is_registry_loading_mode(env):
                # While the registry is loading, specific attributes are not available
                # on the field (such as `backend_name`). At this stage, the fields
                # are accessed to validate the xml views of the module being
                # loaded/updated. We can therefore safely takes the first backend
                # into the list.
                backend = backend[:1]
            else:
                msg = (_('Too many backend found. '
                         'Please check your configuration.'))
                return {'backend_error': msg}
        if not backend:
            if self.backend_name:
                msg = (_('Backend named %s not found. '
                         'Please check your configuration.') %
                       self.backend_name)
            else:
                msg = _('No backend found. Please check your configuration.')
            return {'backend_error': msg}
        result = backend.get_web_description()[backend.id]
        return result

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
        """Create a new document for each record into the cmis container and
        store the value as field value

        :param records: An odoo recordset
        :param documents: A mapping of files to their corresponding record as a dict of
        dicts. The key of the parent dict should be the id of the corresponding record,
        while each child dict should contain a 'name' key for the name of the file,
        a 'mimetype' key for its mimetype and a 'data' key for its content (bytes).
        :type documents: dict[:int, dict['name': str, 'mimetype': str, 'file': bytes]]

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
            object_id = parent.createDocument(
                name,
                properties=props,
                contentFile=document.get("data"),
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
            test_mode = getattr(threading.current_thread(), 'testing', False)
            if not test_mode:
                record.env.cr.postrollback.add(
                    partial(
                        clean_up_document,
                        object_id,
                        backend.id,
                        record.env.cr.dbname
                    )
                )

            self.__set__(record, object_id)

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
