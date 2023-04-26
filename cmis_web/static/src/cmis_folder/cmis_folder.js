/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { CmisTable } from "../cmis_table/cmis_table";
import framework from "web.framework";

const { Component, useRef, useState } = owl;

class CmisFolderField extends Component {
    setup() {
        this.notificationService = useService("notification");
        this.rpc = useService("rpc");
        this.cmisObjectWrapperService = useService("cmisObjectWrapperService");

        this.backend = this.props.backend;
        this.state = useState({
            value: this.props.value,
            cmisObjectsWrap: [],
            isDraggingInside: false,
        })
        this.buttonCreateFolderRef = useRef("buttonCreateFolder")

        this.cmisSession = null
        this.rootFolderId = null
        this.displayFolderId = null

        this.dragCount = 0

        this.initCmisSession()
        this.setRootFolderId()
    }

    async queryCmisData() {
        var self = this;
        if (!this.displayFolderId) {
            return;
        }
        const options = {
            includeAllowableActions: true,
            renditionFilter: 'application/pdf',
        }
        const cmisObjectsData = await new Promise((resolve, reject) => {
            self.cmisSession.getChildren(self.displayFolderId, options)
            .ok(function(data) {
                resolve(data);
            });
        });
        this.state.cmisObjectsWrap = this.cmisObjectWrapperService(cmisObjectsData.objects, this.cmisSession)
        return;
    }

    initCmisSession() {
        if (this.backend.backend_error) {
            this.notificationService.add(this.backend.backend_error, { type: "danger" });
            return;
        }
        this.cmisSession = cmis.createSession(this.backend.location);
        this.cmisSession.setGlobalHandlers(this.onCmisError, this.onCmisError);
        this.cmisSession.setCharacterSet(document.characterSet);
    }

    get rendererProps() {
        const props = {
            displayFolderId: this.displayFolderId,
            cmisSession: this.cmisSession,
            list: this.state.cmisObjectsWrap,
        };
        return props;
    }

    async setRootFolderId() {
        if (this.rootFolderId === this.props.value) {
            return;
        }
        this.rootFolderId = this.props.value;
        
        var self = this;
        const loadCmisRepositories = new Promise(
            function(resolve, reject) {
                if (self.cmisSession.repositories) {
                    resolve();
                }
                self.cmisSession.loadRepositories()
                .ok(() => resolve())
                .notOk(error => reject(error));
            }
        )

        loadCmisRepositories
        .then(() => this.displayFolder(this.rootFolderId))
    }

    async displayFolder(folderId) {
        if (this.displayFolderId === folderId) {
            return;
        }
        this.displayFolderId = folderId;
        this.queryCmisData();
    }

    async createRootFolder() {
        if (!this.props.record.resId) {
            this.notificationService.add(
                this.env._t("Create your object first"),
                { type: "danger" },
            );
            return;
        }
        const cmisFolderValue = await this.rpc(
            "/web/cmis/field/create_value",
            {
                model_name: this.props.record.resModel,
                res_id: this.props.record.data.id,
                field_name: this.props.name,
            },
        );
        this.state.value = cmisFolderValue.value
    }

    onCmisError(error) {
        if (error) {
            this.notificationService.add(error.message, { type: "danger" });
        }
    }

    uploadFiles(files) {
        var self = this;
        var numFiles = files.length;
        let processedFiles = [];
        if (numFiles > 0) {
            framework.blockUI();
        }
        Array.prototype.forEach.call(files, file => {           //FileList is not an Array but conform to its contract
            self.cmisSession
            .createDocument(self.displayFolderId, file, {"cmis:name": file.name}, file.mimetype)
            .ok(function (data) {
                processedFiles.push(data);
                if (processedFiles.length == numFiles) {
                    self.queryCmisData();
                    framework.unblockUI();
                }
            })
            .notOk(function (error) {
                if (error) {
                    console.error(error.text);
                    framework.unblockUI();
                    /* if (error.type == 'application/json') {
                        var jerror = JSON.parse(error.text);
                        if (jerror.exception === 'contentAlreadyExists') {
                            var dialog = new CmisDuplicateDocumentResolver(self, self.dislayed_folder_cmisobject, file);
                            dialog.open();
                            framework.unblockUI();
                            return;
                        }
                    } */
                }
                //self.on_cmis_error(error);
            });
        })
    }

    onDragenter(ev) {
        if (this.dragCount === 0) {
            this.state.isDraggingInside = true;
        }
        this.dragCount += 1;
    }

    onDragleave(ev) {
        this.dragCount -= 1;
        if (this.dragCount === 0) {
            this.state.isDraggingInside = false;
        }
    }

    onDrop(ev) {
        this.state.isDraggingInside = false;
        this.uploadFiles(ev.dataTransfer.files);
    }
}

CmisFolderField.template = "cmis_web.CmisFolderField";
CmisFolderField.supportedTypes = ["cmis_folder"];
CmisFolderField.components = { CmisTable };
CmisFolderField.props = {
    ...standardFieldProps,
    backend: [
        {
            type: Object,
            optional: true,
            shape: {
                    id: Number,
                    location: String,
                    name: { type: String, optional: true },
            },
        },
        {
            type: Object,
            optional: true,
            shape: { backend_error: String },
        },
    ],
    allowCreate: Boolean,
};

CmisFolderField.extractProps = ({ field }) => {
    return {
        backend: field.backend,
        allowCreate: field.allow_create,
    };
};

registry.category("fields").add("cmis_folder", CmisFolderField);
