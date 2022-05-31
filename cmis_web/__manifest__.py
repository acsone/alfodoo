# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    'name': "Alfodoo CMIS Web interface",
    'summary': """
        CMIS Web browser widget""",
    'category': 'Document Management',
    'author': 'ACSONE SA/NV',
    'website': "https://alfodoo.org",
    'version': '13.0.4.0.1',
    'license': 'AGPL-3',
    'price': 400,
    'currency': 'EUR',
    'depends': [
        'web',
        'cmis_field',
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    'data': [
        'views/cmis_web.xml',
    ],
    'images': [
        'static/description/main_icon.png',
    ],
    'installable': True,
}
