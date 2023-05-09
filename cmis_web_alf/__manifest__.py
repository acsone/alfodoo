# Copyright 2016-2023 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    "name": "Alfodoo Alfresco Web interface",
    "summary": """
        Extensions to the Alfodoo web widgets for Alfresco""",
    "category": "Document Management",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "version": "16.0.1.0.0",
    "license": "AGPL-3",
    "depends": ["cmis_alf", "cmis_web"],
    "data": [],
    "external_dependencies": {
        "python": ["cmislib"],
    },
    "images": [
        "static/description/main_icon.png",
    ],
    "installable": True,
    "assets": {
        "web.assets_backend": [
            "/cmis_web_alf/static/src/images/images.scss",
            "/cmis_web_alf/static/src/cmis_folder/cmis_folder.js",
            "/cmis_web_alf/static/src/cmis_folder/cmis_folder.xml",
            "/cmis_web_alf/static/src/cmis_table/cmis_table.js",
            "/cmis_web_alf/static/src/cmis_actions/cmis_actions.js",
            "/cmis_web_alf/static/src/cmis_actions/cmis_actions.xml",
            "/cmis_web_alf/static/src/cmis_object_wrapper_service.js",
        ],
    },
}
