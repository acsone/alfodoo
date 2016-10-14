# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "CMIS Viewer Widget",
    'summary': """
        Embeddable CMIS Viewer Widget""",
    'author': 'ACSONE SA/NV',
    'website': "http://alfodoo.org",
    'category': 'Uncategorized',
    'version': '9.0.1.1.0',
    'license': 'AGPL-3',
    'depends': [
        'web',
        'cmis'
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    'data': [
        'data/web_cmis_viewer.xml',
        'views/web_cmis_viewer.xml'
    ],
}
