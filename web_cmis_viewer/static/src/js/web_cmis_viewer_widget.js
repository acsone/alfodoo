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
 var crash_manager = require('web.crash_manager');
 var formats = require('web.formats');
 var ProgressBar = require('web.ProgressBar');
 var pyeval = require('web.pyeval');
 var Registry = require('web.Registry');
 var session = require('web.session');
 var Dialog = require('web.Dialog');
 var framework = require('web.framework');

 
 var _t = core._t;
 var QWeb = core.qweb;

 var CmisCreateFolderDialog = Dialog.extend({
     template: 'CmisCreatefolderDialog',
     init: function(parent, parent_noderef) {
         var self = this;
         var options = {
             buttons: [
                 {text: _t("Close"), click: function () { self.$el.parents('.modal').modal('hide'); }},
                 {text: _t("Create"), click: function () { self.on_click_create(); }}
             ],
             close: function () { self.close();}
         };
         this._super(parent, options);
         this.parent_noderef = parent_noderef;
         this.set_title(_t("Create Folder "));
     },
     start: function() {
         var self = this;
         this._super.apply(this, arguments);

     },

     on_click_create: function() {
         var self = this;
         var input = this.$el.find("input[type='text']")[0];
         framework.blockUI();
         var cmis_session = this.getParent().cmis_session;
         cmis_session
             .createFolder(this.parent_noderef.objectId, input.value)
             .ok(function(new_noderef) {
                 framework.unblockUI();
                 self.getParent().trigger('cmis_node_created', [new_noderef]);
                 self.$el.parents('.modal').modal('hide');
              });
     },
     
     close: function() {
         this._super();
     }
 });
 
 var CmisUpdateContentStreamDialog = Dialog.extend({
    template: 'CmisUpdateContentStreamView',
    events: {
        'change .btn-file :file' : 'on_file_change'
    },

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

    on_file_change: function(e){
        var input = $(e.target),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        var input_text = input.closest('.input-group').find(':text');
        input_text.val(label);
    },
    
    on_click_update_content: function() {
        var self = this;
        var fileSelect = this.$el.find("input[type='file']")[0];
        var fileName = 'application/pdf'; //fileSelect.files[0].mimeType;
        framework.blockUI();
        this.data.cmis_session
            .setContentStream(this.data.objectId, fileSelect.files[0], true, fileName)
            .ok(function(data) {
                framework.unblockUI();
                self.getParent().trigger('cmis_node_content_updated', [data]);
                self.$el.parents('.modal').modal('hide');
             });
    },
    
    close: function() {
        this._super();
    }
});
 
 
 var CmisNoderefWrapper = core.Class.extend({

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
       this.allowableActions = cmis_object.allowableActions;
   },

   getSuccinctProperty: function(property, cmis_object){
       cmis_object = cmis_object || this.cmis_object;
       return this.cmis_object.succinctProperties[property];
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
       _.map(this.cmis_object.allowableActions, function (value, actionName) {
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
        'click td.details-control': 'on_click_details_control',
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
        this.on('cmis_node_created', this, this.on_cmis_node_created);
        this.on('cmis_node_deleted', this, this.on_cmis_node_deleted);
        this.on('cmis_node_udated', this, this.on_cmis_node_updated);
        this.on('cmis_node_content_updated', this, this.on_cmis_node_content_updated);
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
     * Cmis content events 
     */
    on_cmis_node_created: function(new_noderef){
        this.datatable.ajax.reload();
    },

    on_cmis_node_deleted: function(deleted_noderef){
        this.datatable.ajax.reload();
    },

    on_cmis_node_updated: function(updated_noderef){
        this.datatable.ajax.reload();
    },

    on_cmis_node_content_updated: function(updated_noderef){
        this.datatable.ajax.reload();
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
                dom: "<'row'<'col-sm-6 cmis-root-content-buttons'><'col-sm-6'lf>>" +
                     "<'row'<'col-sm-12'tr>>" +
                     "<'row'<'col-sm-5'i><'col-sm-7'p>>",
                "order": [[1, 'asc']]
            });
            this.datatable.on('draw.dt', $.proxy(self, 'register_content_events'));
            this.table_rendered.resolve();
        }
    },

    row_content_factory: function(cmis_object) {
        return new CmisNoderefWrapper(cmis_object.object, this.cmis_session);
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
        var cmis_session = self.cmis_session;
        if (_.isNull(self.displayed_folder_id)){
            callback({data : []});
            return;
        }
        var lang  = settings.oLanguage;
        var start = settings._iDisplayStart;
        var max   = settings._iDisplayLength;
        var order = $.extend( true, [], settings.aaSorting );
        cmis_session
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
             self.on_click_download(row);
         });
         $el_actions.find('.content-action-preview').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_click_preview(row);
         });
         
         $el_actions.find('.content-action-get-properties').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_click_get_properties(row);
         });
         $el_actions.find('.content-action-set-content-stream').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_click_set_content_stream(row);
         });
         $el_actions.find('.content-action-delete-object').on('click', function(e) {
             var row = self._get_event_row(e);
             self.on_click_delete_object(row);
         });
    },

    /**
     * Method called when the a root folder is initialized
     */
    register_root_content_events: function(){
        var self = this;
        this.$el.find('.root-content-action-new-folder').on('click', function(e){
            var dialog = new CmisCreateFolderDialog(self, self.dislayed_folder_noderef);
            dialog.open();
            
        });
        this.$el.find('.root-content-action-new-doc').on('click', function(e){
            
        });
    },

    /**
     * Return the DataTable row on which the event has occured
     */
    _get_event_row: function(e){
        return this.datatable.row( $(e.target).closest('tr') );
    },

    on_click_download: function(row){
        window.open(row.data().url);
    },

    on_click_preview: function(row){
        alert('Preview not yet implemented');
    },

    on_click_get_properties: function(row){
        this.display_row_details(row)
    },

    on_click_details_control: function(e){
        var row = this._get_event_row(e);
        this.display_row_details(row)
    },

    on_click_delete_object: function(row){
        var data = row.data();
        var self = this;
        Dialog.confirm(
                self, _('Confirm deletion of ') + data.name ,
                { confirm_callback: function(){
                    var all_versions = true;
                    self.cmis_session.deleteObject(data.objectId, all_versions).ok(function(){
                        self.trigger('cmis_node_deleted', [data.cmis_object]);
                    });
                }
            });
    },
    
    on_click_set_content_stream: function(row){
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
            self.cmis_session = cmis.createSession(self.cmis_location);
            self.cmis_session.setGlobalHandlers(self.on_cmis_error, self.on_cmis_error);
            self.cmis_session
                .setCredentials('admin', 'admin')
                .loadRepositories()
                .ok(function(data) {
                    self.cmis_session_initialized.resolve();
                 });
        });
    },

    on_cmis_error: function(error){
        framework.unblockUI();
        if (error.type == 'application/json'){
            error = JSON.parse(error.text);
            new Dialog(this, {
                size: 'medium',
                title: _t("CMIS Error "),
                subtitle: error.message,
                $content: $('<div>').html(QWeb.render('CMISSessionr.warning', {error: error}))
            }).open();
        } else {
            new Dialog(this, {
                size: 'medium',
                title: _t("CMIS Error"),
                subtitle: error.statusText,
                $content: $('<div>').html(error.text)
            }).open();
        }
        
        
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
        var self = this;
        this.displayed_folder_id  = folderId;
        this.cmis_session.getObject(folderId, "latest", {
            includeAllowableActions : true})
            .ok(function(noderef){
                self.dislayed_folder_noderef = new CmisNoderefWrapper(noderef, self.cmis_session);
                self.render_folder_actions();
            });
        this.datatable.clear();
        this.datatable.page(0);
        this.datatable.ajax.reload();
    },

    render_folder_actions: function(){
        var ctx = {object: this};
        _.map(this.dislayed_folder_noderef.allowableActions, function (value, actionName) {
            ctx[actionName] = value;
        });
        this.$el.find('.cmis-root-content-buttons').html(QWeb.render("CmisRootContentActions", ctx));
        this.register_root_content_events();    
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
    CmisNoderefWrapper: CmisNoderefWrapper,
    CmisViewer: CmisViewer,
    CmisCreateFolderDialog: CmisCreateFolderDialog,
};

});
 