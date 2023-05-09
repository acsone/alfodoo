/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisFolderField} from "@cmis_web/cmis_folder/cmis_folder";
import {patch} from "@web/core/utils/patch";

patch(CmisFolderField.prototype, "open_in_alfresco", {
    get dynamicProps() {
        const props = this._super(...arguments);
        props.openInAlf = this.openInAlf.bind(this);
        return props;
    },

    onClickOpenInAlf() {
        this.openInAlf(this.displayFolderId);
    },

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

CmisFolderField.props.backend[0].shape.share_location = String;
CmisFolderField.props.backend[0].shape.alfresco_api_location = String;
