/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {Dialog} from "@web/core/dialog/dialog";

const {Component, useRef} = owl;

export class UpdateDocumentContentDialog extends Component {
    setup() {
        this.fileInput = useRef("fileInput");
    }

    async onClose() {
        this.props.close();
    }

    async onConfirm() {
        try {
            await this.props.confirm(this.fileInput.el.files[0]);
        } catch (e) {
            this.props.close();
            throw e;
        }
        this.props.close();
    }
}

UpdateDocumentContentDialog.components = {Dialog};
UpdateDocumentContentDialog.template = "cmis_web.UpdateDocumentContentDialog";
UpdateDocumentContentDialog.props = {
    title: String,
    confirm: Function,
    close: Function,
};
