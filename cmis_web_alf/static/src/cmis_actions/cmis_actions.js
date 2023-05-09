/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisActions} from "@cmis_web/cmis_actions/cmis_actions";
import {patch} from "@web/core/utils/patch";

patch(CmisActions.prototype, "action_open_in_alfresco", {
    onClickOpenInAlf(ev) {
        ev.stopPropagation();
        this.props.openInAlf(this.props.cmisObject.objectId);
    },
});

CmisActions.props.openInAlf = Function;
