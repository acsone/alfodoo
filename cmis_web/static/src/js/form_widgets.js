/*---------------------------------------------------------
 + * Odoo cmis_web
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web.form_widgets', function( require) {
"use strict";


 var core = require('web.core');
 var formWidget = require('web.form_widgets');
 var data = require('web.data');
 var time = require('web.time');
 var ProgressBar = require('web.ProgressBar');
 var Registry = require('web.Registry');
 var Dialog = require('web.Dialog');
 var framework = require('web.framework');
 var DocumentViewer = require('cmis_web.DocumentViewer')
 
 var _t = core._t;
 var QWeb = core.qweb;

 Dialog.include({
     check_validity: function(){
         if (this.el.checkValidity()){
             return true;
         }
         else {
             // Use pseudo HMLT5 submit to display validation errors
             $('<input type="submit">').hide().appendTo(this.$el).click().remove(); 
         }
     },
 });

 var CmisRenameContentDialog = Dialog.extend({
     template: 'CmisRenameContentDialog',
     init: function(parent, cmisObject) {
         var self = this;
         var options = {
             buttons: [
                 {text: _t("Rename"),
                  classes: "btn-primary",
                  click: function (e) {
                      e.stopPropagation();
                      if(self.check_validity()){
                          self.on_click_process();
                      }
                  }
                 },
                 {text: _t("Cancel"),
                  click: function (e) {
                     e.stopPropagation();
                     self.$el.parents('.modal').modal('hide');
                   }
                 },

             ],
             close: function () { self.close();}
         };
         this._super(parent, options);
         this.cmisObject = cmisObject;
         this.cmisSession = parent.cmis_session;
         this.set_title(_t('Rename') + ' ' + cmisObject.name);
     },

     renderElement: function() {
         this._super();
         this.$newName = this.$el.find('#new-name');
     },

     open: function() {
         this._super();
         this.$newName.val(this.cmisObject.name);
         this.$newName.select();
     },
     on_click_process: function() {
         var self = this;
         var newName = this.$newName.val()
         if (newName !== this.cmisObject.name && this.check_validity()) {
             this.cmisSession
                 .updateProperties(this.cmisObject.objectId, {'cmis:name': newName})
                 .ok(function (cmisObject) {
                     self.getParent().trigger('cmis_node_updated', [cmisObject]);
                     self.$el.parents('.modal').modal('hide');
                 });
         }
      }
 });

 var CmisDuplicateDocumentResolver = Dialog.extend({
     template: 'CmisDuplicateDocumentResolver',
     init: function(parent, parent_cmisobject, file) {
         var self = this;
         var options = {
             buttons: [
                 {text: _t("Process"),
                  classes: "btn-primary",
                  click: function (e) {
                      e.stopPropagation();
                      if(self.check_validity()){
                          self.on_click_process();
                      }
                  }
                 },
                 {text: _t("Cancel"),
                  click: function (e) {
                     e.stopPropagation();
                     self.$el.parents('.modal').modal('hide');
                   }
                 },

             ],
             close: function () { self.close();}
         };
         this._super(parent, options);
         this.parent_cmisobject = parent_cmisobject;
         this.cmis_session = parent.cmis_session;
         this.file = file;
         this.new_filename = '';
         this.original_objectId = '';
         this.set_title(file.name + _t(" already exists"));
     },

     renderElement: function() {
         this._super();
         this.$new_filename = this.$el.find('#new-filename');
         this.$new_filename.val(this.new_filename);
     },

     /**
        * Method called between @see init and @see start. Performs asynchronous
        * calls required by the rendering and the start method.
      */
     willStart: function () {
         var self = this;
         var re = /(?:\.([^.]+))?$/;
         var parts = re.exec(this.file.name);
         var name_without_ext = this.file.name.slice(0, -parts[1].length - 1);
         var ext = parts[1];
         // looks for an alternate filename
         var dfd1 = $.Deferred();
         this.cmis_session.query('' +
             "SELECT cmis:name FROM cmis:document WHERE " +
             "IN_FOLDER('" +  this.parent_cmisobject.objectId +
             "') AND cmis:name like '" + name_without_ext + "-%." + ext + "'")
             .ok(function(data){
                 var cpt = data.results.length;
                 var filenames = _.map(
                     data.results,
                     function(item){return item.succinctProperties['cmis:name'][0];});
                 while (true) {
                     self.new_filename = name_without_ext +'-' +
                        cpt + '.' + ext;
                     if (_.contains(filenames, self.new_filename)) {
                         cpt+=1;
                     } else {
                         break;
                     }
                 }
                 dfd1.resolve();
             })
            .notOk(function(error){
                     self.getParent().on_cmis_error(error);
                     dfd1.reject(error);
            });
         // get original document
         var dfd2 = $.Deferred();
         this.cmis_session.query('' +
             "SELECT cmis:objectId FROM cmis:document WHERE " +
             "IN_FOLDER('" +  this.parent_cmisobject.objectId +
             "') AND cmis:name = '" + this.file.name + "'")
             .ok(function(data){
                 self.original_objectId = data.results[0].succinctProperties['cmis:objectId'];
                 dfd2.resolve();
             })
            .notOk(function(error){
                 self.getParent().on_cmis_error(error);
                 dfd2.reject(error);
            });
         return $.when(this._super.apply(this, arguments),  dfd1.promise(), dfd2.promise());
     },

     on_click_process: function() {
         var self = this;
         var rename = this.$el.find("input:radio[name='duplicate-radios']:checked").val() === "rename";
         if (rename){
             this.cmis_session
                 .createDocument(this.parent_cmisobject.objectId, this.file, {'cmis:name': this.$new_filename.val()}, this.file.mimeType)
                 .ok(function(new_cmisobject) {
                     self.getParent().trigger('cmis_node_created', [new_cmisobject]);
                     self.$el.parents('.modal').modal('hide');
                 });
         } else {
             var major = this.$el.find("#new-version-type").val() === "major";
             var comment = this.$el.find('#comment').val();
             self.cmis_session.checkOut(self.original_objectId)
                 .ok(function(checkedOutNode) {
                     self.cmis_session
                         .checkIn(checkedOutNode.succinctProperties['cmis:objectId'], major, {}, self.file, comment)
                         .ok(function (data) {
                             // after checkin the working copy must be deleted (self.data)
                             // the date received into the response is the new version
                             // created
                             self.getParent().trigger('cmis_node_deleted', [self.original_objectId]);
                             self.$el.parents('.modal').modal('hide');
                         });
                 });
         }
     }
 });

 var CmisCreateFolderDialog = Dialog.extend({
     template: 'CmisCreateFolderDialog',
     init: function(parent, parent_cmisobject) {
         var self = this;
         var options = {
             buttons: [
                 {text: _t("Create"),
                  classes: "btn-primary",
                  click: function () {
                      if(self.check_validity()){
                          self.on_click_create();
                      }
                  }
                 },
                 {text: _t("Close"),
                  click: function () { self.$el.parents('.modal').modal('hide');}},
             ],
             close: function () { self.close();}
         };
         this._super(parent, options);
         this.parent_cmisobject = parent_cmisobject;
         this.set_title(_t("Create Folder "));
     },

     on_click_create: function() {
         var self = this;
         var input = this.$el.find("input[type='text']")[0];
         framework.blockUI();
         var cmis_session = this.getParent().cmis_session;
         cmis_session
             .createFolder(this.parent_cmisobject.objectId, input.value)
             .ok(function(new_cmisobject) {
                 framework.unblockUI();
                 self.getParent().trigger('cmis_node_created', [new_cmisobject]);
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

     init: function(parent, parent_cmisobject) {
         var self = this;
         var options = {
             buttons: [
                 {text: _t("Add"),
                  classes: "btn-primary",
                  click: function (e) {
                      e.stopPropagation();
                      if(self.check_validity()){
                          self.on_click_create();
                      }
                  }
                 },
                 {text: _t("Close"),
                  click: function (e) {
                     e.stopPropagation();
                     self.$el.parents('.modal').modal('hide');
                   }
                 },

             ],
             close: function () { self.close();}
         };
         this._super(parent, options);
         this.parent_cmisobject = parent_cmisobject;
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
         var parent = this.getParent();
         var cmis_session = parent.cmis_session;
         _.each(input.files, function(file, index, list){
             cmis_session
             .createDocument(this.parent_cmisobject.objectId, file, {'cmis:name': file.name}, file.mimeType)
             .ok(function(data) {
                 processedFiles.push(data);
                 if (processedFiles.length == numFiles){
                     framework.unblockUI();
                     parent.trigger('cmis_node_created',[processedFiles]);
                 }
             });
         }, self);
         self.$el.parents('.modal').modal('hide');
     },

     close: function() {
         this._super();
     }
 });

 var SingleFileUpload = Dialog.extend({
    events: {
        'change .btn-file :file' : 'on_file_change'
    },

    init: function(parent, cmisObjectWrapped, options) {
        var self = this;
        var btnOkTitle = _t('OK');
        if (!_.isUndefined(options) && _.has(options, 'btnOkTitle')){
            btnOkTitle = options.btnOkTitle;
        }
        options = _.defaults(options || {}, {
            buttons: [
                {text:btnOkTitle,
                 classes: "btn-primary",
                 click: function (e) {
                    e.stopPropagation();
                    if(self.check_validity()){
                        self.on_click_ok();
                    }
                 }},
                 {text: _t("Close"),
                  click: function (e) {
                     e.stopPropagation();
                     self.$el.parents('.modal').modal('hide');
                   }
                 },
            ],
            close: function () { self.close();}
        });
        this._super(parent, options);
        this.data = cmisObjectWrapped;
    },

    on_file_change: function(e){
        var input = $(e.target),
        label = input.val().replace(/\\/g, '/').replace(/.*\//, ''),
        input_text = input.closest('.input-group').find(':text');
        input_text.val(label);
    },

    on_click_ok: function() {
        var self = this;
        var input = this.$el.find("input[type='file']")[0]
        var numFiles = input.files ? input.files.length : 1;
        if (numFiles == 0){
            this.close();
        }
        var file = input.files[0];
        var fileName = file.name;
        framework.blockUI();
        this._do_upload(file, fileName).then(function(data) {
            framework.unblockUI();
            if (!_.isUndefined(data)) {
                self.getParent().trigger('cmis_node_content_updated', [data]);
            }
            self.$el.parents('.modal').modal('hide');
         });
    },

    /**
     * This method must be implemented into concrete dialog an return a promise
     * The promise must be resolved with updated cmisObject
     */
    _do_upload: function(file, filename){
    },

    close: function() {
        this._super();
    }
 });

 var CmisUpdateContentStreamDialog = SingleFileUpload.extend({
    template: 'CmisUpdateContentStreamView',

    init: function(parent, cmisObjectWrapped) {
        var self = this;
        var options = {
            btnOkTitle: _t("Update content"),
            title: _t("Update content of ") + cmisObjectWrapped.name,
        };
        this._super(parent, cmisObjectWrapped, options);
        //this.set_title(_t("Update content of ") + this.data.name);
    },

  _do_upload: function(file, fileName){
        var dfd = $.Deferred();
        this.data.cmis_session
            .setContentStream(this.data.objectId, file, true, fileName)
            .ok(function(data) {
                dfd.resolve(data);
             });
         return dfd.promise();
    },
 });

 var CmisCheckinDialog = SingleFileUpload.extend({
    template: 'CmisCheckinView',

    init: function(parent, cmisObjectWrapped) {
        var self = this;
        var options = {
            btnOkTitle: _t("Import new version"),
            title: _t("Import new version of ") + cmisObjectWrapped.name,
        };
        this._super(parent, cmisObjectWrapped, options);
        //this.set_title(_t("Update content of ") + this.data.name);
    },

  _do_upload: function(file, fileName){
        var self = this;
        var dfd = $.Deferred();
        var major = this.$el.find("input:radio[name='version-radios']:checked").val() === "major";
        var comment = this.$el.find('#comment').val();
        this.data.cmis_session
            .checkIn(this.data.objectId, major, {}, file, comment)
            .ok(function(data) {
                // after checkin the working copy must be deleted (self.data)
                // the date received into the response is the new version
                // created
                self.getParent().trigger('cmis_node_deleted', [self.data.cmis_object]);
                dfd.resolve(data);
             });
         return dfd.promise();
    },
 });

 var CmisObjectWrapper = core.Class.extend({

   init: function(parent, cmis_object, cmis_session){
     this.parent = parent;
     this.cmis_object = cmis_object;
     this.cmis_session = cmis_session;
     this.parse_object(cmis_object);
   },

   _clone: function(){
       return new CmisObjectWrapper(this.parent, this.cmis_object, this.cmis_session);
   },

   parse_object: function(cmis_object){
       this.name = this.getSuccinctProperty('cmis:name', cmis_object);
       this.mimetype = this.getSuccinctProperty('cmis:contentStreamMimeType', cmis_object);
       this.baseTypeId = this.getSuccinctProperty('cmis:baseTypeId', cmis_object);
       this.title = this.getSuccinctProperty('cm:title', cmis_object) || '';
       this.description = this.getSuccinctProperty('cmis:description', cmis_object);
       this.lastModificationDate = this.getSuccinctProperty('cmis:lastModificationDate', cmis_object);
       this.lastModifiedBy = this.getSuccinctProperty('cmis:lastModifiedBy', cmis_object);
       this.objectId = this.getSuccinctProperty('cmis:objectId', cmis_object);
       this.versionSeriesId = this.getSuccinctProperty('cmis:versionSeriesId', cmis_object);
       this.versionLabel = this.getSuccinctProperty('cmis:versionLabel');
       this.url = this.cmis_session.getContentStreamURL(this.objectId, 'attachment');
       this.allowableActions = cmis_object.allowableActions;
       this.renditions = cmis_object.renditions;
   },

   getSuccinctProperty: function(property, cmis_object){
       cmis_object = cmis_object || this.cmis_object;
       return cmis_object.succinctProperties[property];
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
       var val = "<div class='" + cls + " cmis_content_icon'>"+ this.name;
       val = val +"</div>";
       if (this.getSuccinctProperty('cmis:isVersionSeriesCheckedOut')) {
           val = val + "<div class='fa fa-key cmis-checked-out-by'> " + _t('By:') + ' ' + this.getSuccinctProperty('cmis:versionSeriesCheckedOutBy') + '</div>';
       }
       return val;
   },

   /** fLastModificationDate
    * return the cmis:mastModificationDate formatted to be rendered in ta datatable cell
    *
    **/
   fLastModificationDate: function() {
       return this.format_cmis_timestamp(this.lastModificationDate);
   },

   fDetails: function(){
     return '<div class="fa fa-plus-circle"/>'  ;
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

   get_content_url: function(){
       return this.cmis_session.getContentStreamURL(this.objectId, 'inline');
   },

   get_preview_url: function(){
       var rendition = _.findWhere(this.renditions, {mimeType: 'application/pdf'});
       if (this.mimetype === 'application/pdf') {
           return this.get_content_url();
       } else if (rendition) {
           return this.cmis_session.getContentStreamURL(rendition['streamId']);
       }
       return null;
   },

    get_preview_type: function(){
        if (this.baseTypeId === 'cmis:folder') {
            return undefined;
        }
        if (this.mimetype.match("(image)")){
            return 'image';
        }
        if (this.mimetype.match("(video)")){
            return 'video';
        }
        // here we hope that alfresco is able to render the document as pdf
        return "pdf";
    },


    /**
     * Refresh the information by reloading data from the server
     * The method return a deferred called once the information are up to date
     */
    refresh: function(){
        var self = this;
        var dfd = $.Deferred()
        var options =  DEFAULT_CMIS_OPTIONS;
        var oldValue = this._clone();
        this.cmis_session.getObject(
            this.objectId,
            'latest', options).ok(function (data){
            self.parse_object(data);
            self.parent.trigger('wrapped_cmis_node_reloaded', oldValue, self);
            dfd.resolve(self);
        });
        return dfd.promise();
    },

 });

 var DEFAULT_CMIS_OPTIONS = {
     includeAllowableActions : true,
     renditionFilter: 'application/pdf',
}

 /**
  * A Mixin class defining common methods used by Cmis widgets
  */
var CmisMixin = {

     init: function (){
         this.cmis_session_initialized = $.Deferred();
         this.cmis_config_loaded = $.Deferred();
         this.cmis_location = null;
         this.cmis_backend_id = null;
         this.cmis_backend_fields = ['id', 'location'];
     },

     /**
      * Load CMIS settings from Odoo server
      */
     load_cmis_config: function() {
         this.bind_cmis_config(this.backend);
         this.on_cmis_config_loaded(this.backend);
     },

     /**
      * Parse the result of the call to the server to retrieve the CMIS settings
      */
     bind_cmis_config: function(result){
         if (result.backend_error){
             this.do_warn(
                 _t("CMIS Backend Config Error"),
                 result.backend_error,
                 true);
             return;
         }
         this.cmis_location = result.location;
         this.cmis_backend_id = result.id;
     },

     on_cmis_config_loaded: function(result) {
         this.cmis_config_loaded.resolve();
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
             self.cmis_session_initialized.resolve();
             self.cmis_session.setCharacterSet(document.characterSet);
         });
     },

     /**
      * Load the default repository if required.
      * token or credentils must already be set.
      * At this stage the widget doesn't support multi repositories but
      * if we want to get a chance to put a token based on the data from
      * the odoo model, this method can only be called once the values
      * are provided by the form controller ant we load the root folder for
      *  exemple (set_root_folder_id).
      * Loading the repositories is required before calling to others cmis
      * methods
      */
     load_cmis_repositories: function(){
         var dfd = $.Deferred();
         var self = this;
         if (this.cmis_session.repositories) {
             return dfd.resolve();
         } else {
             self.cmis_session
                 .loadRepositories()
                 .ok(function(data) {
                     dfd.resolve();
                 })
                 .notOk(function(error){
                     self.on_cmis_error(error);
                     dfd.reject(error);
                 });
         }
         return dfd.promise();
     },

     /**
      * Method called by the cmis session in case of error or warning
      */
     on_cmis_error: function(error){
         framework.unblockUI();
         if (error){
             if (error.type == 'application/json'){
                 error = JSON.parse(error.text);
                 new Dialog(this, {
                     size: 'medium',
                     title: _t("CMIS Error "),
                     $content: $('<div>').html(QWeb.render('CMISSession.warning', {error: error}))
                 }).open();
             } else {
                 new Dialog(this, {
                     size: 'medium',
                     title: _t("CMIS Error"),
                     subtitle: error.statusText,
                     $content: $('<div>').html(error.text)
                 }).open();
             }
         }
     },

     /**
      * Wrap a
      */
     wrap_cmis_object: function(cmisObject) {
         if (_.has(cmisObject, 'object')){
             cmisObject = cmisObject.object;
         }
         return new CmisObjectWrapper(this, cmisObject, this.cmis_session);
     },

     wrap_cmis_objects: function(cmisObjects) {
        var self = this;
        return _.chain(cmisObjects)
            .map(function(item){return self.wrap_cmis_object(item)})
            .uniq(function(wrapped){return wrapped.objectId})
            .value()
     },
};

 var FieldCmisFolder = formWidget.FieldChar.extend(CmisMixin, {
    template: "FieldCmisFolder",

    widget_class: 'field_cmis_folder',
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
        CmisMixin.init.call(this);
        this.id_for_table = _.uniqueId('field_cmis_folder_widgets_table');
        this.table_rendered = $.Deferred();
        this.on('cmis_node_created', this, this.on_cmis_node_created);
        this.on('cmis_node_deleted', this, this.on_cmis_node_deleted);
        this.on('cmis_node_updated', this, this.on_cmis_node_updated);
        this.on('cmis_node_content_updated', this, this.on_cmis_node_content_updated);
        this.on('wrapped_cmis_node_reloaded', this, this.on_wrapped_cmis_node_reloaded);
        this.backend = this.field_manager.get_field_desc(this.name).backend;
    },

    start: function () {
        var self = this;
        this.states = [];
        this._super.apply(this, arguments);
        if (this.datatable){
            return;
        }
        this.view.on("change:actual_mode", this, this.on_mode_change);

        // refresh the displayed forlder on reload.
        this.getParent().on('load_record', this, this.reload_displayed_folder);

        // add a listener on parent tab if it exists in order to display the dataTable
        core.bus.on('DOM_updated', self.view.ViewManager.is_in_DOM, function () {
            self.add_tab_listener();
            if (self.$el.is(':visible')){
                self.render_datatable();
            }
        });

        self.load_cmis_config();
        self.init_cmis_session();
    },

    reset_widget: function(){
        if (this.datatable){
            this.table_rendered = $.Deferred();
            this.datatable.destroy();
            this.datatable = null;
            this.root_folder_id = null;
            this.displayed_folder_id = null;
        }
    },

    destroy_content: function() {
        this.reset_widget();
        this._super.apply(this, arguments);
    },

    on_mode_change: function() {
        if (this.$el.is(':visible')){
            this.render_datatable();
        }
        if (!this.getParent().datarecord.id){
            // hide the widget if the record is not yet created
            this.$el.hide();
        } else {
            this.$el.toggle(!this.invisible);
        }
    },
    store_dom_value: function () {
        if (this.root_folder_id) {
            this.internal_set_value(this.root_folder_id);
        }
    },

    render_value: function() {
        var value = this.get('value');
        if (this.$input) {
            this.$input.val(value);
        }
        if (!this.getParent().datarecord.id){
            // hide the widget if the record is not yet created
            this.$el.hide();
        }
        this.$el.find('button.cmis-create-root').addClass('hidden');
        this.set_root_folder_id(value);
        if (!value){
            this.$el.find('button.cmis-create-root').removeClass('hidden');
        }
    },

    reload_record: function() {
        this.view.reload();
    },

    _toggle_label: function() {//disabled
     },

    /*
     * Cmis content events
     */
    on_cmis_node_created: function(cmisobjects){
        this.refresh_datatable();
    },

    on_cmis_node_deleted: function(cmisobjects){
        this.refresh_datatable();
    },

    on_cmis_node_updated: function(cmisobjects){
        this.refresh_datatable();
    },

    on_wrapped_cmis_node_reloaded: function(oldValue, newValue){
        this.refresh_datatable();
    },

    on_cmis_node_content_updated: function(cmisobjects){
        this.on_cmis_node_updated(cmisobjects);
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
            self.rpc('/web/cmis/field/create_value',{
                'model_name': view.dataset.model,
                'res_id': view.datarecord.id,
                'field_name': self.name
            }).done(function(vals) {
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
            responsive:     true,
            colReorder:     {
                realtime: false,
            },
            stateSave:      true,
            ajax: $.proxy(self, 'datatable_query_cmis_data'),
            buttons: [{
                extend: 'collection',
                text: _t('Columns') + '<span class="caret"/>',
                buttons: [ 'columnsToggle' ],
            }],
            columns: [
                {
                    className:      'details-control',
                    orderable:      false,
                    data:           'fDetails()',
                    defaultContent: '',
                    width:'12px'
                },
                { data: 'fName()'},
                {
                    data: 'title',
                    visible: false
                },
                { data: 'description'},
                {
                    data:'fLastModificationDate()',
                    width:'120px'
                },
                {
                    data: 'lastModifiedBy',
                    width:'60px',
                    visible: false,
                },
                {
                    data: 'fContentActions()',
                    defaultContent: '',
                    orderable: false,
                    width: "80px",
                },
            ],
            select: false,
            rowId: 'objectId',
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
            dom: "<'row'<'col-sm-6 cmis-root-content-buttons'><'col-sm-6'Blf>>" +
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
            this.$datatable.on('column-reorder.dt', $.proxy(self, 'on_datatable_column_reorder'));
            var config = this.get_datatable_config();
            this.datatable = this.$datatable.DataTable(config);
            this.table_rendered.resolve();
        } else {
            this.datatable.draw();
        }
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

    /**
     * This event is triggered when a column is reordered.
     */
    on_datatable_column_reorder: function(e, settings){
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
        var options = _.defaults({
            skipCount : start,
            maxItems : max,
            orderBy : orderBy,
        }, DEFAULT_CMIS_OPTIONS);
        cmis_session
            .getChildren(self.displayed_folder_id, options)
            .ok(function(data){
                callback({'data': _.map(data.objects, self.wrap_cmis_object, self),
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
                orders_by.push('cm:title ' + sort_order);
                break;
            case 3:
                orders_by.push('cmis:description ' + sort_order);
                break;
            case 4:
                orders_by.push('cmis:lastModificationDate ' + sort_order);
                break;
            case 5:
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
         var datatable_container =this.$el.find('.dataTables_scrollBody');
         datatable_container.off('dragleave dragend drop dragover dragenter drop');
         if (self.dislayed_folder_cmisobject && self.dislayed_folder_cmisobject.allowableActions['canCreateDocument']){
             datatable_container.on('dragover dragenter', function(e) {
                 datatable_container.addClass('is-dragover');
                 e.preventDefault();
                 e.stopPropagation();
             });
             datatable_container.on('dragleave dragend drop', function(e) {
                datatable_container.removeClass('is-dragover');
                e.preventDefault();
                e.stopPropagation();
             });
             datatable_container.on('drop', function(e){
                 e.preventDefault();
                 e.stopPropagation();
                 self.upload_files(e.originalEvent.dataTransfer.files);

             });
         }
         /* some UI fixes */
         this.$el.find('.dropdown-toggle').off('click');
         this.$el.find('.dropdown-toggle').on('click', function (e){
             self.dropdown_fix_position($(e.target));
         });

         this.$el.find('.dropdown-menu').off('mouseleave');
         // hide the dropdown menu on mouseleave
         this.$el.find('.dropdown-menu').on('mouseleave', function(e){
             if($(e.target).is(':visible')){
                 $(e.target).closest('.btn-group').find('.dropdown-toggle[aria-expanded="true"]').trigger('click').blur();
             }
         });
         // hide the dropdown menu on link clicked
         this.$el.find('.dropdown-menu a').on('click', function(e){
             if($(e.target).is(':visible')){
                 $(e.target).closest('.btn-group').find('.dropdown-toggle[aria-expanded="true"]').trigger('click').blur();
             }
         });
         this.$el.find('.cmis-folder').on('click', function(e){
             e.preventDefault();
             e.stopPropagation();
             var row = self._get_event_row(e);
             self.display_folder(0, row.data().objectId);
         });
         var $el_actions = this.$el.find('.field_cmis_folder_content_actions');
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
         $el_actions.find('.content-action-rename').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_rename(row);
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
         $el_actions.find('.content-action-checkin').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_checkin(row);
         });
         $el_actions.find('.content-action-checkout').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_checkout(row);
         });
         $el_actions.find('.content-action-cancel-checkout').on('click', function(e) {
             self._prevent_on_hashchange(e);
             var row = self._get_event_row(e);
             self.on_click_cancel_checkout(row);
         });
    },

    /**
     * Upload files into the current cmis folder
     */
    upload_files: function(files){
        var self = this;
        var numFiles = files.length;
        var processedFiles = [];
        if (numFiles > 0) {
            framework.blockUI();
        }
        var cmis_session = this.cmis_session;
        _.each(files, function(file, index, list){
            cmis_session
            .createDocument(this.displayed_folder_id, file, {'cmis:name': file.name}, file.mimeType)
            .ok(function(data) {
                processedFiles.push(data);
                if (processedFiles.length == numFiles){
                    framework.unblockUI();
                    self.trigger('cmis_node_created', [processedFiles]);
                }
            })
            .notOk(function(error){
                if (error){
                    console.error(error.text);
                    if (error.type == 'application/json') {
                        var jerror = JSON.parse(error.text);
                        if (jerror.exception === 'contentAlreadyExists'){
                            var dialog = new CmisDuplicateDocumentResolver(self, self.dislayed_folder_cmisobject, file);
                            dialog.open();
                            framework.unblockUI();
                            return;
                        }
                    }
                 }
                 self.on_cmis_error(error);
             });
        }, this);
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
     * Reload and redraw the DataTables in the current context, optionally
     * updating ordering, searching and paging as required.
     *
     * @param {string} paging: This parameter is used to determine what kind
     * of draw DataTables will perform. There are three options available:
     * - paging (default): ordering and search will not be updated and the
     *                     paging position held where is was
     * - full-reset: the ordering and search will be recalculated and the rows
     *               redrawn in their new positions. The paging will be reset
     *               back to the first page.
     * - full-hold: the ordering and search will be recalculated and the rows
     *              redrawn in their new positions. The paging will not be
     *              reset - i.e. the current page will still be shown.
     */
    refresh_datatable: function(paging) {
        this.datatable.draw(paging || 'page');
    },

    /**
     * Method called when a root folder is initialized
     */
    register_root_content_events: function(){
        var self = this;
        this.$el.find('.root-content-action-refresh').on('click', function(e){
            if (self.datatable){
                self.refresh_datatable();
            }
        });
        this.$el.find('.root-content-action-new-folder').on('click', function(e){
            var dialog = new CmisCreateFolderDialog(self, self.dislayed_folder_cmisobject);
            dialog.open();

        });
        this.$el.find('.root-content-action-new-doc').on('click', function(e){
            var dialog = new CmisCreateDocumentDialog(self, self.dislayed_folder_cmisobject);
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
        row.data().refresh().done(
            $.proxy(this.do_download, this)
        );
    },

    do_download: function(cmisObjectWrapped){
        window.open(cmisObjectWrapped.url);
    },

    on_click_preview: function(row){
        var cmisObjectWrapped = row.data();
        var documentViewer = new DocumentViewer(this, cmisObjectWrapped, this.datatable.data());
        documentViewer.appendTo($('body'));
    },

    on_click_get_properties: function(row){
        this.display_row_details(row);
    },

    on_click_rename: function(row){
        var dialog = new CmisRenameContentDialog(this, row.data());
        dialog.open();
    },

    on_click_details_control: function(e){
        var row = this._get_event_row(e);
        this.display_row_details(row);
    },

    on_click_delete_object: function(row){
        var data = row.data();
        var self = this;
        Dialog.confirm(
                self, _t('Confirm deletion of ') + data.name ,
                { confirm_callback: function(){
                    var all_versions = true;
                    self.cmis_session.deleteObject(data.objectId, all_versions).ok(function(){
                        self.trigger('cmis_node_deleted', [data.cmis_object]);
                    });
                }
            });
    },

    on_click_set_content_stream: function(row){
        var dialog = new CmisUpdateContentStreamDialog(this, row.data());
        dialog.open();
    },

    on_click_checkin: function(row){
        var dialog = new CmisCheckinDialog(this, row.data());
        dialog.open();
    },

    on_click_checkout: function(row) {
        var self = this;
        row.data().refresh().done(
            function(data){
                self.cmis_session.checkOut(data.objectId)
                    .ok(function (data) {
                        self.refresh_datatable();
                        self.do_download(self.wrap_cmis_object(data));
                     });
              });
    },

    on_click_cancel_checkout: function(row){
        var cmisObjectWrapped = row.data();
        var self = this;
        this.cmis_session.cancelCheckOut(cmisObjectWrapped.objectId)
        .ok(function (data) {
            self.refresh_datatable();
         });
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
        var offset = button.offset();
        var dropDownTop = offset.top + button.outerHeight();
        dropdown.css('top', dropDownTop + "px");

        // For the left position we need to take care of the available space
        // on the right and the width of the dropdown to display according to
        // its content.
        // see http://codereview.stackexchange.com/questions/31501/adjust-bootstrap-dropdown-menu-based-on-page-width/39580
        var offsetLeft = offset.left;
        var dropdownWidth = dropdown.width();
        var docWidth = $(window).width();
        var subDropdown = dropdown.eq(1);
        var subDropdownWidth = subDropdown.width();
        var isDropdownVisible = (offsetLeft + dropdownWidth <= docWidth);
        var isSubDropdownVisible = (offsetLeft + dropdownWidth + subDropdownWidth <= docWidth);
        if (!isDropdownVisible || !isSubDropdownVisible) {
            dropdown.addClass('pull-right');
            dropdown.css('left', '');
        } else {
            dropdown.removeClass('pull-right');
            dropdown.css('left', button.offset().left + "px");
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
                self.load_cmis_repositories().done(function() {
                self.reset_breadcrumb();
                self.display_folder(0, self.root_folder_id);
            });
        });
    },

    /**
     * Empty the breadcrumb
     */
    reset_breadcrumb: function(){
        this.$breadcrumb.empty();
    },

    reload_displayed_folder: function(){
      if(! this.displayed_folder_id){
          return;
      }
      var page_index = this.page_index;
      this.page_index = -1; // force reload
      this.display_folder(page_index, this.displayed_folder_id);
    },

    /**
     * Display folder content.
     * Add a link to the folder in the breadcrumb and display children
     */
    display_folder: function(pageIndex, folderId){
        if (this.displayed_folder_id === folderId &&
                this.page_index === pageIndex) {
            return;
        }
        var self = this;
        this.displayed_folder_id  = folderId;
        this.page_index = pageIndex;
        this.$el.find('.cmis-root-content-buttons').empty();
        if(folderId){
            this.cmis_session.getObject(folderId, "latest", {
                includeAllowableActions : true})
                .ok(function(cmisobject){
                    self.dislayed_folder_cmisobject = new CmisObjectWrapper(this, cmisobject, self.cmis_session);
                    self.render_folder_actions();
                });
            this.display_folder_in_breadcrumb(folderId);
            this.datatable.rows().clear();
            this.datatable.ajax.reload(null, true);
        } else {
            self.datatable.clear().draw();
        }
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
                .ok(function(cmisobject) {
                    var wrapped_cmisobject =  new CmisObjectWrapper(this, cmisobject, self.cmis_session);
                    var name = (folderId == self.root_folder_id)? _t('Root') : wrapped_cmisobject.name;
                    var link = $('<a>').attr('href', '#').attr('data-cmis-folder-id', folderId).append(name);
                    self.$breadcrumb.append($('<li>').append(link));
                    link.click(function(e) {
                      e.preventDefault();
                      var current_id = self.dislayed_folder_cmisobject.objectId;
                      var selectedForlderId = $(e.target).attr('data-cmis-folder-id');
                      if(selectedForlderId !== current_id){
                          $(e.target.parentNode).nextAll().remove();
                          self.display_folder(0, selectedForlderId);
                      }
                    });
                 });
        }
    },

    render_folder_actions: function(){
        var ctx = {object: this};
        _.map(this.dislayed_folder_cmisobject.allowableActions, function (value, actionName) {
            ctx[actionName] = value;
        });
        this.$el.find('.cmis-root-content-buttons').html(QWeb.render("CmisRootContentActions", ctx));
        this.register_root_content_events();
    },

    /**
     *  Display the details of the selected row
     *  This method is triggered when the user click on the details icon
     */
    display_row_details: function(row) {
        var tr = $(row.node());
        tr.find('td.details-control div').toggleClass('fa-minus fa-plus-circle');
        if ( row.child.isShown() ) {
            // This row is already open - close it
            row.child.hide();
        }
        else {
            // Open this row
            row.child(QWeb.render("CmisContentDetails", {object: row.data()})).show();
        }
    },
});

core.form_widget_registry
    .add('cmis_folder', FieldCmisFolder);

return {
    CmisUpdateContentStreamDialog: CmisUpdateContentStreamDialog,
    CmisCheckinDialog: CmisCheckinDialog,
    CmisObjectWrapper: CmisObjectWrapper,
    CmisMixin: CmisMixin,
    FieldCmisFolder: FieldCmisFolder,
    CmisCreateFolderDialog: CmisCreateFolderDialog,
    CmisCreateDocumentDialog: CmisCreateDocumentDialog,
    CmisDuplicateDocumentResolver: CmisDuplicateDocumentResolver,
    DEFAULT_CMIS_OPTIONS: DEFAULT_CMIS_OPTIONS,
};

});
 
