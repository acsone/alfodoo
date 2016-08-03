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

var _t = core._t;


cmis_widgets.CmisViewer.include({
    init: function (){
        this._super.apply(this, arguments);
        this.cmis_backend_fields.push('is_cmis_proxy');
    },

    gen_cmis_session_token: function(){
        return this.view.dataset.model + "_" + this.view.datarecord.id;
    },

    set_cmis_session_token: function(){
        var self = this;
        $.when(self.cmis_session_initialized).done(function() {
            self.cmis_session.setToken(self.gen_cmis_session_token());
        });
    },

    start: function(){
        this.view.on('view_content_has_changed', this, this.set_cmis_session_token);
        return this._super.apply(this, arguments);
    },

    bind_cmis_config: function(result){
        this._super.apply(this, arguments);
        if (result[0].is_cmis_proxy) {
            this.cmis_location = '/cmis/1.1/browser';
        }
    },
 });

});
