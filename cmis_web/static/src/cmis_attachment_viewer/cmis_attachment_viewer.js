/** @odoo-module **/

/**
 * Most of the code copied from odoo's attachment_viewer component from 'mail'
 */

/* ---------------------------------------------------------
+ * Odoo cmis_web
+ * Authors Laurent Mignon 2016, Quentin Groulard 2023 Acsone SA/NV
+ * License in __openerp__.py at root level of the module
+ *---------------------------------------------------------
+*/

import {CmisObjectWrapper} from "../cmis_object_wrapper_service";

const {Component, onMounted, onPatched, onWillUnmount, useRef, useState} = owl;

const MIN_SCALE = 0.5;
const SCROLL_ZOOM_STEP = 0.1;
const ZOOM_STEP = 0.5;

class CmisAttachmentViewerViewable {
    constructor(cmisObject) {
        this.mimetype = cmisObject.mimetype;
        this.isViewable = this.isViewable();
        this.isImage = this.isImage();
        this.isPdf = this.isPdf();
        this.isText = this.isText();
        this.isVideo = this.isVideo();
        this.displayName = cmisObject.name;
        this.documentSource = this.getDocumentSource(cmisObject);
        this.contentUrl = cmisObject.getContentUrl();
        this.localId = cmisObject.objectId;
        this.downloadUrl = cmisObject.url;
    }

    isViewable() {
        return this.isText || this.isImage || this.isVideo || this.isPdf;
    }

    isImage() {
        const imageMimetypes = [
            "image/bmp",
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/svg+xml",
            "image/tiff",
            "image/x-icon",
        ];
        return imageMimetypes.includes(this.mimetype);
    }

    isPdf() {
        return this.mimetype === "application/pdf";
    }

    isText() {
        const textMimeType = [
            "application/javascript",
            "application/json",
            "text/css",
            "text/html",
            "text/plain",
        ];
        return textMimeType.includes(this.mimetype);
    }

    isVideo() {
        const videoMimeTypes = [
            "audio/mpeg",
            "video/x-matroska",
            "video/mp4",
            "video/webm",
        ];
        return videoMimeTypes.includes(this.mimetype);
    }

    getDocumentSource(cmisObject) {
        if (cmisObject.getPreviewType() !== "pdf") {
            return cmisObject.getContentUrl();
        }

        const params = {
            file: cmisObject.getPreviewUrl(),
            httpHeaders: "{}",
            title: cmisObject.name,
        };
        const urlParams = Object.keys(params)
            .map(function (k) {
                return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
            })
            .join("&");
        const path = "/cmis_web/static/lib/pdfjs-1.9.426/web/odoo-viewer.html";
        return path + "?" + urlParams;
    }

    download() {
        const downloadLink = document.createElement("a");
        downloadLink.setAttribute("href", this.downloadUrl);
        // Adding 'download' attribute into a link prevents open a new tab or change the current location of the window.
        // This avoids interrupting the activity in the page such as rtc call.
        downloadLink.setAttribute("download", "");
        downloadLink.click();
    }
}

export class CmisAttachmentViewer extends Component {
    setup() {
        this.MIN_SCALE = MIN_SCALE;
        this._translate = {x: 0, y: 0, dx: 0, dy: 0};

        this.attachmentViewer = useState({
            attachmentViewerViewables: this.getViewables(),
            onClick: () => {
                if (this.attachmentViewer.isDragging) {
                    return;
                }
                this.props.close();
            },
            onClickHeader: (ev) => {
                ev.stopPropagation();
            },
            onClickDownload: (ev) => {
                ev.stopPropagation();
                this.attachmentViewer.attachmentViewerViewable.download();
            },
            onClickClose: () => {
                this.props.close();
            },
            onClickImage: (ev) => {
                if (this.attachmentViewer.isDragging) {
                    return;
                }
                ev.stopPropagation();
            },
            onLoadImage: (ev) => {
                if (!this.attachmentViewer) {
                    return;
                }
                ev.stopPropagation();
                this.attachmentViewer.isImageLoading = false;
            },
            onClickVideo: (ev) => {
                ev.stopPropagation();
            },
            onClickRotate: (ev) => {
                ev.stopPropagation();
                this.rotate();
            },
            onClickPrint: (ev) => {
                ev.stopPropagation();
                this.print();
            },
            onClickPrevious: (ev) => {
                ev.stopPropagation();
                this.previous();
            },
            onClickNext: (ev) => {
                ev.stopPropagation();
                this.next();
            },
            isDragging: false,
            scale: 1,
            angle: 0,
            imageStyle: this.imageStyle(),
            isImageLoading: false,
        });
        this.attachmentViewer.attachmentViewerViewable = this.getCurrentViewable();

        this._imageRefs = {};
        this.attachmentViewer.attachmentViewerViewables.forEach((viewable) => {
            this._imageRefs[viewable.localId] = useRef("image_" + viewable.localId);
        });
        this._zoomerRef = useRef("zoomer");

        this._onClickGlobal = this._onClickGlobal.bind(this);

        onMounted(() => {
            this._handleImageLoad();
            document.addEventListener("click", this._onClickGlobal);
        });
        onPatched(() => {
            this._handleImageLoad();
        });
        onWillUnmount(() => {
            document.removeEventListener("click", this._onClickGlobal);
        });
    }

