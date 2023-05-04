/** @odoo-module */

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import { registry } from "@web/core/registry";
import { localization } from "@web/core/l10n/localization";
import { luxonToMomentFormat } from "@web/core/l10n/dates";

class CmisObjectWrapper {
    constructor(cmisObject, cmisSession) {
        //this.parent = parent;
        this.cmisObject = cmisObject;
        this.cmisSession = cmisSession;
        this.parseObject(cmisObject);
        this.columnMapper = {
            name: "  " + this.name,
            title: this.title,
            description: this.description,
            modified: this.fLastModificationDate(),
            created: this.fCreationDate(),
            modifier: this.lastModifiedBy,
        };
        this.classMapper = {
            name: this.fNameClass(),
        }
    }

    parseObject(cmisObject) {
        this.name = this.getSuccinctProperty('cmis:name', cmisObject);
        this.mimetype = this.getSuccinctProperty('cmis:contentStreamMimeType', cmisObject);
        this.baseTypeId = this.getSuccinctProperty('cmis:baseTypeId', cmisObject);
        this.title = this.getSuccinctProperty('cm:title', cmisObject) || '';
        this.description = this.getSuccinctProperty('cmis:description', cmisObject);
        this.lastModificationDate = this.getSuccinctProperty('cmis:lastModificationDate', cmisObject);
        this.creationDate = this.getSuccinctProperty('cmis:creationDate', cmisObject);
        this.lastModifiedBy = this.getSuccinctProperty('cmis:lastModifiedBy', cmisObject);
        this.objectId = this.getSuccinctProperty('cmis:objectId', cmisObject);
        this.versionSeriesId = this.getSuccinctProperty('cmis:versionSeriesId', cmisObject);
        this.versionLabel = this.getSuccinctProperty('cmis:versionLabel');
        this.url = this.cmisSession.getContentStreamURL(this.objectId, 'attachment');
        this.allowableActions = cmisObject.allowableActions;
        this.renditions = cmisObject.renditions;
    }

    getSuccinctProperty(property, cmisObject) {
        cmisObject = cmisObject || this.cmisObject;
        return cmisObject.succinctProperties[property];
    }

    _getCssClass() {
        if (this.baseTypeId === 'cmis:folder') {
            return 'fa fa-folder cmis-folder';
        }

        if (this.mimetype) {
            switch (this.mimetype) {
                case 'application/pdf':
                    return 'fa fa-file-pdf-o';
                case 'text/plain':
                    return 'fa fa-file-text-o';
                case 'text/html':
                    return 'fa fa-file-code-o';
                case 'application/json':
                    return 'fa fa-file-code-o';
                case 'application/gzip':
                    return 'fa fa-file-archive-o';
                case 'application/zip':
                    return 'fa fa-file-archive-o';
                case 'application/octet-stream':
                    return 'fa fa-file-o';
            }
            switch (this.mimetype.split('/')[0]) {
                case 'image':
                    return 'fa fa-file-image-o';
                case 'audio':
                    return 'fa fa-file-audio-o';
                case 'video':
                    return 'fa fa-file-video-o';
            }
        }
        if (this.baseTypeId === 'cmis:document') {
            return 'fa fa-file-o';
        }
        return 'fa fa-fw';
    }

    /** FName
     * return the cmis:name formatted to be rendered in ta datatable cell
     *
     **/
    fNameClass() {
        var cls = this._getCssClass();
        /* var val = "<div class='" + cls + " cmis_content_icon'>" + this.name;
        val += "</div>";
        if (this.getSuccinctProperty('cmis:isVersionSeriesCheckedOut')) {
            val = val + "<div class='fa fa-key cmis-checked-out-by'> " + this.env._t('By:') + ' ' + this.getSuccinctProperty('cmis:versionSeriesCheckedOutBy') + '</div>';
        }
        return val; */
        return cls
    }

    /** FLastModificationDate
     * return the cmis:mastModificationDate formatted to be rendered in ta datatable cell
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
            return value.format(dateFormat + ' ' + timeFormat);
        }
        return '';
    }

    /**
     * Content actions
     *
     * render the list of available actions
     */
    fContentActions() {
        /* var ctx = {object: this};
        _.map(this.cmisObject.allowableActions, function (value, actionName) {
            ctx[actionName] = value;
        });
        ctx.canPreview = ctx.canGetContentStream;
        ctx.isFolder = this.baseTypeId == 'cmis:folder';
        return QWeb.render("CmisContentActions", ctx); */
        return '';
    }

    getContentUrl() {
        return this.cmisSession.getContentStreamURL(this.objectId, 'inline');
    }

    getPreviewUrl() {
        var rendition = _.findWhere(this.renditions, {mimeType: 'application/pdf'});
        if (this.mimetype === 'application/pdf') {
            return this.getContentUrl();
        } else if (rendition) {
            return this.cmisSession.getContentStreamURL(rendition.streamId);
        }
        return null;
    }

    getPreviewType() {
        if (this.baseTypeId === 'cmis:folder') {
            return undefined;
        }
        if (this.mimetype.match("(image)")) {
            return 'image';
        }
        if (this.mimetype.match("(video)")) {
            return 'video';
        }
        // Here we hope that alfresco is able to render the document as pdf
        return "pdf";
    }


    /**
     * Refresh the information by reloading data from the server
     * The method return a deferred called once the information are up to date
     */
    /* refresh() {
        var self = this;
        var dfd = $.Deferred()
        var options = DEFAULT_CMIS_OPTIONS;
        var oldValue = this._clone();
        this.cmisSession.getObject(
            this.objectId,
            'latest', options).ok(function (data) {
            self.parse_object(data);
            self.parent.trigger('wrapped_cmis_node_reloaded', oldValue, self);
            dfd.resolve(self);
        });
        return dfd.promise();
    } */

}

const cmisObjectWrapperService = {
    start() {
        return function wrap(cmisObjects, cmisSession) {
            return cmisObjects.map(
                cmisObject => new CmisObjectWrapper(cmisObject.object, cmisSession)
            )
        };
    },
};

registry.category("services").add("cmisObjectWrapperService", cmisObjectWrapperService);