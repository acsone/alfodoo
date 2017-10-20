/**
 * Most of the code copied from https://github.com/odoo/odoo/blob/c1fa3b8ab3dfa1306dbdd3b6dc910405a3357d16/addons/mail/static/src/js/document_viewer.js
 */
odoo.define('cmis_web.DocumentViewer', function (require) {
"use strict";

var core = require('web.core');
var Widget = require('web.Widget');

var QWeb = core.qweb;

var SCROLL_ZOOM_STEP = 0.1;
var ZOOM_STEP = 0.5;

var DocumentViewer = Widget.extend({
    template: "DocumentViewer",
    events: {
        'click .o_download_btn': '_onDownload',
        'click .o_viewer_img': '_onImageClicked',
        'click .o_viewer_video': '_onVideoClicked',
        'click .move_next': '_onNext',
        'click .move_previous': '_onPrevious',
        'click .o_zoom_in': '_onZoomIn',
        'click .o_zoom_out': '_onZoomOut',
        'click .o_close_btn, .o_viewer_img_wrapper': '_onClose',
        'click .o_print_btn': '_onPrint',
        'DOMMouseScroll .o_viewer_content': '_onScroll',    // Firefox
        'mousewheel .o_viewer_content': '_onScroll',        // Chrome, Safari, IE
        'keydown': '_onKeydown',
        'mousedown .o_viewer_img': '_onStartDrag',
        'mousemove .o_viewer_content': '_onDrag',
        'mouseup .o_viewer_content': '_onEndDrag'
    },
    /**
     * The documentViewer takes an array of objects describing attachments in
     * argument, and the ID of an active attachment (the one to display first).
     * Documents that are not of type image or video are filtered out.²
     *
     * @override
     * @param {Array[Object]} attachments list of attachments
     * @param {integer} activeAttachmentID
     */
    init: function (parent, cmisDocumentWrapped, cmisFolderContent) {
        this._super.apply(this, arguments);
        var self = this;
        this.documents = _.filter(cmisFolderContent, function (content) {
            if (content.mimetype === undefined){
                return false;
            }
            var type = content.get_preview_type();

            if (type) {
                content.type = type;
                if (content.type === 'image' || content.type ==='video'){
                    content.viewer_url = content.get_content_url();
                } else {
                    content.viewer_url = self.get_pdf_preview_url(content);
                }
                return true;
            }
        });
        this.activeDocument = cmisDocumentWrapped;
        this._reset();
    },
    /**
     * Open a modal displaying the active attachment
     * @override
     */
    start: function () {
        this.$el.modal('show');
        this.$el.on('hidden.bs.modal', _.bind(this._onDestroy, this));
        this.$('.o_viewer_img').load(_.bind(this._onImageLoaded, this));
        return this._super.apply(this, arguments);
    },

     /**
      * Return a dictionary of http headers to use to query the preview url
      */
     get_pdf_preview_url_headers: function(cmisObjectWrapped){
         if ($.ajaxSettings.headers){
             return JSON.parse(JSON.stringify($.ajaxSettings.headers));
         }
         return {};
     },

     /**
      * Return a dictionary of parameters to use to query the preview url
      */
     get_pdf_preview_url_params: function(cmisObjectWrapped){
         var title = cmisObjectWrapped.name;
         var preview_url = cmisObjectWrapped.get_preview_url();
         var headers = this.get_pdf_preview_url_headers(cmisObjectWrapped);
         return {
           file: preview_url,
           httpHeaders: JSON.stringify(headers),
           title: title,
         };
     },

     /**
      * Return the url used to launch the embeded document previewer
      */
     get_pdf_preview_url: function(cmisObjectWrapped) {
         var params = this.get_pdf_preview_url_params(cmisObjectWrapped);
         // Create the previewer URL
         var path = "/cmis_web/static/lib/pdfjs-1.9.426/web/odoo-viewer.html";
         return path + '?' + $.param(params);
     },

    //--------------------------------------------------------------------------
    // Private
    //---------------------------------------------------------------------------

    /**
     * @private
     */
    _next: function () {
        var index = _.findIndex(this.documents, this.activeDocument);
        index = (index + 1) % this.documents.length;
        this.activeDocument = this.documents[index];
        this._updateContent();
    },
    /**
     * @private
     */
    _previous: function () {
        var index = _.findIndex(this.documents, this.activeDocument);
        index = index === 0 ? this.documents.length - 1 : index - 1;
        this.activeDocument = this.documents[index];
        this._updateContent();
    },
    /**
     * @private
     */
    _reset: function () {
        this.scale = 1;
        this.dragStartX = this.dragstopX = 0;
        this.dragStartY = this.dragstopY = 0;
    },
    /**
     * Render the active attachment
     *
     * @private
     */
    _updateContent: function () {
        this.$('.o_viewer_content').html(QWeb.render('DocumentViewer.Content', {
            widget: this
        }));
        this.$('.o_viewer_img').load(_.bind(this._onImageLoaded, this));
        this._reset();
    },
    /**
     * Zoom in/out image by provided scale
     *
     * @private
     * @param {integer} scale
     */
    _zoom: function (scale) {
        if (scale > 0.5) {
            this.$('.o_viewer_img').css('transform', 'scale3d(' + scale + ', ' + scale + ', 1)');
            this.scale = scale;
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {MouseEvent} e
     */
    _onClose: function (e) {
        e.preventDefault();
        this.$el.modal('hide');
    },
    /**
     * When popup close complete destroyed modal even DOM footprint too
     * @private
     */
    _onDestroy: function () {
        if (this.isDestroyed()) {
            return;
        }
        this.$el.modal('hide');
        this.$el.remove();
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onDownload: function (e) {
        e.preventDefault();
        window.location = '/web/content/' + this.activeDocument.id + '?download=true';
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onDrag: function (e) {
        e.preventDefault();
        if (this.enableDrag) {
            var $image = this.$('.o_viewer_img');
            var $zoomer = this.$('.o_viewer_zoomer');
            var top = $image.prop('offsetHeight') * this.scale > $zoomer.height() ? e.clientY - this.dragStartY : 0;
            var left = $image.prop('offsetWidth') * this.scale > $zoomer.width() ? e.clientX - this.dragStartX : 0;
            $zoomer.css("transform", "translate3d("+ left +"px, " + top + "px, 0)");
        }
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onEndDrag: function (e) {
        e.preventDefault();
        if (this.enableDrag) {
            this.enableDrag = false;
            this.dragstopX = e.clientX - this.dragStartX;
            this.dragstopY = e.clientY - this.dragStartY;
        }
    },
    /**
     * On click of image do not close modal so stop event propagation
     *
     * @private
     * @param {MouseEvent} e
     */
    _onImageClicked: function (e) {
        e.stopPropagation();
    },
    /**
     * Remove loading indicator when image loaded
     * @private
     */
    _onImageLoaded: function () {
        this.$('.o_loading_img').hide();
    },
    /**
     * Move next previous attachment on keyboard right left key
     *
     * @private
     * @param {KeyEvent} e
     */
    _onKeydown: function (e){
        switch (e.which) {
            case $.ui.keyCode.RIGHT:
                e.preventDefault();
                this._next();
                break;
            case $.ui.keyCode.LEFT:
                e.preventDefault();
                this._previous();
                break;
        }
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onNext: function (e) {
        e.preventDefault();
        this._next();
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onPrevious: function (e) {
        e.preventDefault();
        this._previous();
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onPrint: function (e) {
        e.preventDefault();
        var src = this.$('.o_viewer_img').prop('src');
        var script = QWeb.render('PrintImage', {
            src: src
        });
        var printWindow = window.open('about:blank', "_new");
        printWindow.document.open();
        printWindow.document.write(script);
        printWindow.document.close();
    },
    /**
     * Zoom image on scroll
     *
     * @private
     * @param {MouseEvent} e
     */
    _onScroll: function (e) {
        var scale;
        if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
            scale = this.scale + SCROLL_ZOOM_STEP;
            this._zoom(scale);
        } else {
            scale = this.scale - SCROLL_ZOOM_STEP;
            this._zoom(scale);
        }
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onStartDrag: function (e) {
        e.preventDefault();
        this.enableDrag = true;
        this.dragStartX = e.clientX - (this.dragstopX || 0);
        this.dragStartY = e.clientY - (this.dragstopY || 0);
    },
    /**
     * On click of video do not close modal so stop event propagation
     * and provide play/pause the video instead of quitting it
     *
     * @private
     * @param {MouseEvent} e
     */
    _onVideoClicked: function (e) {
        e.stopPropagation();
        var videoElement = e.target;
        if (videoElement.paused) {
            videoElement.play();
        } else {
            videoElement.pause();
        }
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onZoomIn: function (e) {
        e.preventDefault();
        var scale = this.scale + ZOOM_STEP;
        this._zoom(scale);
    },
    /**
     * @private
     * @param {MouseEvent} e
     */
    _onZoomOut: function (e) {
        e.preventDefault();
        var scale = this.scale - ZOOM_STEP;
        this._zoom(scale);
    },
});
return DocumentViewer;
});
