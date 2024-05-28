/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "@web/core/utils/patch";

patch(CmisFolderField.prototype, "open_in_alfresco", {
    get dynamicProps() {
        const props = this._super(...arguments);
        props.openInAlf = this.openInAlf.bind(this);
        return props;
    },

    onClickOpenInAlf() {
        this.openInAlf(this.displayFolderId);
    },
});
