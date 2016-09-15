# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
from openerp import fields, models


def _field_create(self, cr, context=None):
    res = _field_create.origin(self, cr, context)
    model_fields = filter(
        lambda x: hasattr(x[1], 'ttype'), self._fields.items())
    if not model_fields:
        return res
    # here we have field defining a ttype.
    # update the field definition to use the value provided by ttype into
    # the ir_model_fields table (by default odoo fill this column with type
    cr.execute("select id from ir_model where model = %s", (self._name,))
    model_id = cr.fetchone()[0]
    for k, field in model_fields:
        cr.execute("""
            update ir_model_fields set ttype=%s
            where model_id=%s and name=%s
            """, (field.ttype, model_id, k))
    return res


models.BaseModel._patch_method('_field_create', _field_create)


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
