/** @odoo-module **/

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisSessionComponent, propsCmisBackend} from "../cmis_utils";
import {CmisTable} from "../cmis_table/cmis_table";
import {useService} from "@web/core/utils/hooks";

const {onWillStart, useRef, useState} = owl;

export class CmisDocumentSearch extends CmisSessionComponent {
    setup() {
        const self = this;
        this.setupCmisSessionComponent();
        this.rpc = useService("rpc");

        this.state = useState({
            value: this.props.value,
            cmisObjectsWrap: [],
            allowableActions: {},
            hasData: false,
        });

        this.existingCmisObjectId = useRef("existingCmisObjectId");
        this.srcFolderIdentifiers = this.props.srcFolderIdentifiers;

        onWillStart(async () => {
            this.setCmisSessionDefaultRepository().then(function () {
                self.performSearch();
            });
        });
    }

    get searchValue() {
        const cmisObjectIdRef = this.existingCmisObjectId;
        if (Boolean(cmisObjectIdRef) && Boolean(cmisObjectIdRef.el)) {
            return cmisObjectIdRef.el.value;
        }
        return "";
    }

    async onClose() {
        this.props.close();
    }

    async onConfirm() {
        try {
            await this.props.confirm(this.searchValue);
        } catch (e) {
            this.props.close();
            throw e;
        }
        this.props.close();
    }

    onClickSearch(ev) {
        ev.stopPropagation();
        this.performSearch();
    }

    async performSearch() {
        var self = this;
        const cmisQuery = self.getCmisQuery();
        const cmisData = await new Promise((resolve) => {
            self.cmisSession.query(cmisQuery).ok(function (data) {
                resolve(data);
            });
        });
        const params = this.getCmisObjectWrapperParams();
        this.state.cmisObjectsWrap = this.cmisObjectWrapperService.wrap(
            cmisData.results.map((cmisResult) => Object({object: cmisResult})),
            this.cmisSession,
            params
        );
        this.state.hasData = cmisData.results.length > 0;
    }

    getCmisQuery() {
        const cmisFolders = this.srcFolderIdentifiers;
        const searchValue = this.searchValue;
        const treeWhereClauses = [];
        _.each(cmisFolders, function (cmisFolder) {
            treeWhereClauses.push("IN_TREE('" + cmisFolder + "')");
        });

        const fnamesToSearch = ["cmis:name", "cmis:description"];
        const textClauses = [];
        if (textClauses.length > 0) {
            textClauses.push("CONTAINS('" + searchValue + "')");
        }
        _.each(fnamesToSearch, function (fname) {
            textClauses.push(fname + " like '%" + searchValue + "%'");
        });

        return (
            "SELECT * FROM cmis:document " +
            "WHERE (" +
            treeWhereClauses.join(" OR ") +
            ") " +
            " AND " +
            "(" +
            textClauses.join(" OR ") +
            ")"
        );
    }

    get cmisTableDynamicProps() {
        const props = {
            list: this.state.cmisObjectsWrap,
            displayActions: false,
            onClickRow: this.onClickRow.bind(this),
        };
        return props;
    }

    onClickRow(cmisObject) {
        console.log(cmisObject);
        if (this.props.onClickRow) {
            this.props.onClickRow(cmisObject);
        }
    }
}

CmisDocumentSearch.template = "cmis_web.CmisDocumentSearch";
CmisDocumentSearch.components = {CmisTable};
CmisDocumentSearch.props = {
    backend: propsCmisBackend,
    srcFolderIdentifiers: [
        {
            type: Array,
            element: String,
        },
    ],
    cmisSession: {
        type: Object,
    },
    onClickRow: {
        type: Function,
        optional: true,
    },
};
