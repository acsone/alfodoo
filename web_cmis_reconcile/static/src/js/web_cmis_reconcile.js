/*---------------------------------------------------------
 + * Odoo web_cmis_reconcile
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_reconcile.cmis_reconcile_view', function( require) {
"use strict";

var core = require('web.core');
var data = require('web.data');
var Model = require('web.Model');
var Widget = require('web.Widget');
var form_common = require('web.form_common');
var ControlPanelMixin = require('web.ControlPanelMixin');
var cmis_widgets = require('web_cmis_viewer.cmis_viewer_widgets');

var _t = core._t;
var QWeb = core.qweb;

var CmisDocumentReconciliation =  Widget.extend(
        ControlPanelMixin,
        cmis_widgets.CmisMixin,
        {
    className: 'oe_cmis_document_reconciliation',
    events: {
        "click .oe_form_button_create": "_quick_create",
        "click .oe_form_button_link": "_quick_link",
    },

    init: function(parent, context) {
        this._super(parent);
        cmis_widgets.CmisMixin.init.call(this);
        this.documents_loaded = $.Deferred();
        this.context = context.context;
        this.res_model = context.res_model;
        this.cmis_directory = this.context.cmis_directory;
        this.default_context = this.context.context;
        this.title = context.display_name || _t("Documents Reconciliation");
        this.load_cmis_config();
        this.init_cmis_session();
        this.documents_to_reconcile = [];
    },

    get_root_folder: function() {
        var dfd = $.Deferred();
        var self = this;
        this.cmis_session.getObjectByPath(self.cmis_directory, {
            includeAllowableActions : true})
            .ok(function(cmisobject){
                var data = new cmis_widgets.CmisObjectWrapper(cmisobject, self.cmis_session);
                self.current_folder_object = data;
                dfd.resolve(data);
            })
            .notOk(function(error){
                self.on_cmis_error(error);
                dfd.reject(error);
            });
        return dfd.promise();
    },

    start: function() {
        this._super();
        var self = this;

        $.when(self.cmis_session_initialized).then(function() {
            self.get_root_folder().done($.proxy(self.get_documents_to_reconcile, self));
        });
        self.documents_reconciled = [];
        $.when(self.documents_loaded).then(function() {
            var label_button_create = _t('Add');
            if ('label_button_create' in self.context){
                label_button_create = _t(self.context.label_button_create);
            }
            var label_button_link = _t('Link');
            if ('label_button_link' in self.context){
                label_button_link = _t(self.context.label_button_link);
            }
            self.$el.prepend(QWeb.render("CmisDocumentReconcileView", {
                title: self.title,
                label_button_create: label_button_create,
                label_button_link: label_button_link,
                total_lines: self.documents_to_reconcile.length
            }));
            /* Set specific labels if provided */
            
            self.init_pager();
            self.reconcile_current_doc();
        });
    },

    init_pager: function(){
        // Pager
        var self = this;
        self.doc_idx = 0;
        if (!this.$pager) {
            this.$pager = $(QWeb.render("CmisDocumentReconcilePager", {'widget': self}));
            this.$el.find('.oe_list_pager').replaceWith(this.$pager);
            this.$pager
                .on('click', 'button[data-pager-action]', function () {
                    var $this = $(this);
                    
                    var max_page_index = self._get_remaining_documents_to_reconcile().length - 1;
                    switch ($this.data('pager-action')) {
                        case 'first':
                            self.doc_idx = 0;
                            break;
                        case 'last':
                            self.doc_idx = max_page_index;
                            break;
                        case 'next':
                            self.doc_idx += 1;
                            break;
                        case 'previous':
                            self.doc_idx -= 1;
                            break;
                    }
                    if (self.doc_idx < 0) {
                        self.doc_idx = max_page_index;
                    } else if (self.doc_idx > max_page_index) {
                        self.doc_idx = 0;
                    }
                    self.reconcile_current_doc();
                });
        }
    },

    _get_remaining_documents_to_reconcile: function() {
        return _.difference(this.documents_to_reconcile, this.documents_reconciled);
    },
    
    update_progressbar: function() {
        var self = this;
        var done = self.documents_reconciled.length;
        var total = self.documents_to_reconcile.length;
        var prog_bar = self.$(".progress .progress-bar");
        prog_bar.attr("aria-valuenow", done);
        prog_bar.css("width", (done/total*100)+"%");
        self.$(".progress .progress-text .valuenow").text(done);
    },

    get_cmis_fields_to_retrieve : function(){
        var fields = {'cmis:contentStreamMimeType': null,
                   'cmis:objectId' : null,
                   'cmis:name': null};
        _.forEach(this.context.cmis_fields_mapping, function(idx, value){
            fields[value] = null;
        });
        return _.keys(fields);
    },

    get_cmis_prop_value: function(properties, key){
        if (key in properties){
            var property = properties[key]; 
            var value = property['value']
            switch (property['type']) {
                case 'date':
                case 'datetime':
                    var d = new Date(parseInt(value));
                    return d;
                    break;
                default:
                    return value;
            }
        }
        return null;
    },
    
    get_documents_to_reconcile: function(folderObj) {
        var self = this;
        self.cmis_session.getChildren(folderObj.objectId,{
            includeAllowableActions : true,
            filter: self.get_cmis_fields_to_retrieve().join(','),
            renditionFilter: 'application/pdf'})
            .ok(function(data){
                var wrapped_objects = _.map(data.objects, self.wrap_cmis_object, self);
                self.documents_to_reconcile = $.grep(wrapped_objects, function(wrapped){
                    // The query ask for children and to include renditions of type application/pdf
                    // Filter out non pdf document for which there is no rendition service to render
                    // the document into pdf
                    return wrapped.mimetype === 'application/pdf' || (wrapped.renditions && wrapped.renditions.length >0);
                });
                self.documents_loaded.resolve();
            });
    },

    get_current_cmis_object: function() {
        var docs = this._get_remaining_documents_to_reconcile();
        if (docs.length > 0) {
            return docs[this.doc_idx];
        }
        return null;
    },
    
    reconcile_current_doc: function() {
        this.update_progressbar();
        var current_doc = this.get_current_cmis_object();
        if(current_doc){
            this.preview_doc(current_doc);
        } else {
            var msg = _t('No document to reconcile!');
            if (this.documents_to_reconcile.length > 0) {
                // end of the reconciliation process
                msg = _t('All documents reconciled!');
            }
            var div_msg = _.str.sprintf("<div class='all_reconciled'><h3> %s </h3></div>",msg);
            var $elPreview = this.$el.find(".reconciliation_form");
            $elPreview.empty();
            $elPreview.append(div_msg);
        }
        
    },

    preview_doc: function(cmisObjectWrapped){
        var previewer_url = this.get_previewer_url(cmisObjectWrapped);
        this.display_preview(previewer_url);
    },
    

    display_preview: function(previewerUrl) {
        var $elPreview = this.$el.find(".documentpreview");
        var width="100%";
        var H = $(window).height();
        var r = $elPreview.get(0).getBoundingClientRect();
        var height = '' + (H - r.top) + 'px';
        // Append the previewer
        $elPreview.empty();
        $elPreview.append("<iframe id='viewer' src = '" + previewerUrl + "' width='" + width + "' height='" + height + "' allowfullscreen webkitallowfullscreen></iframe>")
    },

    _finalize_reconcile : function(model_id) {
        var self = this;
        var ResModel = new Model(self.res_model);
        var wrapped_object = this.get_current_cmis_object();
        var context = this.build_context();
        ResModel.call('read', [model_id, ['cmis_objectid', 'cmis_backend_id']],
            {context: context}).then(function(vals){
                if(vals.cmis_objectid){
                    self._move_object_to_folder(wrapped_object, vals.cmis_objectid).done($.proxy(self._on_current_doc_reconciled(), self));
                }
                else {
                    ResModel.call('create_in_cmis', [[model_id], self.cmis_backend_id, context]).done(function(vals) {
                         var cmis_objectid = vals[model_id];
                         self._move_object_to_folder(wrapped_object, cmis_objectid).done($.proxy(self._on_current_doc_reconciled(), self));
                    });
                }
            });
    },

    _do_quick_select_create: function(initial_view){
        var self = this;
        new form_common.SelectCreateDialog(this, {
            res_model: self.res_model,
            domain: [],
            title: _t('Selected record'),
            initial_view: initial_view,
            disable_multiple_selection: true,
            context: self.build_context(),
            on_selected: function(element_ids) {
                self._finalize_reconcile(element_ids[0]);
            }
        }).open();
    },
    
    _quick_link: function() {
        this._do_quick_select_create("search");
    },
    _quick_create: function() {
        this._do_quick_select_create("create");
    },
    
    build_context: function() {
        // only use the model's context if there is not context on the node
        var ctx = new data.CompoundContext(this.default_context);
        var context = {};
        _.forEach(this.context.cmis_fields_mapping, function(key, value){
            context['default_'.concat(key)] = this.get_cmis_prop_value(
                    this.get_current_cmis_object().cmis_object.succinctProperties, value);
        }, this);
        ctx.add(context);
        return ctx;
        
    },

    _move_object_to_folder: function(wrapped_object, targetFolderId){
        var self = this;
        var dfd = $.Deferred();
        var current_folder_id =  this.current_folder_object.objectId;
        var object_id = wrapped_object.objectId;
        this.cmis_session.moveObject(object_id, current_folder_id, targetFolderId)
            .ok(function(data) {
                self.do_notify(_t('Move Success'), 'Document successfully reconciled');
                dfd.resolve(data);
            }).notOk(function(error){
                self.on_cmis_error(error);
                dfd.reject(error);
            });
        return dfd.promise();
    },
    
    _on_current_doc_reconciled : function(){
        var object = this._get_remaining_documents_to_reconcile()[this.doc_idx];
        this.documents_reconciled.push(object);
        this.doc_idx = 0;
        this.reconcile_current_doc();
    },
});

core.action_registry.add('cmis_document_reconciliation_view', CmisDocumentReconciliation);

});