    getViewables() {
        const viewables = [];
        this.props.cmisFolderObjects.forEach((cmisObject) => {
            if (cmisObject.baseTypeId === "cmis:document") {
                viewables.push(new CmisAttachmentViewerViewable(cmisObject));
            }
        });
        return viewables;
    }

    getCurrentViewable() {
        let currentViewable = null;
        this.attachmentViewer.attachmentViewerViewables.forEach((viewable) => {
            if (viewable.localId === this.props.cmisObject.objectId) {
                currentViewable = viewable;
            }
        });
        return currentViewable;
    }

    imageStyle() {
        const scale = this.attachmentViewer ? this.attachmentViewer.scale : 1;
        const angle = this.attachmentViewer ? this.attachmentViewer.angle : 0;
        let style = `transform: scale3d(${scale}, ${scale}, 1) rotate(${angle}deg);`;

        if (angle % 180 === 0) {
            style += `max-height: 100%;max-width: 100%;`;
        } else {
            style += `max-height: ${window.innerWidth}px;max-width: ${window.innerHeight}px;`;
        }
        return style;
    }

    _handleImageLoad() {
        if (!this.attachmentViewer || !this.attachmentViewer.attachmentViewerViewable) {
            return;
        }
        const image =
            this._imageRefs[this.attachmentViewer.attachmentViewerViewable.localId].el;
        if (
            this.attachmentViewer.attachmentViewerViewable.isImage &&
            (!image || !image.complete)
        ) {
            this.attachmentViewer.isImageLoading = true;
        }
    }

    _onClickGlobal(ev) {
        if (!this.attachmentViewer) {
            return;
        }
        if (!this.attachmentViewer.isDragging) {
            return;
        }
        ev.stopPropagation();
        this._stopDragging();
    }

    _stopDragging() {
        this.attachmentViewer.isDragging = false;
        this._translate.x += this._translate.dx;
        this._translate.y += this._translate.dy;
        this._translate.dx = 0;
        this._translate.dy = 0;
        this._updateZoomerStyle();
    }

    _onMousedownImage(ev) {
        if (!this.attachmentViewer) {
            return;
        }
        if (this.attachmentViewer.isDragging) {
            return;
        }
        if (ev.button !== 0) {
            return;
        }
        ev.stopPropagation();
        this.attachmentViewer.isDragging = true;
        this._dragstartX = ev.clientX;
        this._dragstartY = ev.clientY;
    }

    _onMousemoveView(ev) {
        if (!this.attachmentViewer) {
            return;
        }
        if (!this.attachmentViewer.isDragging) {
            return;
        }
        this._translate.dx = ev.clientX - this._dragstartX;
        this._translate.dy = ev.clientY - this._dragstartY;
        this._updateZoomerStyle();
    }

