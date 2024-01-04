/** @odoo-module */
/* global cmis */

import {WarningDialog} from "@web/core/errors/error_dialogs";

import framework from "web.framework";
import {useService} from "@web/core/utils/hooks";

const {Component} = owl;

export class CmisSessionComponent extends Component {
    /* Might not be the good way, but well its a way */

    setupCmisSessionComponent() {
        this.cmisObjectWrapperService = useService("cmisObjectWrapperService");
        this.dialogService = useService("dialog");
        this.backend = this.props.backend;
        this.cmisSession = this.props.cmisSession || null;
        this.initCmisSession();
    }

    initCmisSession() {
        if (this.cmisSession !== null) {
            return;
        }
        if (this.backend.backend_error) {
            this.dialogService.add(WarningDialog, {
                title: "CMIS Error",
                message: this.backend.backend_error,
            });
            return;
        }
        this.cmisSession = cmis.createSession(this.backend.location);
        this.cmisSession.setGlobalHandlers(
            this.onCmisError.bind(this),
            this.onCmisError.bind(this)
        );
        this.cmisSession.setCharacterSet(document.characterSet);
    }

    async setCmisSessionDefaultRepository() {
        const self = this;
        console.log("setCmisSessionDefaultRepository");
        return new Promise(function (resolve, reject) {
            if (self.cmisSession.repositories) {
                resolve();
            }
            self.cmisSession
                .loadRepositories()
                .ok(() => resolve())
                .notOk((error) => reject(error));
        });
    }

    onCmisError(error) {
        framework.unblockUI();
        if (error) {
            this.dialogService.add(WarningDialog, {
                title: "CMIS Error",
                message: error.body.message,
            });
        }
    }

    getCmisObjectWrapperParams() {
        return {};
    }
}

export const propsCmisBackend = [
    {
        type: Object,
        optional: true,
        shape: {
            id: Number,
            location: String,
            name: {type: String, optional: true},
        },
    },
    {
        type: Object,
        optional: true,
        shape: {backend_error: String},
    },
];
