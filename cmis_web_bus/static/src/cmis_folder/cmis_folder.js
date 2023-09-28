/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web_bus
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "web.utils";
import {useBus, useService} from "@web/core/utils/hooks";

patch(CmisFolderField.prototype, "cmis_folder_notification", {
    setup() {
        this._super.apply(this, arguments);
        this.cmisService = useService("deliveryCmisService");
        useBus(this.cmisService, "cmis_bus", (event) => {
            this._handleNotify(event);
        });
    },
    _handleNotify(event) {
        if (event.detail.action === "update") {
            this.queryCmisData();
        }
    },
});
