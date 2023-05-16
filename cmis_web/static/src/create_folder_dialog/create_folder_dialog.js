/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {Dialog} from "@web/core/dialog/dialog";

const {Component, useRef} = owl;

export class CreateFolderDialog extends Component {
    setup() {
        this.folderName = useRef("folderName");
    }

    async onClose() {
        this.props.close();
    }

    async onConfirm() {
        try {
            await this.props.confirm(this.folderName.el.value);
        } catch (e) {
            this.props.close();
            throw e;
        }
        this.props.close();
    }
}

CreateFolderDialog.components = {Dialog};
CreateFolderDialog.template = "cmis_web.CreateFolderDialog";
CreateFolderDialog.props = {confirm: Function, close: Function};
