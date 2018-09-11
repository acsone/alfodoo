# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "Alfodoo Alfresco Web interface",
    'summary': """
        Extensions to the Alfodoo web widgets for Alfresco""",
    'category': 'Document Management',
    'author': 'ACSONE SA/NV',
    'website': "http://alfodoo.org",
    'version': '10.0.4.0.0',
    'license': 'AGPL-3',
    'depends': [
        'cmis_alf',
        'cmis_web'
    ],
    'data': [
        'views/cmis_web_alf.xml'
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    'external_dependencies': {
        'python': ['cmislib'],
    },
    'images': [
        'static/description/main_icon.png',
    ],
}
