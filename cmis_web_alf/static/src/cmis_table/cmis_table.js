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
    get dynamicActionsProps() {
        const props = this._super(...arguments);
        props.openInAlf = this.props.openInAlf;
        return props;
    },
});

cmisTableProps.openInAlf = Function;
