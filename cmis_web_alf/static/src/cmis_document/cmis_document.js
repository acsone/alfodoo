/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisDocumentField} from "@cmis_web/cmis_document/cmis_document";
import {patch} from "@web/core/utils/patch";

patch(CmisDocumentField.prototype, "open_in_alfresco", {
    get dynamicActionsProps() {
        const props = this._super(...arguments);
        props.openInAlf = this.openInAlf.bind(this);
        return props;
    },

    onClickOpenInAlf() {
        this.openInAlf(this.displayDocumentId);
    },
});
