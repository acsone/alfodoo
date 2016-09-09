# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from openerp import fields


class CmisMetaField(fields.MetaField):
    """This class extend the field.MetaField metaclass to allow you to register
    a field definition class into the registry by using a ttype key in place
    of the value provided by the type attribute.

    This is required for cmis fields since theses fields are stored into the
    database as 'char' (type='char'). Since the original fields.Char is already
    registered into the registry with the key 'char', we need to find a way
    to provide at class level an other key to use to register ou custom fields
    Natively odoo doesn't dissociate column type / field type / widget type
    """
    def __init__(self, name, bases, attrs):
        cls = self  # self is a class definition instance
        _type = cls.type
        if hasattr(cls, 'ttype'):
            cls.type = cls.ttype
        super(CmisMetaField, cls).__init__(name, bases, attrs)
        cls.type = _type
