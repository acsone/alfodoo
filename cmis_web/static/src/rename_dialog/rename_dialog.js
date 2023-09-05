/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {Dialog} from "@web/core/dialog/dialog";

const {Component, useRef} = owl;

export class RenameDialog extends Component {
    setup() {
        this.newName = useRef("newName");
    }

    async onClose() {
        this.props.close();
    }

    async onConfirm() {
        try {
            await this.props.confirm(this.newName.el.value);
        } catch (e) {
            this.props.close();
            throw e;
        }
        this.props.close();
    }
}

RenameDialog.components = {Dialog};
RenameDialog.template = "cmis_web.RenameDialog";
RenameDialog.props = {
    title: String,
    name: String,
    confirm: Function,
    close: Function,
};
