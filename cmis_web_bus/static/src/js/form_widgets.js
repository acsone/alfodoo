/*---------------------------------------------------------
 + * Odoo cmis_web
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web_bus.form_widgets', function( require) {
"use strict";


var core = require('web.core');
var base_bus = require('bus.bus');
var form_widgets = require('cmis_web.form_widgets');
var _t = core._t;


form_widgets.FieldCmisFolder.include({

    init: function(){
        this._super.apply(this, arguments);
        this._channel_notify_cmis_node = 'notify_cmis_node';
        base_bus.bus.add_channel(this._channel_notify_cmis_node);
        base_bus.bus.on('notification', this, this.bus_notification);
    },

    bus_notification: function(notifications) {
        var self = this;
        _.each(notifications, function (notification) {
            var channel = notification[0];
            var message = notification[1];
            if (channel === self._channel_notify_cmis_node) {
                self.on_notify_cmis_node(message);
            }
        });
    },

    on_notify_cmis_node: function(message) {
        var cmis_objectid = message.cmis_objectid;
        if (this.root_folder_id !== cmis_objectid){
            return;
        }
        if (message.action === 'update'){
             if (this.datatable){
                // avoid multiple refresh in cass of multiple notification
                // of update of the same node
                _.debounce(this.datatable.ajax.reload, 300, true)();
            }
        }
    },

});

});
 