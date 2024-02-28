/** @odoo-module */

import {CmisSessionComponent, propsCmisBackend} from "@cmis_web/cmis_utils";

import {patch} from "@web/core/utils/patch";

patch(CmisSessionComponent.prototype, "open_in_alfresco", {
    async openInAlf(cmisObjectId) {
        const url = await this.rpc("/web/cmis/content_details_url", {
            backend_id: this.backend.id,
            cmis_objectid: cmisObjectId,
        });
        window.open(url);
    },

    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.alfrescoApiLocation = this.backend.alfresco_api_location;
        return params;
    },
});

propsCmisBackend[0].shape.share_location = String;
propsCmisBackend[0].shape.alfresco_api_location = String;
