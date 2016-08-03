# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Web Cmis Viewer Proxy',
    'summary': """
        Odoo as proxy server for your cmis requests from the web to the cmis container.""",
    'version': '9.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV,Odoo Community Association (OCA)',
    'website': 'https://acsone.eu/',
    'depends': [
        'web_cmis_viewer'
    ],
    'data': [
        'views/cmis_backend.xml',
         'views/web_cmis_viewer_proxy.xml'
    ],
    'demo': [
    ],
}
