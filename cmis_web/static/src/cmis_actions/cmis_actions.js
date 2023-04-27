/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { registry } from "@web/core/registry";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";

const { Component } = owl;

class CmisActions extends Component {
    onDelete() {
        this.props.deleteObject(this.props.cmisObject)
    }
}

CmisActions.template = "cmis_web.CmisActions";
CmisActions.components = { Dropdown, DropdownItem };

registry.category("view_widgets").add("cmis_actions", CmisActions);
