/* ---------------------------------------------------------
 + * Odoo cmis_web
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

odoo.define("cmis_web_report_write_alf.form_widgets", function (require) {
    "use strict";

    require("cmis_web_bus.form_widgets");
    var form_widgets = require("cmis_web.form_widgets");

    form_widgets.FieldCmisFolder.include({
        on_notify_cmis_node: function (message) {
            this._super.apply(this, arguments);
            var cmis_objectid = message.cmis_objectid;
            if (this.root_folder_id !== cmis_objectid) {
                return;
            }
            if (message.action === "open_url") {
                window.open(message.url);
            }
        },
    });
});
