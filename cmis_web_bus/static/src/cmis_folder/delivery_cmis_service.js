/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web_bus
+ * Authors Laurent Mignon 2016, Maxime Franco 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {EventBus} from "@odoo/owl";
import {registry} from "@web/core/registry";

export const deliveryCmisService = {
    dependencies: ["bus_service", "notification"],
    start(_, {bus_service, notification}) {
        const bus = new EventBus();
        bus_service.addEventListener("notification", ({detail: notifications}) => {
            for (const {payload, type} of notifications) {
                if (type === "cmis_node_notification") {
                    bus.trigger("cmis_bus", payload);
                }
            }
        });
        return bus;
    },
};
registry.category("services").add("deliveryCmisService", deliveryCmisService);