    _updateZoomerStyle() {
        const attachmentViewer = this.attachmentViewer;
        const image =
            this._imageRefs[attachmentViewer.attachmentViewerViewable.localId].el;
        // Some actions are too fast that sometimes this function is called
        // before setting the refs, so we just do nothing when image is null
        if (!image) {
            return;
        }
        const tx =
            image.offsetWidth * attachmentViewer.scale > this._zoomerRef.el.offsetWidth
                ? this._translate.x + this._translate.dx
                : 0;
        const ty =
            image.offsetHeight * attachmentViewer.scale >
            this._zoomerRef.el.offsetHeight
                ? this._translate.y + this._translate.dy
                : 0;
        if (tx === 0) {
            this._translate.x = 0;
        }
        if (ty === 0) {
            this._translate.y = 0;
        }
        this._zoomerRef.el.style = `transform: translate(${tx}px, ${ty}px)`;

        attachmentViewer.imageStyle = this.imageStyle();
    }

    _zoomIn({scroll = false} = {}) {
        this.attachmentViewer.scale += scroll ? SCROLL_ZOOM_STEP : ZOOM_STEP;
        this._updateZoomerStyle();
    }

    _zoomOut({scroll = false} = {}) {
        if (this.attachmentViewer.scale === MIN_SCALE) {
            return;
        }
        const unflooredAdaptedScale =
            this.attachmentViewer.scale - (scroll ? SCROLL_ZOOM_STEP : ZOOM_STEP);
        this.attachmentViewer.scale = Math.max(MIN_SCALE, unflooredAdaptedScale);
        this._updateZoomerStyle();
    }

    _zoomReset() {
        this.attachmentViewer.scale = 1;
        this._updateZoomerStyle();
    }

    _onClickZoomIn(ev) {
        ev.stopPropagation();
        this._zoomIn();
    }

    _onClickZoomOut(ev) {
        ev.stopPropagation();
        this._zoomOut();
    }

    _onClickZoomReset(ev) {
        ev.stopPropagation();
        this._zoomReset();
    }

    _onWheelImage(ev) {
        ev.stopPropagation();
        if (ev.deltaY > 0) {
            this._zoomOut({scroll: true});
        } else {
            this._zoomIn({scroll: true});
        }
    }

    _onKeydown(ev) {
        switch (ev.key) {
            case "ArrowRight":
                this.next();
                break;
            case "ArrowLeft":
                this.previous();
                break;
            case "Escape":
                this.props.close();
                break;
            case "q":
                this.props.close();
                break;
            case "r":
                this.rotate();
                break;
            case "+":
                this._zoomIn();
                break;
            case "-":
                this._zoomOut();
                break;
            case "0":
                this._zoomReset();
                break;
            default:
                return;
        }
        ev.stopPropagation();
    }

    rotate() {
        this.attachmentViewer.angle += 90;
        this.attachmentViewer.imageStyle = this.imageStyle();
    }

    print() {
        const contentUrl = this.attachmentViewer.attachmentViewerViewable.contentUrl;
        const printWindow = window.open("about:blank", "_new");
        printWindow.document.open();
        printWindow.document.write(`
            <html>
                <head>
                    <script>
                        function onloadImage() {
                            setTimeout('printImage()', 10);
                        }
                        function printImage() {
                            window.print();
                            window.close();
                        }
                    </script>
                </head>
                <body onload='onloadImage()'>
                    <img src="${contentUrl}" alt=""/>
                </body>
            </html>`);
        printWindow.document.close();
    }

    previous() {
        const index = this.attachmentViewer.attachmentViewerViewables.findIndex(
            (attachment) =>
                attachment === this.attachmentViewer.attachmentViewerViewable
        );
        const prevIndex =
            index === 0
                ? this.attachmentViewer.attachmentViewerViewables.length - 1
                : index - 1;
        this.attachmentViewer.attachmentViewerViewable =
            this.attachmentViewer.attachmentViewerViewables[prevIndex];
    }

    next() {
        const index = this.attachmentViewer.attachmentViewerViewables.findIndex(
            (attachment) =>
                attachment === this.attachmentViewer.attachmentViewerViewable
        );
        const nextIndex =
            index === this.attachmentViewer.attachmentViewerViewables.length - 1
                ? 0
                : index + 1;
        this.attachmentViewer.attachmentViewerViewable =
            this.attachmentViewer.attachmentViewerViewables[nextIndex];
    }
}

CmisAttachmentViewer.template = "cmis_web.AttachmentViewer";
CmisAttachmentViewer.props = {
    close: Function,
    cmisObject: CmisObjectWrapper,
    cmisFolderObjects: {type: Array, element: CmisObjectWrapper},
};
