/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer.cmis_viewer_widgets', function( require) {
"use strict";


 var core = require('web.core');
 var formWidget = require('web.form_widgets');
 var data = require('web.data');
 var time = require('web.time');
 var ProgressBar = require('web.ProgressBar');
 var Registry = require('web.Registry');
 var Dialog = require('web.Dialog');
 var framework = require('web.framework');

 
 var _t = core._t;
 var QWeb = core.qweb;

 var CmisCreateFolderDialog = Dialog.extend({
     template: 'CmisCreateFolderDialog',
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

 var CmisCreateDocumentDialog = Dialog.extend({
     template: 'CmisCreateDocumentDialog',
     events: {
         'change .btn-file :file' : 'on_file_change'
     },

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
         this.set_title(_t("Create Documents "));
     },

     on_file_change: function(e){
         var input = $(e.target),
         numFiles = input.get(0).files ? input.get(0).files.length : 1,
         label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
         log = numFiles > 1 ? numFiles + ' files selected' : label;
         var input_text = input.closest('.input-group').find(':text');
         input_text.val(log);
     },
     
     on_click_create: function() {
         var self = this,
         input = this.$el.find("input[type='file']")[0],
         numFiles = input.files ? input.files.length : 1;
         var processedFiles = [];
         if (numFiles > 0) {
             framework.blockUI();
         }
         var cmis_session = this.getParent().cmis_session;
         _.each(input.files, function(file, index, list){
             cmis_session
             .createDocument(this.parent_noderef.objectId, file, {'cmis:name': file.name}, file.mimeType)
             .ok(function(data) {
                 processedFiles.push(data);
                 // encoding is not properly handled into multipart.... 
                 // update the document name to work around this encooding issue
                 cmis_session.updateProperties(data.succinctProperties['cmis:objectId'],
                     {'cmis:name': file.name})
                     .ok(function(){
                         if (processedFiles.length == numFiles){
                             framework.unblockUI();
                             self.getParent().trigger('cmis_node_created', [processedFiles]);
                             self.$el.parents('.modal').modal('hide');
                         }
                     }
                 );
              });
         }, self);
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
        label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
        input_text = input.closest('.input-group').find(':text');
        input_text.val(label);
    },
    
    on_click_update_content: function() {
        var self = this;
        var file = this.$el.find("input[type='file']")[0].files[0];
        var fileName = file.name;
        framework.blockUI();
        this.data.cmis_session
            .setContentStream(this.data.objectId, file, true, fileName)
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
           return 'fa fa-folder cmis-folder';
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
       if (this.baseTypeId === 'cmis:document') {
           return 'fa fa-file-o';
       }
       return 'fa fa-fw';
   },

   /** fName
    * return the cmis:name formatted to be rendered in ta datatable cell
    * 
    **/
   fName: function() {
       var cls = this._get_css_class();
       return "<div class='" + cls + " cmis_content_icon'>"+ this.name +"</div>";
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
           var l10n = _t.database.parameters;
           var date_format = time.strftime_to_moment_format(l10n.date_format);
           var time_format = time.strftime_to_moment_format(l10n.time_format);
           var value = moment(d);
           return value.format(date_format + ' ' + time_format);
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
       ctx['canPreview'] = ctx['canGetContentStream']; // && this.mimetype === 'application/pdf';
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
        'click button.cmis-create-root': 'on_click_create_root',
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
        $.when(self.cmis_session_initialized, self.table_rendered).done(function() {
            var value = self.get('value');
            self.$el.find('button.cmis-create-root').addClass('hidden');
            self.set_root_folder_id(value);
            if (!value){
                self.$el.find('button.cmis-create-root').removeClass('hidden');
            }
        });
    },

    reload_record: function() {
        this.view.reload();
    },
    
    _toggle_label: function() {//disabled
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

    /**
     * Create a node for the current model into the DMS
     */
    on_click_create_root: function(){
        if (!this.getParent().datarecord.id){
            Dialog.alert(this, _t('Create your object first'));
            return;
        }
        var self = this;
        $.when(this.cmis_config_loaded).done(function (){
            var view = self.view;
            view.dataset._model.call('create_in_cmis', [
                [view.datarecord.id],
                self.cmis_backend_id,
                view.dataset.get_context()
            ]).done(function(vals) {
                var cmis_objectid = vals[view.datarecord.id];
                view.reload();
            });
        });
    },

    /**
     * Add tab listener to render the table only when the tabe is active
     * if the control is displayed in an inactive tab
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

    get_datatable_config: function(){
        var l10n = _t.database.parameters;
        var self = this;
        var config = {
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
                    width:'20px'
                },
                { data: 'fName()'},
                { 
                    data:'fLastModificationDate()',
                    width:'150px'
                },
                { 
                    data: 'lastModifiedBy',
                     width:'60px'
                },
                { 
                    data: 'fContentActions()',
                    defaultContent: '',
                    orderable: false,
                    width: "80px",
                },
            ],
            language: {
                "decimal":        l10n.decimal_point,
                "emptyTable":     _t("No data available in table"),
                "info":           _t("Showing _START_ to _END_ of _TOTAL_ entries"),
                "infoEmpty":      _t("Showing 0 to 0 of 0 entries"),
                "infoFiltered":   _t("(filtered from _MAX_ total entries)"),
                "infoPostFix":    _t(""),
                "thousands":      l10n.thousands_sep,
                "lengthMenu":     _t("Show _MENU_ entries"),
                "loadingRecords": _t("Loading..."),
                "processing":     _t("Processing..."),
                "search":         _t("Search:"),
                "zeroRecords":    _t("No matching records found"),
                "paginate": {
                    "first":      _t("First"),
                    "last":       _t("Last"),
                    "next":       _t("Next"),
                    "previous":   _t("Previous")
                },
                "aria": {
                    "sortAscending":  _t(": activate to sort column ascending"),
                    "sortDescending": _t(": activate to sort column descending")
                }
            },
            dom: "<'row'<'col-sm-6 cmis-root-content-buttons'><'col-sm-6'lf>>" +
                 "<'row'<'col-sm-12'<'cmis-breadcrumb-container'>>>" +
                 "<'row'<'col-sm-12'tr>>" +
                 "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            "order": [[1, 'asc']]
        };
        return config;
    },
    
    render_datatable: function() {
        if (_.isNull(this.datatable)){
            var self = this;
            this.$datatable = $('#' + this.id_for_table);
            this.$datatable.on('preInit.dt', $.proxy(self, 'on_datatable_preinit'));
            this.$datatable.on('draw.dt', $.proxy(self, 'on_datatable_draw'));
            var config = this.get_datatable_config();
            this.datatable = this.$datatable.DataTable(config);
            this.table_rendered.resolve();
        }
    },

    wrap_noderef: function(cmis_object) {
        return new CmisNoderefWrapper(cmis_object.object, this.cmis_session);
    },

    /**
     * This method is called by DataTables when a table is being initialised 
     * and is about to request data. At the point of being called the table will
     * have its columns and features initialised, but no data will have been
     * loaded (either by Ajax, or reading from the DOM).
     */
    on_datatable_preinit: function(e, settings){
        this.$breadcrumb = $('<ol class="breadcrumb"/>');
        this.$el.find('div.cmis-breadcrumb-container').append(this.$breadcrumb);
        
    },

    /**
     * This method is called whenever the table is redrawn on the page.
     * This function is to use to take actions on newly displayed data. At
     * the point of being called, the table is filled with rows from the last
     * call to the server. It's used to register events handlers to the newly
     * created elements.
     */
    on_datatable_draw: function(e, settings){
        this.register_content_events();
    },
    
    /** function called by datatablet to obtain the required data
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
        if (_.isNull(self.displayed_folder_id)  || ! self.displayed_folder_id){
            callback({'data' : [],
                      'recordsTotal': 0,
                      'recordsFiltered': 0});
            return;
        }
        var lang  = settings.oLanguage;
        var start = settings._iDisplayStart;
        var max   = settings._iDisplayLength;
        var orderBy = this.prepare_order_by(settings.aaSorting);
        cmis_session
            .getChildren(self.displayed_folder_id, {
                includeAllowableActions : true,
                skipCount : start,
                maxItems : max,
                orderBy : orderBy,
                })
            .ok(function(data){
                callback({'data': _.map(data.objects, self.wrap_noderef, self),
                          'recordsTotal': data.numItems,
                          'recordsFiltered': data.numItems});
            });
            return;
    },

    /**
     * Function called be fore calling cmis to build the oderBy parameters
     * from settings given by datatable aaSorting info
     * 
     *  _aaSorting_ - aaSorting is an array of array for each column to be sorted 
     *  initially containing the column's index and a direction string 
     *  ('asc' or 'desc').
     *  
     *  The function return a cmis order_by string. 
     */
    prepare_order_by: function(aaSorting){
        var orders_by = [];
        _.each(aaSorting, function(sort_info, index, list){
            var col_idx = sort_info[0];
            var sort_order = sort_info[1].toUpperCase();
            switch (col_idx){
                case 1:
                    orders_by.push('cmis:baseTypeId DESC,cmis:name ' + sort_order);
                    break;
                case 2:
                    orders_by.push('cmis:lastModificationDate ' + sort_order);
                    break;
                case 3:
                    orders_by.push('cmis:lastModifiedBy ' + sort_order);
                    break;
                
            }
        });
        return orders_by.join();
    },

    /**
     * Method called once all the content has been rendered into the datatable
     */
    register_content_events: function(){
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
         this.$el.find('.cmis-folder').on('click', function(e){
             e.preventDefault();
             e.stopPropagation();
             var row = self._get_event_row(e);
             self.display_folder(0, row.data().objectId);
         });
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
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_get_properties(row);
         });
         $el_actions.find('.content-action-set-content-stream').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_set_content_stream(row);
         });
         $el_actions.find('.content-action-delete-object').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_delete_object(row);
         });
    },

    _prevent_on_hashchange: function(e) {
        /**
         * Odoo register a global handler when the hash change on the current window
         * $(window).bind('hashchange', self.on_hashchange);
         * To avoid thah events triggered by a click on items into a dropdown-menu
         * are handled by the main handler we must stop the propagations.
         * This is required since dropdown menu designed with bootstrat are 
         * a list of '<a href' elements and this trigger a 'hashchange' event
         * when clicked
         */
         e.preventDefault();
         e.stopPropagation();
    },

    
    /**
     * Method called when a root folder is initialized
     */
    register_root_content_events: function(){
        var self = this;
        this.$el.find('.root-content-action-refresh').on('click', function(e){
            if (self.datatable){
            	self.datatable.ajax.reload();
            }
        });
        this.$el.find('.root-content-action-new-folder').on('click', function(e){
            var dialog = new CmisCreateFolderDialog(self, self.dislayed_folder_noderef);
            dialog.open();
            
        });
        this.$el.find('.root-content-action-new-doc').on('click', function(e){
            var dialog = new CmisCreateDocumentDialog(self, self.dislayed_folder_noderef);
            dialog.open();
        });
    },

    /**
     * Return the DataTable row on which the event has occured
     */
    _get_event_row: function(e){
        return this.datatable.row( $(e.target).closest('tr') );
    },

    on_click_download: function(row){
        var $form = $('<form>', {
            action: row.data().url,
            method: 'GET'
        }).appendTo(document.body);
        $form.submit();
        $form.remove();
    },

    on_click_preview: function(row){
        var data = row.data();
        var cmis_session = this.cmis_session;
        var objectId = data.objectId;
        var fileName = data.name;
        var self = this;
        if (data.mimetype === 'application/pdf') {
            var documentUrl = cmis_session.getContentStreamURL(objectId, 'inline');
            self.display_preview(documentUrl, fileName);
        } else {
            cmis_session.getRenditions(objectId).ok(function(renditions){
                var rendition = _.findWhere(renditions, {mimeType: 'application/pdf'});
                if (!rendition){
                    self.do_warn(_t("CMIS Preview"), _t("No preview available for this document"));
                    return;
                }
                var documentUrl = cmis_session.getContentStreamURL(rendition['streamId']);
                self.display_preview(documentUrl, fileName);
                
            });
        }
    },

    display_preview: function(documentUrl, fileName){
        var cmis_session = this.cmis_session;
        var $document_preview = this.$el.find(".documentpreview");
        // Compute the list of headers required by the previewer
        var headers = {};
        if ($.ajaxSettings.headers != null)
            headers = JSON.parse(JSON.stringify($.ajaxSettings.headers));
        if (cmis_session._token != null) {
            // Append the token at the document URL
            var tokenName = Object.keys(cmis_session._token)[0];
            var tokenValue = cmis_session.getToken()[tokenName];
            documentUrl += "&" + tokenName + "=" + tokenValue;
        } else {
            var hash = btoa("admin:admin");
            headers["Authorization"] = "Basic " + hash;
        }

        var width="100%";
        var height =  '' + this.$el.height() - 30 + 'px'; //' ' + (H - r.top) + 'px';
        // Create the previewer URL
        var path = "/web_cmis_viewer/static/lib/viewerjs-0.5.8/ViewerJS/cmis_preview.html";
        var _url = path + '#' + JSON.stringify(headers) + "||" + documentUrl + "&type=pdf&title=" + fileName;
        $document_preview.empty();
        $document_preview.append(QWeb.render("CmisDocumentViewer", {'url': _url,
                                                                    'width': width,
                                                                    'height': height,
                                                                    }));

        // Show the previewer
        var $tables_wrapper = this.$el.find(".dataTables_wrapper"); 
        $tables_wrapper.fadeOut(400, function() {
            $document_preview.fadeIn(400, function() {
            });
        });

        // Attach an event to the "Back to document" icon
        $document_preview.find(".button-back-browser").on('click', function() {
            $document_preview.fadeOut(400, function() {
                $tables_wrapper.fadeIn();
            });
        });
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

    /**
     * Load CMIS settings from Odoo server 
     */
    load_cmis_config: function() {
        var ds = new data.DataSetSearch(this, 'cmis.backend', this.context, [
            [1, '=', 1]]);
        ds.read_slice(['id', 'location'], {}).done(this.on_cmis_config_loaded);
    },

    /**
     * Parse the result of the call to the server to retrieve the CMIS settings
     */
    on_cmis_config_loaded: function(result) {
        var self = this;
        if (result.length != 1){
            this.do_warn(_t("CMIS Config Error"), _t("One and only one CMIS backend must be configurerd"));
            return;
        }
        this.cmis_location = result[0].location;
        this.cmis_backend_id = result[0].id;
        self.cmis_config_loaded.resolve();
    },

    /**
     * Initialize the CmisJS session and register handlers for warnings and errors 
     *  occuring when calling the CMIS DMS
     */
    init_cmis_session: function(){
        var self = this;
        $.when(this.cmis_config_loaded).done(function (){
            self.cmis_session = cmis.createSession(self.cmis_location);
            self.cmis_session.setGlobalHandlers(self.on_cmis_error, self.on_cmis_error);
            self.cmis_session
                .loadRepositories()
                .ok(function(data) {
                    self.cmis_session_initialized.resolve();
                 });
        });
    },

    /**
     * Method called by the cmis session in case of error or warning
     */
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
        if (self.root_folder_id === folderId){
            return;
        }
        self.root_folder_id = folderId;
        $.when(self.cmis_session_initialized, self.table_rendered).done(function(){
            var library = this;
            self.reset_breadcrumb();
            self.display_folder(0, folderId);
        })
    },

    /**
     * Empty the breadcrumb
     */
    reset_breadcrumb: function(){
        this.$breadcrumb.empty();
    },

    /**
     * Display folder content. 
     * Add a link to the folder in the breadcrumb and display children
     */
    display_folder: function(pageIndex, folderId){
        var self = this;
        this.displayed_folder_id  = folderId;
        this.$el.find('.cmis-root-content-buttons').empty();
        if(folderId){
            this.cmis_session.getObject(folderId, "latest", {
                includeAllowableActions : true})
                .ok(function(noderef){
                    self.dislayed_folder_noderef = new CmisNoderefWrapper(noderef, self.cmis_session);
                    self.render_folder_actions();
                });
            this.display_folder_in_breadcrumb(folderId);
        }
        this.datatable.page(0);
        this.datatable.ajax.reload();
    },

    /**
     * Display the folder into the breadcrumb.
     */
    display_folder_in_breadcrumb: function(folderId){
        if (this.$breadcrumb.find('a[data-cmis-folder-id = "' + folderId + '"]').length === 0) {
            var self = this;
            // Get properties of this object and add link to the breadcrumb
            this.cmis_session
                .getObject(folderId, "latest", {includeAllowableActions : false})
                .ok(function(noderef) {
                    var wrapped_noderef =  new CmisNoderefWrapper(noderef, self.cmis_session);
                    var name = (folderId == self.root_folder_id)? _t('Root') : wrapped_noderef.name;
                    var link = $('<a>').attr('href', '#').attr('data-cmis-folder-id', folderId).append(name);
                    self.$breadcrumb.append($('<li>').append(link));
                    link.click(function(e) {
                      e.preventDefault();
                      var current_id = self.dislayed_folder_noderef.objectId;
                      var selectedForlderId = $(e.target).attr('data-cmis-folder-id');
                      if(selectedForlderId !== current_id){
                          $(e.target.parentNode).nextAll().remove();
                          self.display_folder(null, selectedForlderId);
                      }
                    });
                 });
        }  
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
    CmisCreateDocumentDialog: CmisCreateDocumentDialog,
};

});
 