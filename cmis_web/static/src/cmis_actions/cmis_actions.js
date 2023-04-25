/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { registry } from "@web/core/registry";

const { Component } = owl;

class CmisActions extends Component {}

CmisActions.template = "cmis_web.CmisActions";

registry.category("view_widgets").add("cmis_actions", CmisActions);
