/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "@web/core/utils/patch";

patch(CmisFolderField.prototype, "open_with_proxy", {
    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.applyOdooSecurity = this.backend.apply_odoo_security;
        return params;
    },

    genCmisSessionToken() {
        return JSON.stringify({
            model: this.props.record.resModel,
            res_id: this.props.record.resId,
            field_name: this.props.name,
        });
    },

    setCmisSessionToken() {
        if (this.backend.apply_odoo_security) {
            this.cmisSession.setToken(this.genCmisSessionToken());
        }
    },

    async setRootFolderId() {
        var self = this;
        self.setCmisSessionToken();
        this._super(...arguments);
    },
});

CmisFolderField.props.backend[0].shape.apply_odoo_security = Boolean;
