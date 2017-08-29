# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Cmis Web Proxy Alf',
    'description': """
        Proxy requests from cmis_web to the Alfresco API""",
    'version': '10.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV',
    'website': 'https://alfodoo.org/',
    'depends': [
        'cmis_web_proxy'
    ],
    'data': [
        'views/cmis_backend.xml',
        'views/cmis_web_proxy_alf.xml'
    ],
    'demo': [
    ],
}
