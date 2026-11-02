/** @odoo-module */

import {CmisSessionComponent, propsCmisBackend} from "@cmis_web/cmis_utils";

import {patch} from "@web/core/utils/patch";

patch(CmisSessionComponent.prototype, "open_with_proxy_alf", {
    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.alfrescoApiLocation = this.backend.alfresco_api_location;
        return params;
    },
});

propsCmisBackend[0].shape.alfresco_api_location = String;
