/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisDocumentField} from "@cmis_web/cmis_document/cmis_document";
import {patch} from "@web/core/utils/patch";

patch(CmisDocumentField.prototype, "open_with_proxy_alf", {
    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.alfrescoApiLocation = this.backend.alfresco_api_location;
        return params;
    },
});

CmisDocumentField.props.backend[0].shape.alfresco_api_location = String;
