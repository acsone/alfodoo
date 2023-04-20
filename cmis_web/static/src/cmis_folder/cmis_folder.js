/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { registry } from "@web/core/registry";
import { CmisTable } from "../cmis_table/cmis_table";

const { Component } = owl;

class CmisFolderField extends Component {
    get rendererProps() {
        const props = {
            list: {
                records: [
                    {id: 1, name: "Doc 1", date: "2023-04-18", author: "qgr"},
                    {id: 2, name: "Doc 2", date: "2000-01-01", author: "qgr"},
                ],
            },
        };
        return props;
    }
}

CmisFolderField.template = "cmis_web.CmisFolderField";
CmisFolderField.supportedTypes = ["cmis_folder"];
CmisFolderField.components = { CmisTable };

registry.category("fields").add("cmis_folder", CmisFolderField);
