# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    "name": "Alfodoo CMIS Web Proxy",
    "summary": """
        Odoo as proxy server for your cmis requests.""",
    "category": "Document Management",
    "version": "16.0.1.0.1",
    "license": "AGPL-3",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "depends": ["cmis_web"],
    "data": ["views/cmis_backend.xml"],
    "external_dependencies": {"python": ["requests", "cmislib"]},
    "images": ["static/description/main_icon.png"],
    "assets": {
        "web.assets_backend": [
            "/cmis_web_proxy/static/src/cmis_document/cmis_document.js",
            "/cmis_web_proxy/static/src/cmis_folder/cmis_folder.js",
            "/cmis_web_proxy/static/src/cmis_object_wrapper_service.js",
        ],
    },
    "installable": True,
}
