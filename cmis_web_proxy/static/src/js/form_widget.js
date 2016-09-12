/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web_alf.form_widgets', function( require) {
"use strict";

var core = require('web.core');
var form_widgets = require('cmis_web.form_widgets');
var Model = require('web.Model');
var $ = require('$');
var _t = core._t;


form_widgets.FieldCmisFolder.include({

    gen_cmis_session_token: function(){
        return JSON.stringify({
            'model': this.view.dataset.model,
            'res_id': this.view.datarecord.id,
            'field_name': this.name});
    },

    set_cmis_session_token: function(){
        var self = this;
        if (this.apply_odoo_security){
            self.cmis_session.setToken(self.gen_cmis_session_token());
        }
    },

    set_root_folder_id: function(folderId) {
        var self = this;
        if (self.root_folder_id === folderId){
            return;
        }
        $.when(self.cmis_session_initialized).done(function() {
            self.set_cmis_session_token();
        });
        this._super.apply(this, arguments);
    },

    bind_cmis_config: function(backend){
        this._super.apply(this, arguments);
        this.apply_odoo_security = backend.apply_odoo_security;
    },

    get_preview_url_params: function(cmisObjectWrapped){
        var params = this._super.apply(this, arguments);
        if (this.apply_odoo_security){
            // add the token as parameter and into the http headers
            var token = this.gen_cmis_session_token();
            params['token'] = token;
        }
        return params;
    },
 });

});
