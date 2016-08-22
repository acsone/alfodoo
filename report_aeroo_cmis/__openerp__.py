# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "report_aeroo_cmis",
    'summary': """
        Store your areroo report ino cmis""",
    'author': 'ACSONE SA/NV',
    'website': "http://acsone.eu",
    # Check http://goo.gl/0TfwzD for the full list
    'category': 'Customer Relationship Management',
    'version': '9.0.1.0.0',
    'license': 'AGPL-3',
    # any module necessary for this one to work correctly
    'depends': [
        'cmis',
        'report_aeroo'
    ],

    # always loaded
    'data': [
        'views/ir_actions_report_xml_view.xml'
    ],
}
