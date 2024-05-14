/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisObjectWrapper} from "@cmis_web/cmis_object_wrapper_service";
import {patch} from "@web/core/utils/patch";

patch(CmisObjectWrapper.prototype, "alfresco_proxy_url", {
    getPreviewUrl() {
        var _url = this._super(...arguments);
        if (_url) {
            var prefix = "&";
            if (_url.indexOf("?") < 0) {
                prefix = "?";
            }
            return _url + prefix + "renderedObjectId=" + this.objectId;
        }
        return _url;
    },
});
