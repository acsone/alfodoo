/* ---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web_proxy_alf.form_widgets', function( require) {
"use strict";

var form_widgets = require('cmis_web.form_widgets');



form_widgets.CmisObjectWrapper.include({

    init: function(){
        this._super.apply(this, arguments);
        this.alfresco_api_location = null;
        this.token = null;
    },

});

form_widgets.FieldCmisFolder.include({

    wrap_cmis_object: function(cmisObject) {
        var obj = this._super.apply(this, arguments);
        obj.alfresco_api_location = this.alfresco_api_location;
        obj.token = this.gen_cmis_session_token();
        return obj;
    },

    bind_cmis_config: function(backend){
        this._super.apply(this, arguments);
        this.alfresco_api_location = backend.alfresco_api_location;
    },
});

});
