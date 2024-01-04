/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisDocumentSearch} from "../cmis_document_search/cmis_document_search";
import {Dialog} from "@web/core/dialog/dialog";
import {propsCmisBackend} from "../cmis_utils";
import {useService} from "@web/core/utils/hooks";

const {Component, useRef} = owl;

export class CmisDocumentLinkExisting extends Component {
    setup() {
        this.rpc = useService("rpc");
        this.existingCmisObjectId = useRef("existingCmisObjectId");
        this.srcFolderIdentifiers = this.props.srcFolderIdentifiers;
        this.searchEnabled =
            this.srcFolderIdentifiers && this.srcFolderIdentifiers.length > 0;
    }

    async onClose() {
        this.props.close();
    }

    async onConfirm() {
        try {
            await this.props.confirm(this.existingCmisObjectId.el.value);
        } catch (e) {
            this.props.close();
            throw e;
        }
        this.props.close();
    }

    get searchDynamicProps() {
        const props = this.props;
        return {
            srcFolderIdentifiers: props.srcFolderIdentifiers,
            backend: props.backend,
            onClickRow: this.selectDocument.bind(this),
            cmisSession: props.cmisSession,
        };
    }

    selectDocument(cmisObject) {
        this.existingCmisObjectId.el.value = cmisObject.objectId;
        this.onConfirm();
    }
}

CmisDocumentLinkExisting.template = "cmis_web.CmisDocumentLinkExisting";
CmisDocumentLinkExisting.components = {Dialog, CmisDocumentSearch};
CmisDocumentLinkExisting.props = {
    title: String,
    name: String,
    confirm: Function,
    close: Function,
    backend: propsCmisBackend,
    srcFolderIdentifiers: {
        type: [Array, String],
        optional: true,
    },
    cmisSession: Object,
};
