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
        var _url = this._super(...arguments);
        if (_url) {
            return _url;
        }
        // By default, review are generated in alfresco the first time it's requested by share
        // Before this first access, the renditions on the cmis object is empty.
        // Use the alfresco API to trigger a first rendition of the document.
        return (
            this.alfrescoApiLocation +
            "/node/workspace/SpacesStore/" +
            this.versionSeriesId +
            "/content/thumbnails/pdf/" +
            encodeURI(this.name) +
            "?c=force&lastModified=pdf%" +
            new Date().getUTCMilliseconds()
        );
    },
});
