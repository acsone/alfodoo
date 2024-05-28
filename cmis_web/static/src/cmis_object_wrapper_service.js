/** @odoo-module */

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {localization} from "@web/core/l10n/localization";
import {luxonToMomentFormat} from "@web/core/l10n/dates";
import {registry} from "@web/core/registry";
import {sortBy} from "@web/core/utils/arrays";

export class CmisObjectWrapper {
    constructor(cmisObject, cmisSession, params) {
        this.setup(cmisObject, cmisSession, params);
    }

    setup(cmisObject, cmisSession) {
        this.cmisObject = cmisObject;
        this.cmisSession = cmisSession;
        this.parseObject(cmisObject);
        this.columnMapper = {
            name: "  " + this.name,
            title: this.title,
            description: this.description,
            lastModificationDate: this.fLastModificationDate(),
            creationDate: this.fCreationDate(),
            lastModifiedBy: this.lastModifiedBy,
        };
        this.classMapper = {
            name: this.fNameClass(),
        };
    }

    parseObject(cmisObject) {
        this.name = this.getSuccinctProperty("cmis:name", cmisObject);
        this.mimetype = this.getSuccinctProperty(
            "cmis:contentStreamMimeType",
            cmisObject
        );
        this.baseTypeId = this.getSuccinctProperty("cmis:baseTypeId", cmisObject);
        this.title = this.getSuccinctProperty("cm:title", cmisObject) || "";
        this.description = this.getSuccinctProperty("cmis:description", cmisObject);
        this.lastModificationDate = this.getSuccinctProperty(
            "cmis:lastModificationDate",
            cmisObject
        );
        this.creationDate = this.getSuccinctProperty("cmis:creationDate", cmisObject);
        this.lastModifiedBy = this.getSuccinctProperty(
            "cmis:lastModifiedBy",
            cmisObject
        );
        this.objectId = this.getSuccinctProperty("cmis:objectId", cmisObject);
        this.versionSeriesId = this.getSuccinctProperty(
            "cmis:versionSeriesId",
            cmisObject
        );
        this.versionLabel = this.getSuccinctProperty("cmis:versionLabel");
        this.url = this.cmisSession.getContentStreamURL(this.objectId, "attachment");
        this.allowableActions = cmisObject.allowableActions;
        this.renditions = cmisObject.renditions;
    }

    getSuccinctProperty(property, cmisObject) {
        const object = cmisObject || this.cmisObject;
        return object.succinctProperties[property];
    }

    _getCssClass() {
        if (this.baseTypeId === "cmis:folder") {
            return "fa fa-folder cmis-folder";
        }

        if (this.mimetype) {
            switch (this.mimetype) {
                case "application/pdf":
                    return "fa fa-file-pdf-o";
                case "text/plain":
                    return "fa fa-file-text-o";
                case "text/html":
                    return "fa fa-file-code-o";
                case "application/json":
                    return "fa fa-file-code-o";
                case "application/gzip":
                    return "fa fa-file-archive-o";
                case "application/zip":
                    return "fa fa-file-archive-o";
                case "application/octet-stream":
                    return "fa fa-file-o";
            }
            switch (this.mimetype.split("/")[0]) {
                case "image":
                    return "fa fa-file-image-o";
                case "audio":
                    return "fa fa-file-audio-o";
                case "video":
                    return "fa fa-file-video-o";
            }
        }
        if (this.baseTypeId === "cmis:document") {
            return "fa fa-file-o";
        }
        return "fa fa-fw";
    }

    /** FName
     * @returns the cmis:name formatted to be rendered in ta datatable cell
     *
     **/
    fNameClass() {
        var cls = this._getCssClass();
        return cls;
    }

    /** FLastModificationDate
     * @returns the cmis:mastModificationDate formatted to be rendered in ta datatable cell
     *
     **/
    fLastModificationDate() {
        return this.formatCmisTimestamp(this.lastModificationDate);
    }

    /**
     * Format cmis object creation date
     * @returns the cmis:creationDate formatted to be rendered in a datatable cell
     *
     **/
    fCreationDate() {
        return this.formatCmisTimestamp(this.creationDate);
    }

    fDetails() {
        return '<div class="fa fa-plus-circle"/>';
    }

    formatCmisTimestamp(cmisTimestamp) {
        if (cmisTimestamp) {
            var d = new Date(cmisTimestamp);
            var dateFormat = luxonToMomentFormat(localization.dateFormat);
            var timeFormat = luxonToMomentFormat(localization.timeFormat);
            var value = moment(d);
            return value.format(dateFormat + " " + timeFormat);
        }
        return "";
    }

    getContentUrl() {
        return this.cmisSession.getContentStreamURL(this.objectId, "inline");
    }

    getPreviewUrl() {
        var rendition = _.findWhere(this.renditions, {mimeType: "application/pdf"});
        if (this.mimetype === "application/pdf") {
            return this.getContentUrl();
        } else if (rendition) {
            return this.cmisSession.getContentStreamURL(rendition.streamId);
        }
        return null;
    }

    getPreviewType() {
        if (this.baseTypeId === "cmis:folder") {
            return undefined;
        }
        if (this.mimetype.match("(image)")) {
            return "image";
        }
        if (this.mimetype.match("(video)")) {
            return "video";
        }
        // Here we hope that alfresco is able to render the document as pdf
        return "pdf";
    }
}

export class CmisObjectCollection {
    constructor(cmisObjects, cmisSession, params) {
        this.cmisObjects = cmisObjects.map(
            (cmisObject) =>
                new CmisObjectWrapper(cmisObject.object, cmisSession, params)
        );
        this.orderBy = [];
        this.sortBy("name");
    }

    sortBy(field) {
        if (this.orderBy.length && field === this.orderBy[0].name) {
            this.orderBy[0].asc = !this.orderBy[0].asc;
        } else {
            this.orderBy.length = 0;
            this.orderBy.push({name: field, asc: true});
        }
        this.cmisObjects = sortBy(
            this.cmisObjects,
            field,
            this.orderBy[0].asc ? "asc" : "desc"
        );
    }
}

const cmisObjectWrapperService = {
    start() {
        function wrap(cmisObjects, cmisSession, params) {
            return new CmisObjectCollection(cmisObjects, cmisSession, params);
        }

        return {wrap};
    },
};

registry.category("services").add("cmisObjectWrapperService", cmisObjectWrapperService);
