/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "@web/core/utils/patch";

patch(CmisFolderField.prototype, "open_with_proxy_alf", {
    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.alfrescoApiLocation = this.backend.alfresco_api_location;
        return params;
    },
});

CmisFolderField.props.backend[0].shape.alfresco_api_location = String;
