/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { CmisAttachmentViewer } from "../cmis_attachment_viewer/cmis_attachment_viewer"

const { Component } = owl;

class CmisActions extends Component {
    setup() {
        this.dialogService = useService("dialog");
        this.allowableActions = this.props.cmisObject.allowableActions;
    }

    onClickDownload() {
        window.open(this.props.cmisObject.url);
    }

    onClickPreview() {
        this.dialogService.add(CmisAttachmentViewer, { cmisObject: this.props.cmisObject, cmisFolderObjects: this.props.cmisFolderObjects });
    }

    onRename() {
        this.props.renameObject(this.props.cmisObject);
    }

    onUpdate() {
        this.props.updateDocumentContent(this.props.cmisObject);
    }
    
    onDelete() {
        this.props.deleteObject(this.props.cmisObject);
    }
}

CmisActions.template = "cmis_web.CmisActions";
CmisActions.components = { Dropdown, DropdownItem };

registry.category("view_widgets").add("cmis_actions", CmisActions);
