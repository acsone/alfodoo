/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "@web/core/utils/patch";

console.log("patch cmis folder componenet");

patch(CmisFolderField.prototype, "open_with_proxy", {
    genCmisSessionToken() {
        return JSON.stringify({
            model: this.props.record.resModel,
            res_id: this.props.record.resId,
            field_name: this.props.name,
        });
    },

    async setRootFolderId() {
        const self = this;
        self.setCmisSessionToken();
        this._super(...arguments);
    },

    getPreviewUrlParams() {
        // Pas sur de l'utilité de la méthode je n'ia trouvé aucun appel à cette fonction
        var params = this._super(...arguments);
        if (this.backend.apply_odoo_security) {
            // Add the token as parameter and into the http headers
            var token = this.genCmisSessionToken();
            params.token = token;
        }
        return params;
    },
});
