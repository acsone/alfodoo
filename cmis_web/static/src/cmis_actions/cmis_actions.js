/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisAttachmentViewer} from "../cmis_attachment_viewer/cmis_attachment_viewer";
import {CmisObjectWrapper} from "../cmis_object_wrapper_service";
import {Dropdown} from "@web/core/dropdown/dropdown";
import {DropdownItem} from "@web/core/dropdown/dropdown_item";
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";

const {Component, useState} = owl;

export class CmisActions extends Component {
    setup() {
        this.dialogService = useService("dialog");
        this.allowableActions = this.props.cmisObject.allowableActions;
        this.dynamicActions = this.props.dynamicActions || {};

        this.state = useState({
            dynamicActions: this.dynamicActions,
        });
    }

    onClickDynamicAction(name) {
        this.props.dynamicActions[name].actionClick(this.props.cmisObject);
    }

    onClickDownload() {
        window.open(this.props.cmisObject.url);
    }

    onClickPreview() {
        const props = this.props;
        this.dialogService.add(CmisAttachmentViewer, {
            cmisObject: props.cmisObject,
            cmisFolderObjects: [props.cmisObject],
        });
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
CmisActions.components = {Dropdown, DropdownItem};
CmisActions.props = {
    cmisObject: CmisObjectWrapper,
    renameObject: Function,
    updateDocumentContent: Function,
    deleteObject: {
        type: Function,
        optional: true,
    },
    dynamicActions: [
        {
            type: Object,
            optional: true,
        },
    ],
};

registry.category("view_widgets").add("cmis_actions", CmisActions);
