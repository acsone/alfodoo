# -*- coding: utf-8 -*-
# © 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

{
    'name': 'CMIS for Alfresco',
    'version': '9.0.1.0.0',
    'category': 'Connector',
    'summary': 'Alfresco extension for the CMIS Connector',
    'author': "ACSONE SA/NV Community Association (OCA)",
    'website': 'https://odoo-community.org/',
    'license': 'AGPL-3',
    'depends': [
        'cmis',
    ],
    'data': [
        'views/cmis_backend_view.xml',
    ],
    'installable': True,
    'auto_install': False,
}
