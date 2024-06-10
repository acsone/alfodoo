/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisObjectWrapper} from "@cmis_web/cmis_object_wrapper_service";
import {patch} from "@web/core/utils/patch";

patch(CmisObjectWrapper.prototype, "alfresco_proxy_alf_url", {
    setup(cmisObject, cmisSession, params) {
        this._super(...arguments);
        this.alfrescoApiLocation = params.alfrescoApiLocation;
    },
    getPreviewUrl() {
        var _url = this._super(...arguments);
        if (_url) {
            return _url;
        }
        var params = {
            c: "force",
            lastModified: "pdf%" + new Date().getUTCMilliseconds(),
            token: this.token,
            objectId: this.objectId,
            versionSeriesId: this.versionSeriesId,
        };
        return (
            this.alfrescoApiLocation +
            "/content/thumbnails/pdf/" +
            this.name +
            "?" +
            $.param(params)
        );
    },
});
