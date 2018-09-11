# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from operator import attrgetter
from odoo import fields, _
from odoo.exceptions import UserError
from odoo.tools.sql import pg_varchar


# pylint:disable=property-on-old-class
class CmisFolder(fields.Field):
    """ A reference to a cmis:folder. (cmis:objectId)

    :param backend_name:

        The attribute ``backend_name`` is mandatory if more than one backend
        id configured. Otherwize you must have configured one backend ir order
        to prevent errors when loading a view that includes this kind of field.

    :param allow_create: Allow create from UI (by default True)

    :param allow_delete: Allow delete from UI (by default False)

    :param create_method: name of a method that create the field into the
        CMIS repository. The method must assign the field on all records of the
        invoked recordset. The method is called with the field definition
        instance and the bakend as paramaters
        (optional)

    :param create_parent_get: name of a method that return the cmis:objectId of
        the folder to use as parent. The method is called with the field
        definition instance and the bakend as paramaters.
        (optional: by default the folder is
        created  as child of backend.initial_directory_write + '/' model._name)
    :rtype: dict
    :return: a dictionay with an entry for each record of the invoked
        recordset with the following structure ::

            {record.id: 'cmis:objectId'}

    :param create_name_get: name of a method that return the name of the
        folder to create into the CMIS repository. The method is called with
        the field definition instance and the bakend as paramaters.
        (optional: by default instance.name_get)
    :rtype: dict
    :return: a dictionay with an entry for each record of the invoked
        recordset with the following structure ::

            {record.id: 'name'}

    :parem create_properties_get: name of a method that return a dictionary of
        CMIS properties ro use to create the folder. The method is called
        with the field definition instance and the bakend as paramaters
        (optional: default empty)
    :rtype: dict
    :return: a dictionay with an entry for each record of the invoked
        recordset with the following structure ::

            {record.id: {'cmis:xxx': 'val1', ...}}

    """
    type = 'cmis_folder'
    column_type = ('varchar', pg_varchar())
    _slots = {
        'backend_name': None,
        'create_method': None,
        'create_name_get': 'name_get',
        'create_parent_get': None,
        'create_properties_get': None,
        'allow_create': True,
        'allow_delete': False,
        'copy': False,  # noderef are not copied by default
    }

    def __init__(self, backend_name=None, string=None, **kwargs):
        super(CmisFolder, self).__init__(
            backend_name=backend_name, string=string, **kwargs)

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

    _description_allow_create = property(attrgetter('allow_create'))
    _description_allow_delete = property(attrgetter('allow_delete'))

    def get_backend(self, env, raise_if_not_found=True):
        return env['cmis.backend'].get_by_name(
            self.backend_name, raise_if_not_found)

    def create_value(self, records):
        """Create a new folder for each record into the cmis container and
        store the value as field value
        """
        for record in records:
            self._check_null(record)
        if self.related:
            self._create_value_related(records)
        else:
            self._create_value(records)

    def _create_value(self, records):
        backend = self.get_backend(records.env)
        if self.create_method:
            fct = self.create_method
            if not callable(fct):
                fct = getattr(records, fct)
            fct(self, backend)
            return
        self._create_in_cmis(records, backend)

    def _create_value_related(self, records):
        others = records.sudo() if self.related_sudo else records
        for record, other in zip(records, others):
            if not record.id and record.env != other.env:
                # draft records: copy record's cache to other's cache first
                fields.copy_cache(record, other.env)
            other, field = self.traverse_related(other)
            field.create_value(other)
            record[self.name] = other[field.name]

    def _create_in_cmis(self, records, backend):
        names = self.get_create_names(records, backend)
        parents = self.get_create_parents(records, backend)
        properties = self.get_create_properties(records, backend)
        repo = backend.get_cmis_repository()
        for record in records:
            name = names[record.id]
            if backend.enable_sanitize_cmis_name:
                name = backend.sanitize_cmis_name(name)
            else:
                backend.is_valid_cmis_name(name, raise_if_invalid=True)
            parent = parents[record.id]
            name = backend.get_unique_folder_name(name, parent)
            props = properties[record.id] or {}
            value = repo.createFolder(
                parent, name, props)
            self.__set__(record, value.getObjectId())

    def _check_null(self, record, raise_exception=True):
        val = self.__get__(record, record)
        if val and raise_exception:
            raise UserError(_('A value is already assigned to %s') % self)
        return val

    def get_create_names(self, records, backend):
        """return the names of the folders to create into the CMIS repository
        for the given recordset.
        :rtype: dict
        :return: a dictionay with an entry for each record with the following
        structure ::

            {record.id: 'name'}

        """
        if self.create_name_get == 'name_get':
            return dict(records.name_get())
        fct = self.create_name_get
        if not callable(fct):
            fct = getattr(records, fct)
        return fct(self, backend)

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

    def get_default_parent_path_parts(self, records, backend):
        """Return the default path parts into the cmis container to use as
        parent on folder create. By default:
        backend.initial_directory_write / record._name
        """
        path_parts = backend.initial_directory_write.split('/')
        path_parts.append(records[0]._name.replace('.', '_'))
        return path_parts

    def get_cmis_object(self, record):
        """Returns an instance of
        :class:`cmislib.browser.binding.BrowserFolder`
        This instance is a proxy object that can be used to perform action on
        the folder into the cmis container
        :param record:
        """
        val = self.__get__(record, record)
        if not val:
            return None
        backend = self.get_backend(record.env)
        repo = backend.get_cmis_repository()
        return repo.getObject(val)
