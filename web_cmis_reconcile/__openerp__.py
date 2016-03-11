# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "CMIS Document reconcile",
    'summary': """
        Wizard to link CMIS document with Odoo model instance""",
    'author': 'ACSONE SA/NV',
    'website': "http://acsone.eu",
    'category': 'Uncategorized',
    'version': '9.0.1.0.0',
    'license': 'AGPL-3',
    'depends': [
        'cmis_alf',
        'web_cmis_viewer'
    ],
    'data': [
        'views/web_cmis_reconcile.xml'
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
}
