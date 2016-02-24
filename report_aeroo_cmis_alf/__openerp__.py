# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "report_aeroo_cmis_alf",
    'summary': """
        Open aeroo report into Alfresco""",
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
        'report_aeroo_cmis'
    ],
    'data': [
        'views/report_aeroo_cmis_alf.xml'
    ],
}
