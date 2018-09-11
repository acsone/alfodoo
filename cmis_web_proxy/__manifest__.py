# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Alfodoo CMIS Web Proxy',
    'summary': """
        Odoo as proxy server for your cmis requests.""",
    'category': 'Document Management',
    'version': '10.0.4.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV',
    'website': 'http://alfodoo.org/',
    'depends': [
        'cmis_web'
    ],
    'data': [
        'views/cmis_backend.xml',
        'views/cmis_web_proxy.xml'
    ],
    'external_dependencies': {
        'python': ['requests',
                   'cmislib'],
    },
    'images': [
        'static/description/main_icon.png',
    ],
}
