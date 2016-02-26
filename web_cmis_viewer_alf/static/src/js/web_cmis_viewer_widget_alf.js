/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer_alf.cmis_viewer_widgets_alf', function( require) {
"use strict";

var core = require('web.core');
var cmis_widgets = require('web_cmis_viewer.cmis_viewer_widgets');
var Model = require('web.Model');

var _t = core._t;

cmis_widgets.CmisViewer.include({
    get_datatable_config: function(){
        var config = this._super.apply(this, arguments);
        config.columns[4].width='100px';
        return config;
    },

    register_content_events: function(){
        var self = this;
        this._super.apply(this, arguments);
        /* bind content events */
        this.$el.find('.content-action-open-alf').on('click', function(e){
            var row = self._get_event_row(e);
            self.open_in_alf(row.data().objectId);
        });
    },

    register_root_content_events: function(){
        var self = this;
        this._super.apply(this, arguments);
        this.$el.find('.root-content-action-open-alf').on('click', function(e){
            self.open_in_alf(self.dislayed_folder_noderef.objectId);
        });
    },

    open_in_alf: function(objectid){
        new Model("cmis.backend")
        .call("get_content_details_url",  [
             [this.cmis_backend_id],
             objectid,
             this.view.dataset.get_context()
         ])
        .then(function (url) {
            window.open(url);
        });
    },
});

});
