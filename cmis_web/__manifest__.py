# Copyright 2016-2023 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
{
    "name": "Alfodoo CMIS Web interface",
    "summary": """
        CMIS Web browser widget""",
    "category": "Document Management",
    "author": "ACSONE SA/NV",
    "website": "https://alfodoo.org",
    "version": "16.0.1.0.0",
    "license": "AGPL-3",
    "price": 400,
    "currency": "EUR",
    "depends": ["web", "cmis_field"],
    "images": ["static/description/main_icon.png"],
    "installable": True,
    "assets": {
        "web.assets_backend": [
            "/cmis_web/static/lib/cmisjs/superagent.7.2.0.js",
            "/cmis_web/static/lib/cmisjs/cmis.0.3.1.js",
            "/cmis_web/static/src/cmis_folder/cmis_folder.js",
            "/cmis_web/static/src/cmis_folder/cmis_folder.scss",
            "/cmis_web/static/src/cmis_folder/cmis_folder.xml",
            "/cmis_web/static/src/cmis_table/cmis_table.js",
            "/cmis_web/static/src/cmis_table/cmis_table.xml",
            "/cmis_web/static/src/cmis_actions/cmis_actions.js",
            "/cmis_web/static/src/cmis_actions/cmis_actions.xml",
            "/cmis_web/static/src/add_document_dialog/add_document_dialog.js",
            "/cmis_web/static/src/add_document_dialog/add_document_dialog.xml",
            "/cmis_web/static/src/"
            "update_document_content_dialog/update_document_content_dialog.js",
            "/cmis_web/static/src/"
            "update_document_content_dialog/update_document_content_dialog.xml",
            "/cmis_web/static/src/create_folder_dialog/create_folder_dialog.js",
            "/cmis_web/static/src/create_folder_dialog/create_folder_dialog.xml",
            "/cmis_web/static/src/rename_dialog/rename_dialog.js",
            "/cmis_web/static/src/rename_dialog/rename_dialog.xml",
            "/cmis_web/static/src/cmis_breadcrumbs/cmis_breadcrumbs.js",
            "/cmis_web/static/src/cmis_breadcrumbs/cmis_breadcrumbs.xml",
            "/cmis_web/static/src/cmis_attachment_viewer/cmis_attachment_viewer.js",
            "/cmis_web/static/src/cmis_attachment_viewer/cmis_attachment_viewer.xml",
            "/cmis_web/static/src/cmis_object_wrapper_service.js",
        ]
    },
}
