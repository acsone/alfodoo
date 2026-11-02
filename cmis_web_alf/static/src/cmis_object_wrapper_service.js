/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisObjectWrapper} from "@cmis_web/cmis_object_wrapper_service";
import {patch} from "@web/core/utils/patch";

patch(CmisObjectWrapper.prototype, "alfresco_preview_url", {
    setup(cmisObject, cmisSession, params) {
        this._super(...arguments);
        this.alfrescoApiLocation = params.alfrescoApiLocation;
    },

    getPreviewUrl() {
        let _url = this._super(...arguments);
        if (_url) {
            return _url;
        }
        let params = this.getPreviewUrlParams();
        return this.alfrescoApiLocation + '/node/workspace/SpacesStore/' + this.versionSeriesId + '/content/thumbnails/pdf/' + encodeURI(this.name) + '?' + $.param(params);
    },

    getPreviewUrlParams() {
        let params = {
            c: 'force',
            lastModified: "pdf%" + new Date().getUTCMilliseconds(),
            objectId: this.objectId,
            versionSeriesId: this.versionSeriesId,
            token: this.getCmisSessionToken(),
        };
        if (this.apply_odoo_security || true) {
            // Add the token as parameter and into the http headers
            params.token = this.getCmisSessionToken();
        }
        return params;
    },

    getCmisSessionToken() {
        return this.cmisSession.token || "";
    },

});
