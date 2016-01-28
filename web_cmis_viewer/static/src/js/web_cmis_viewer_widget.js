/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2015 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer.cmis_viewer_widgets', function( require) {
"use strict";


 var core = require('web.core');
 var formWidget = require('web.form_widgets');
 var formats = require('web.formats');
 var ProgressBar = require('web.ProgressBar');
 var pyeval = require('web.pyeval');
 var Registry = require('web.Registry');
 var session = require('web.session');
 var Dialog = require('web.Dialog');
 var framework = require('web.framework');

 
 var _t = core._t;
 var QWeb = core.qweb;

 var CmisUpdateContentStreamDialog = Dialog.extend({
    template: 'CmisUpdateContentStreamView',
    init: function(parent, row) {
        var self = this;
        var options = {
            buttons: [
                {text: _t("Close"), click: function () { self.$el.parents('.modal').modal('hide'); }},
                {text: _t("Update content"), click: function () { self.on_click_update_content(); }}
            ],
            close: function () { self.close();}
        };
        this._super(parent, options);
        this.row = row;
        this.data = row.data();
        this.set_title(_t("Update content of ") + this.data.name);
    },
    start: function() {
        var self = this;
        this._super.apply(this, arguments);

    },

    on_click_update_content: function() {
        var self = this;
        var fileSelect = this.$el.find("input[type='file']")[0];
        var mimeType = fileSelect.files[0].type;
        framework.blockUI();
        this.data.cmis_session
            .setContentStream(this.data.objectId, fileSelect.files[0], true, mimeType)
            .ok(function(data) {
                framework.unblockUI();
                self.$el.parents('.modal').modal('hide');
             })
            .notOk(framework.unblockUI);
    },
    
    close: function() {
        this._super();
    }
});
 
 
 var CmisContentRow = core.Class.extend({

   init: function(cmis_object, cmis_session){
     this.cmis_object = cmis_object;
     this.cmis_session = cmis_session;
     this.parse_object(cmis_object);
   },

   parse_object: function(cmis_object){
       this.name = this.getSuccinctProperty('cmis:name', cmis_object);
       this.mimetype = this.getSuccinctProperty('cmis:contentStreamMimeType', cmis_object);
       this.baseTypeId = this.getSuccinctProperty('cmis:baseTypeId', cmis_object);
       this.lastModificationDate = this.getSuccinctProperty('cmis:lastModificationDate', cmis_object);
       this.lastModifiedBy = this.getSuccinctProperty('cmis:lastModifiedBy', cmis_object);
       this.objectId = this.getSuccinctProperty('cmis:objectId', cmis_object);
       this.url = this.cmis_session.getContentStreamURL(this.objectId, 'attachment');
   },

   getSuccinctProperty: function(property, cmis_object){
       cmis_object = cmis_object || this.cmis_object;
       return this.cmis_object.object.succinctProperties[property];
   },
   
   _get_css_class: function(){
       if (this.baseTypeId === 'cmis:folder') {
           return 'fa fa-folder';
       }

       if (this.mimetype){
           switch (this.mimetype){
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
           switch (this.mimetype.split('/')[0]){
               case 'image':
                   return 'fa fa-file-image-o';
               case 'audio':
                   return 'fa fa-file-audio-o';
               case 'video':
                   return 'fa fa-file-video-o';
           }
       }
       return 'fa fa-fw';
   },

   /** fName
    * return the cmis:name formatted to be rendered in ta datatable cell
    * 
    **/
   fName: function() {
       var cls = this._get_css_class();
       return "<div class='" + cls + " cmic_content_icon'/>" + this.name;
   },

   /** fLastModificationDate
    * return the cmis:mastModificationDate formatted to be rendered in ta datatable cell
    * 
    **/
   fLastModificationDate: function() {
       return this.format_cmis_timestamp(this.lastModificationDate);
   },

   format_cmis_timestamp: function(cmis_timestamp){
       if (cmis_timestamp) {
           var d = new Date(cmis_timestamp);
           return d.getDate() +'-'+ (d.getMonth()+1) +'-'+ d.getFullYear();
       }
       return '';
   },

   /**
    * Content actions
    * 
    * render the list of available actions
    */
   fContentActions: function(){
       var ctx = {object: this};
       _.map(this.cmis_object.object.allowableActions, function (value, actionName) {
           ctx[actionName] = value;
       });
       ctx['canPreview'] = ctx['canGetContentStream'] && this.mimetype === 'application/pdf';
       return QWeb.render("CmisContentActions", ctx);
   },

 });
 
 var CmisViewer = formWidget.FieldChar.extend({
    template: "CmisViewer",

    widget_class: 'cmis_viewer',
    datatable: null,
    displayed_folder_id: null,

    events: {
        'change input': 'store_dom_value',
        'click td.details-control': 'on_details_control_click',
    },

    /*
     * Override base methods 
     */

    init: function (field_manager, node) {
        this._super(field_manager, node);
        this.id_for_table = _.uniqueId('cmis_viewer_widgets_table');
        this.cmis_session_initialized = $.Deferred();
        this.cmis_config_loaded = $.Deferred();
        this.table_rendered = $.Deferred();
    },

    start: function () {
        var self = this;
        this.states = [];
        this._super.apply(this, arguments);
        // hook on form view content changed: recompute the states, because it may be related to the current stage
        this.getParent().on('view_content_has_changed', self, function () {
            self.render_value();
        });
        // add a listener on parent tab if it exists in order to display the dataTable
        core.bus.on('DOM_updated', self.view.ViewManager.is_in_DOM, function () {
            self.add_tab_listener();
        });
        if (self.$el.is(':visible')){
            self.render_datatable();
        }
        self.load_cmis_config();
        self.init_cmis_session();
    },

    render_value: function() {
        var self = this;
        this._super();
        $.when(self.cmis_session_initialized, self.table_rendered).done(function() {
            var value = self.get('value');
            value = '7c5205b6-126d-40f9-a7a4-f39289c721fe';
            self.set_root_folder_id(value);
        });
    },

    reload_record: function() {
        this.view.reload();
    },

    /*
     * Specific methods 
     */

    add_tab_listener: function() {
        var self = this;
        $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            var tab_id = self.id_for_table;
            var active_tab = $(e.target.hash);
            if (active_tab.find('#' + tab_id).length == 1) {
                  self.render_datatable();
                  return;
            }
        });
    },

    render_datatable: function() {
        if (_.isNull(this.datatable)){
            var self = this;
            this.datatable = $('#' + this.id_for_table).DataTable({
                searching:      false,
                scrollY:        '40vh',
                scrollCollapse: true,
                pageLength:     25,
                deferRender:    true,
                serverSide:     true,
                autoWidth:      false,
                ajax: $.proxy(self, 'datatable_query_cmis_data'),
                columns: [
                    {
                        className:      'details-control',
                        orderable:      false,
                        data:           null,
                        defaultContent: '',
                    },
                    { data: 'fName()'},
                    { data: 'fLastModificationDate()'},
                    { data: 'lastModifiedBy'},
                    { 
                        data: 'fContentActions()',
                        defaultContent: '',
                        orderable: false,
                        
                    },
                ],
                "order": [[1, 'asc']]
            });
            this.datatable.on('draw.dt', $.proxy(self, 'register_content_events'));
            this.table_rendered.resolve();
        }
    },

    row_content_factory: function(cmis_object) {
        return new CmisContentRow(cmis_object, this.session);
    },

    /** function called by datatablet o obtain the required dat
     *
     * The function is given three parameters and no return is required. The
     * parameters are:
     *
     * 1. _object_ - Data to send to the server
     * 2. _function_ - Callback function that must be executed when the required
     *    data has been obtained. That data should be passed into the callback
     *    as the only parameter
     * 3. _object_ - DataTables settings object for the table
     */
    datatable_query_cmis_data: function(data, callback, settings){
        // Get children of the current folder
        var self = this;
        var session = self.session;
        if (_.isNull(self.displayed_folder_id)){
            callback({data : []});
            return;
        }
        var lang  = settings.oLanguage;
        var start = settings._iDisplayStart;
        var max   = settings._iDisplayLength;
        var order = $.extend( true, [], settings.aaSorting );
        session
            .getChildren(self.displayed_folder_id, {
                includeAllowableActions : true,
                skipCount : start,
                maxItems : max,
                orderBy : "cmis:baseTypeId DESC,cmis:name"
                })
            .ok(function(data){
                callback({'data': _.map(data.objects, self.row_content_factory, self),
                          'recordsTotal': data.numItems,
                          'recordsFiltered': data.numItems});
            });
            return;
    },

    /**
     * Method called once all the content has been rendered into the datatable
     */
    register_content_events: function(e, settings){
         var self = this;
         /* some UI fixes */
         this.$el.find('.dropdown-toggle').off('click');
         this.$el.find('.dropdown-toggle').on('click', function (e){
        	 self.dropdown_fix_position($(e.target));
         });
         
         this.$el.find('.dropdown-menu').off('mouseleave');
         // hide the dropdown menu on mouseleave
         this.$el.find('.dropdown-menu').on('mouseleave', function(e){
        	 $(e.target).closest('.btn-group').find('.dropdown-toggle[aria-expanded="true"]').trigger('click').blur();
         });
         // hide the dropdown menu on link clicked
         this.$el.find('.dropdown-menu a').on('click', function(e){
             $(e.target).closest('.btn-group').find('.dropdown-toggle[aria-expanded="true"]').trigger('click').blur();
         });

         /* bind content events */
         var $el_actions = this.$el.find('.cmis_viewer_content_actions')
         $el_actions.find('.content-action-download').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_download_click(row);
         });
         $el_actions.find('.content-action-preview').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_preview_click(row);
         });
         
         $el_actions.find('.content-action-get-properties').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_get_properties_click(row);
         });
         $el_actions.find('.content-action-set-content-stream').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_set_content_stream_click(row);
         });
    },

    /**
     * Return the DataTable row on which the event has occured
     */
    _get_event_row: function(e){
        return this.datatable.row( $(e.target).closest('tr') );
    },

    on_download_click: function(row){
        window.open(row.data().url);
    },

    on_preview_click: function(row){
        alert('Preview not yet implemented');
    },

    on_get_properties_click: function(row){
        this.display_row_details(row)
    },

    on_details_control_click: function(e){
        var row = this._get_event_row(e);
        this.display_row_details(row)
    },
    
    on_set_content_stream_click: function(row){
        var dialog = new CmisUpdateContentStreamDialog(this, row);
        dialog.open();
    },

    /**
     * fix for dropdowns that are inside a container with "overflow: scroll"
     * This fix is required in order to have the dropdown to be displayed
     * on top of the table without scrolling. Without this fix, the menu will
     * appears into the table container but at the same time, scrollbars will
     * appear for the parts of the menu thaht overflows the initial div
     * container 
     * see also http://www.datatables.net/forums/discussion/18529/bootstrap-dropdown-issue-with-datatables
     * and https://github.com/twbs/bootstrap/issues/7160#issuecomment-28180085
     */
    dropdown_fix_position: function(button){
        var dropdown = $(button.parent()).find('.dropdown-menu');
        var dropDownTop = button.offset().top + button.outerHeight();
          dropdown.css('top', dropDownTop + "px");
          dropdown.css('left', button.offset().left + "px");
    },

    load_cmis_config: function() {
        //var ds = new instance.web.DataSetSearch(this, 'cmis.backend', this.context, [[1, '=', 1]]);
        //ds.read_slice(['name', 'location', 'username', 'password'], {}).done(this.on_document_backend_loaded);
        this.on_cmis_config_loaded({location: 'http://10.7.20.179:8080/alfresco/api/-default-/public/cmis/versions/1.1/browser/'})
    },

    on_cmis_config_loaded: function(config) {
        var self = this;
        self.cmis_location = config.location;
        self.cmis_config_loaded.resolve();
    },
    
    init_cmis_session: function(){
        var self = this;
        $.when(this.cmis_config_loaded).done(function (){
            self.session = cmis.createSession(self.cmis_location);
            self.session.setGlobalHandlers(self.do_warn, self.do_warn);
            self.session
                .setCredentials('admin', 'admin')
                .loadRepositories()
                .ok(function(data) {
                    self.cmis_session_initialized.resolve();
                 });
        });
    },

    /**
     * Set a new Root 
     */
    set_root_folder_id: function(folderId){
        var self = this;
        $.when(self.cmis_session_initialized, self.table_rendered).done(function(){
            var library = this;
            self.root_folder_id = folderId;
            //self.reset_bread_crumb();
            self.display_folder(0, folderId);
        })
    },

    /**
     * Display folder content. 
     * Add a link to the folder in the breadcrumb and display children
     */
    display_folder: function(pageIndex, folderId){
        this.displayed_folder_id  = folderId;
        this.datatable.clear();
        this.datatable.page(0);
        this.datatable.ajax.reload();
    },

    /**
     * Display a list of nodes
     * 
     * @folderId: ID of the folder that contains nodes
     * @pageIndex: Index of the page to display
     */
    display_children: function(pageIndex, folderId) {
    },

    /**
     *  Display the details of the selected row
     *  This method is triggered when the user click on the details icon 
     */
    display_row_details: function(row) {
        var tr = $(row.node());
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            // Open this row
            row.child(QWeb.render("CmisContentDetails", {object: row.data()})).show();
            tr.addClass('shown');
        }
    },
});

core.form_widget_registry
    .add('cmis_viewer', CmisViewer);

return {
    CmisUpdateContentStreamDialog: CmisUpdateContentStreamDialog,
    CmisContentRow: CmisContentRow,
    CmisViewer: CmisViewer,
};

});
 