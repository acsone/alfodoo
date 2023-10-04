# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Cmis Web Report Write Alf",
    "summary": """
        Automatically open generated editable reports into Alfresco""",
    "version": "16.0.1.0.1",
    "license": "AGPL-3",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "depends": ["cmis_web_report_write", "cmis_web_bus"],
    "data": [],
    "demo": [],
    "assets": {
        "web.assets_backend": [
            "cmis_web_report_write_alf/static/src/**/*",
        ],
    },
    "installable": True,
}
