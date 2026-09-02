/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisTable, cmisTableProps} from "@cmis_web/cmis_table/cmis_table";
import {patch} from "@web/core/utils/patch";

patch(CmisTable.prototype, "open_in_alfresco", {
    getDynamicPropsNameToCopy() {
        const propNames = this._super(...arguments);
        propNames.push("openInAlf");
        return propNames;
    },
});

cmisTableProps.openInAlf = {
    type: Function,
    optional: true,
};
