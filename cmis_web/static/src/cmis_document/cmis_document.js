/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

const {onWillRender, useState} = owl;
import {CmisSessionComponent, propsCmisBackend} from "../cmis_utils";

import {AddDocumentDialog} from "../add_document_dialog/add_document_dialog";
import {CmisActions} from "../cmis_actions/cmis_actions";
import {CmisDocumentLinkExisting} from "../cmis_document_link_existing/cmis_document_link_existing";
import {CmisObjectWrapper} from "../cmis_object_wrapper_service";
import {ConfirmationDialog} from "@web/core/confirmation_dialog/confirmation_dialog";
import {RenameDialog} from "../rename_dialog/rename_dialog";
import {UpdateDocumentContentDialog} from "../update_document_content_dialog/update_document_content_dialog";

import {WarningDialog} from "@web/core/errors/error_dialogs";

import {registry} from "@web/core/registry";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
import {useService} from "@web/core/utils/hooks";

export class CmisDocumentField extends CmisSessionComponent {
    setup() {
        this.setupCmisSessionComponent();
        this.rpc = useService("rpc");
        this.orm = useService("orm");

        this.linkDocumentSrcFolders = null;

        this.state = useState({
            value: this.props.value,
            cmisObjectsWrap: [],
            cmisObjectWrap: {},
            allowableActions: {},
            hasData: false,
        });

        this.documentId = null;
        this.displayDocumentId = null;

        onWillRender(async () => {
            this.setDocumentId();
        });
    }

    getCmisObjectWrapperParams() {
        return {};
    }

    get dynamicActionsProps() {
        const props = {
            renameObject: this.renameObject.bind(this),
            updateDocumentContent: this.updateDocumentContent.bind(this),
            dynamicActions: {
                delete_link: {
                    name: this.env._t("Delete Link"),
                    actionClick: this.deleteLink.bind(this),
                },
            },
        };
        return props;
    }

    async setDocumentId() {
        if (this.documentId === this.state.value) {
            return;
        }
        this.documentId = this.state.value;

        if (!this.documentId) {
            return;
        }
        await this.setCmisSessionDefaultRepository();
        this.displayDocument();
    }

    async displayDocument() {
        if (this.displayDocumentId === this.documentId) {
            return;
        }
        this.displayDocumentId = this.documentId;
        this.queryCmisData();
    }

    async queryCmisData() {
        var self = this;
        const options = {
            includeAllowableActions: true,
        };
        await self.initCmisSession();
        const cmisData = await new Promise((resolve) => {
            self.cmisSession
                .getObject(self.displayDocumentId, "latest", options)
                .ok(function (data) {
                    resolve(data);
                });
        });
        const params = this.getCmisObjectWrapperParams();
        this.state.allowableActions = cmisData.allowableActions;
        this.state.allowableActions.canDeleteObject = false;
        this.state.cmisObjectWrap = new CmisObjectWrapper(
            cmisData,
            this.cmisSession,
            params
        );
        this.state.hasData = true;
    }

    onClickAddDocument() {
        const dialogProps = {
            confirm: (files) => {
                this._getDocumentsFromFiles(files).then((documents) => {
                    this.uploadFile(documents);
                });
            },
        };
        this.dialogService.add(AddDocumentDialog, dialogProps);
    }

    async uploadFile(documents) {
        if (!this.props.record.resId) {
            this.dialogService.add(WarningDialog, {
                title: "CMIS Error",
                message: this.env._t("Create your object first"),
            });
            return;
        }
        const cmisValue = await this.rpc("/web/cmis/field/create_document_value", {
            model_name: this.props.record.resModel,
            res_id: this.props.record.data.id,
            field_name: this.props.name,
            documents: documents,
        });
        await this.props.record.load();
        this.props.record.model.notify();
        this.state.value = cmisValue.value;
    }

