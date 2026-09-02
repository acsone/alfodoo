/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisDocumentField} from "@cmis_web/cmis_document/cmis_document";
import {patch} from "@web/core/utils/patch";

patch(CmisDocumentField.prototype, "open_with_proxy", {
    genCmisSessionToken() {
        let token = JSON.stringify({
            model: this.props.record.resModel,
            res_id: this.props.record.resId,
            field_name: this.props.name,
        });
        this.cmisSession.token = token;
        return token;
    },

    async setDocumentId() {
        var self = this;
        self.setCmisSessionToken();
        this._super(...arguments);
    },
});
