# Copyright 2022 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Cmis Mail",
    "description": """
        This module allows to store mail attachment with CMIS.""",
    'category': 'Document Management',
    "version": "13.0.1.0.0",
    "license": "AGPL-3",
    "author": "ACSONE SA/NV",
    'website': 'http://alfodoo.org/',
    "depends": [
        "mail",
        "cmis_field",
    ],
    "data": [
        "wizards/mail_compose_message.xml",
    ],
    'installable': True,
    'images': [
        'static/description/main_icon.png',
    ],
}
