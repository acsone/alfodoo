# Copyright 2022 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Cmis Mail",
    "description": """
        This module allows to store attachments with CMIS from the mail
        composer if the source model has at least one CMIS folder.
        When attachments are added on the mail composer, a checkbox allows to
        enable the CMIS storage. If the source model has more than one CMIS
        folder, it is possible to specify in which one the attachments must be
        stored.""",
    "category": "Document Management",
    "version": "13.0.1.0.0",
    "license": "AGPL-3",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "depends": [
        "mail",
        "cmis_field",
    ],
    "data": [
        "wizards/mail_compose_message.xml",
    ],
    "installable": True,
    "images": [
        "static/description/main_icon.png",
    ],
}
