/** @odoo-module */

import {CmisSessionComponent, propsCmisBackend} from "@cmis_web/cmis_utils";

import {patch} from "@web/core/utils/patch";

patch(CmisSessionComponent.prototype, "open_with_proxy", {
    getCmisObjectWrapperParams() {
        const params = this._super(...arguments);
        params.applyOdooSecurity = this.backend.apply_odoo_security;
        return params;
    },

    genCmisSessionToken() {
        return "";
    },

    setCmisSessionToken() {
        if (this.backend.apply_odoo_security) {
            this.cmisSession.setToken(this.genCmisSessionToken());
        }
    },
});

propsCmisBackend[0].shape.apply_odoo_security = Boolean;
