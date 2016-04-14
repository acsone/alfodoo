# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "Alfresco CMIS Viewer Widget",
    'summary': """
        Alfresco extension for the CMIS viewer widget""",
    'author': 'ACSONE SA/NV',
    'website': "http://acsone.eu",

    # Categories can be used to filter modules in modules listing
    # Check http://goo.gl/0TfwzD for the full list
    'category': 'Uncategorized',
    'version': '9.0.1.0.0',
    'license': 'AGPL-3',
    # any module necessary for this one to work correctly
    'depends': [
        'cmis_alf',
        'web_cmis_viewer'
    ],

    # always loaded
    'data': [
        'data/web_cmis_viewer_alf.xml',
        'views/web_cmis_viewer_alf.xml'
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    # only loaded in demonstration mode
    'demo': [
    ],
}
