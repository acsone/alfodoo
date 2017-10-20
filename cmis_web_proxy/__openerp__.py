# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Cmis Web Proxy',
    'summary': """
        Odoo as proxy server for your cmis requests.""",
    'version': '9.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV',
    'website': 'https://alfodoo.org/',
    'depends': [
        'cmis_web'
    ],
    'data': [
        'views/cmis_backend.xml',
        'views/cmis_web_proxy.xml'
    ],
    'external_dependencies': {
        'python': ['requests'],
    },
}
