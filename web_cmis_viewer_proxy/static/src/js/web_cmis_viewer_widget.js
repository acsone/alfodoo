/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer_proxy.cmis_viewer_widgets', function( require) {
"use strict";

var core = require('web.core');
var cmis_widgets = require('web_cmis_viewer.cmis_viewer_widgets');
var Model = require('web.Model');
var $ = require('$');

var _t = core._t;


cmis_widgets.CmisViewer.include({
    init: function (){
        this._super.apply(this, arguments);
        this.cmis_backend_fields.push('apply_odoo_security',
                                            'is_cmis_proxy');
    },

    gen_cmis_session_token: function(){
        return this.view.dataset.model + "_" + this.view.datarecord.id;
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

    bind_cmis_config: function(result){
        this._super.apply(this, arguments);
        if( result[0].is_cmis_proxy){
            this.is_cmis_procxy = result[0].is_cmis_proxy;
            this.cmis_location = '/cmis/1.1/browser';
        }
        if (result[0].apply_odoo_security) {
            this.apply_odoo_security = result[0].apply_odoo_security;
        }
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
