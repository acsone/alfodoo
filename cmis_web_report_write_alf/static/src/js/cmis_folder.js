/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web_bus
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "web.utils";

patch(CmisFolderField.prototype, "cmis_folder_open_url", {
    _handleNotify(event) {
        this._super(event);
        if (this.rootFolderId !== event.detail.cmis_objectid) {
            return;
        }
        if (event.detail.action === "open_url") {
            window.open(event.detail.url);
        }
    },
});
