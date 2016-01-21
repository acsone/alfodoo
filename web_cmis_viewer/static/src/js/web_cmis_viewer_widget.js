/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2015 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer.cmis_viewer_widgets', function( require) {
 
 var core = require('web.core');
 var formWidget = require('web.form_widgets');
 var formats = require('web.formats');
 var ProgressBar = require('web.ProgressBar');
 var pyeval = require('web.pyeval');
 var Registry = require('web.Registry');
 var session = require('web.session');
 
 var _t = core._t;
 var QWeb = core.qweb;

 var CmisViewer = formWidget.FieldChar.extend({
    template: "CmisViewer",

    widget_class: 'cmis_viewer',
    datatable: null,
    displayed_folder_id: null,


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

    _get_css_class_for_mimetype: function(mimetype){
        switch (mimetype){
            case 'image':
                return 'fa fa-file-image-o';
            case 'audio':
                return 'fa fa-file-audio-o';
            case 'video':
                return 'fa fa-file-video-o';
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
            default:
                return null;
        }
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
                ajax: $.proxy(self, 'datatable_query_cmis_data'),
                columns: [
                    { data: 'object.succinctProperties.cmis:baseTypeId',
                      render: function ( data, type, row ) {
                        if (data == 'cmis:folder'){
                            return "<span class='fa fa-folder'/>";
                        }
                        if (data == 'cmis:document'){
                            mimetype = row.object.succinctProperties['cmis:contentStreamMimeType'];
                            cls = self. _get_css_class_for_mimetype(mimetype) ||  _get_css_class_for_mimetype(mimetype.split('/')[0]);
                            return "<span class='" + cls + "'/>";
                        }
                      }
                    },
                    { data: 'object.succinctProperties.cmis:name' },
                    { data: 'object.succinctProperties.cmis:lastModificationDate',
                      render: function ( data, type, row ) {
                        // If display or filter data is requested, format the date
                        if ( type === 'display' || type === 'filter' ) {
                            var d = new Date( data );
                            return d.getDate() +'-'+ (d.getMonth()+1) +'-'+ d.getFullYear();
                        }
                 
                        // Otherwise the data type requested (`type`) is type detection or
                        // sorting data, for which we want to use the integer, so just return
                        // that, unaltered
                        return data; 
                      }
                    },
                    { data: 'object.succinctProperties.cmis:lastModifiedBy'},
                    { data: 'object.succinctProperties.cmis:objectId' },
                ], 
            });
            this.table_rendered.resolve();
        }
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
                //orderBy : orderBy
                })
            .ok(function(data){
                callback({'data': data.objects,
                          'recordsTotal': data.numItems})
            });
            return;
            /*request : {
                success : function(data) {
                    // Clean and hide elements
                    $(library.element).find("#queryValue").val("");
                    $(library.element).find("#queryClean").hide();

                    // If there is no documents
                    if (data.objects.length == 0) {
                        if ($(library.element).find(".noDocument").length == 0)
                            $(list).closest(".documentlist .table").after("<div class='noDocument'>There is no document in this folder");
                        else
                            $(library.element).find(".noDocument").show();
                    } else {
                        // For each node
                        $(data.objects).each(function(index) {
                            // Append a new item in the table
                            library._appendItem(list, this.object);
                        });
                        // Append the pagination block
                        library._appendPagination(data.hasMoreItems, data.numItems, "_displayChildren");
                    }

                    // Display the document list
                    $(library.element).find(".library div.documentlist").fadeIn();
                    $(library.element).find("#overlay").fadeOut();
                },
                error : function(jqXHR, textStatus, errorThrown) {
                    // Display an error message
                    library._addError("Can't get the children from the object " + folderId + " in the repository.");
                    $(library.element).find(".library div.documentlist").fadeIn();
                    $(library.element).find("#overlay").fadeOut();
                }
            }
        });*/
    },

    load_cmis_config: function() {
        //var ds = new instance.web.DataSetSearch(this, 'cmis.backend', this.context, [[1, '=', 1]]);
        //ds.read_slice(['name', 'location', 'username', 'password'], {}).done(this.on_document_backend_loaded);
        this.on_cmis_config_loaded({location: 'http://localhost:8080/alfresco/api/-default-/public/cmis/versions/1.1/browser/'})
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
    
    render_value: function() {
        var self = this;
        this._super();
        $.when(self.cmis_session_initialized, self.table_rendered).done(function() {
            var value = self.get('value');
            value = '7c5205b6-126d-40f9-a7a4-f39289c721fe';
            self.set_root_folder_id(value);
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
     

    reload_record: function() {
        this.view.reload();
    },
});

core.form_widget_registry
    .add('cmis_viewer', CmisViewer);
});
 