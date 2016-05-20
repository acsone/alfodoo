odoo.define('report_py3o_cmis_save_alf.ActionManager', function (require) {
"use strict";

var ActionManager = require('web.ActionManager');

var crash_manager = require('web.crash_manager');
var framework = require('web.framework');
var pyeval = require('web.pyeval');
var session = require('web.session');
var ajax = require('web.ajax');


ActionManager = ActionManager.include({
    
    ir_actions_report_xml: function(action, options) {
        if (! action.cmis_filename){
            return this._super.apply(this, arguments);
        }
        // If the report is stored into cmis, the server will reponse with
        // a redirect url into a json response.
        framework.blockUI();
        action = _.clone(action);
        var eval_contexts = ([session.user_context] || []).concat([action.context]);
        action.context = pyeval.eval('contexts',eval_contexts);
        var c = crash_manager;
        var params = {
            action: JSON.stringify(action),
            token: new Date().getTime()
        };

        return ajax.post('/web/report', params)
            .then(function(result_data) {
                if(!result_data.url) {
                    framework.unblockUI();
                    c.rpc_error.apply(c, arguments);
                } else {
                    framework.unblockUI();
                    window.open(result_data.url);
               }
            })
            .fail(function(result_data){
                framework.unblockUI();
                var parser = new DOMParser();
                var doc = parser.parseFromString(result_data.responseText, 'text/html'); 
                var error_msg = $(doc.body.childNodes[2]).text();
                c.rpc_error(JSON.parse(error_msg));
            });
     },
});

return ActionManager;

});