    _getDocumentsFromFiles(files) {
        return Promise.all(
            _.map(files, function (file) {
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function () {
                        resolve({
                            name: file.name,
                            mimetype: file.type,
                            data: reader.result,
                        });
                    };
                    reader.onerror = (error) => reject(error);
                });
            })
        );
    }

    onClickLinkExisting() {
        this.linkExisting();
    }

    linkExisting() {
        var self = this;
        const dialogProps = {
            title: this.env._t("Link with an existing document"),
            name: this.env._t("Link with an existing document"),
            confirm: (cmisObjectIdentifier) => {
                self.performLinkExisting(cmisObjectIdentifier);
            },
            srcFolderIdentifiers: self.getSrcFolderIdentifiers(),
            backend: this.backend,
            cmisSession: this.cmisSession,
        };
        this.dialogService.add(CmisDocumentLinkExisting, dialogProps);
    }

    getSrcFolderIdentifiers() {
        const linkDocumentSrcFolders = this.props.linkDocumentSrcFolders;
        let folders = [];
        if (linkDocumentSrcFolders) {
            folders = JSON.parse(this.props.record.data[linkDocumentSrcFolders]);
        }
        return folders;
    }

    renameObject(cmisObject) {
        var self = this;
        const dialogProps = {
            title: this.env._t("Rename") + ` ${cmisObject.name}`,
            name: cmisObject.name,
            confirm: (newName) => {
                if (newName !== cmisObject.name) {
                    this.cmisSession
                        .updateProperties(cmisObject.objectId, {"cmis:name": newName})
                        .ok(function () {
                            self.queryCmisData();
                        });
                }
            },
        };
        this.dialogService.add(RenameDialog, dialogProps);
    }

    updateDocumentContent(cmisObject) {
        var self = this;
        const dialogProps = {
            title: this.env._t("Update content of") + ` ${cmisObject.name}`,
            confirm: (file) => {
                if (file) {
                    this.cmisSession
                        .setContentStream(cmisObject.objectId, file, true, file.name)
                        .ok(function () {
                            self.queryCmisData();
                        });
                }
            },
        };
        this.dialogService.add(UpdateDocumentContentDialog, dialogProps);
    }

    deleteLink(cmisObject) {
        const self = this;
        const dialogProps = {
            title: this.env._t("Delete Link with the file"),
            body: this.env._t("Confirm the link deletion of ") + ` ${cmisObject.name}`,
            confirmLabel: this.env._t("Delete link"),
            confirm: () => {
                return self.performDeleteLink();
            },
            cancel: () => {
                return;
            },
        };
        this.dialogService.add(ConfirmationDialog, dialogProps);
    }

    async performDeleteLink() {
        const props = this.props;
        const record = props.record;
        const values = {};
        values[props.name] = false;
        await this.orm.write(record.resModel, [record.data.id], values);
        await record.load();
        record.model.notify();
        this.state.value = false;
    }

    async performLinkExisting(cmisObjectIdentifier) {
        const props = this.props;
        const record = props.record;
        const values = {};
        values[props.name] = cmisObjectIdentifier;
        await this.orm.write(record.resModel, [record.data.id], values);
        await record.load();
        record.model.notify();
        this.state.value = cmisObjectIdentifier;
    }
}

CmisDocumentField.template = "cmis_web.CmisDocumentField";
CmisDocumentField.supportedTypes = ["cmis_document"];
CmisDocumentField.components = {CmisActions};
CmisDocumentField.props = {
    ...standardFieldProps,
    backend: propsCmisBackend,
    linkDocumentSrcFolders: [
        {
            type: String,
            optional: true,
        },
    ],
};

CmisDocumentField.extractProps = ({field, attrs}) => {
    let res = {
        backend: field.backend,
    }
    let linkDocumentSrcFolders = attrs.options.linkDocumentSrcFolders
    if (linkDocumentSrcFolders) {
        res["linkDocumentSrcFolders"] = linkDocumentSrcFolders;
    }
    return res;
};

registry.category("fields").add("cmis_document", CmisDocumentField);
