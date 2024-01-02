# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Cmis Web Bus",
    "summary": """
        Instant Messaging Bus to send notification to the CMIS components
        in live""",
    "version": "16.0.1.0.0",
    "license": "AGPL-3",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "depends": ["cmis_web", "bus"],
    "installable": True,
    "assets": {
        "web.assets_backend": [
            "cmis_web_bus/static/src/**/*",
        ],
    },
}
