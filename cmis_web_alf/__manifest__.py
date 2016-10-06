# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "Alfresco CMIS Web interface",
    'summary': """
        Alfresco extension for the CMIS web widgets""",
    'author': 'ACSONE SA/NV',
    'website': "http://alfodoo.org",
    'category': 'Uncategorized',
    'version': '10.0.1.0.0',
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
}
