/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

const {Component} = owl;

export class CmisBreadcrumbs extends Component {}

CmisBreadcrumbs.template = "cmis_web.CmisBreadcrumbs";
CmisBreadcrumbs.props = {
    displayFolder: Function,
    parentFolders: {
        type: Array,
        optional: true,
        element: {type: Object, shape: {id: String, name: String}},
    },
};
