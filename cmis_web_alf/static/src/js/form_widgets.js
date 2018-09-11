/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web_alf.form_widgets', function( require) {
"use strict";

var core = require('web.core');
var form_widgets = require('cmis_web.form_widgets');
var Model = require('web.Model');

var _t = core._t;


form_widgets.CmisObjectWrapper.include({

    init: function(){
        this._super.apply(this, arguments);
        this.alfresco_api_location = null;
    },

    get_preview_url : function(){
      var _url =  this._super.apply(this, arguments);
      if (_url) {
          return _url;
      }
      // By default, review are generated in alfresco the first time it's requested by share
      // Before this first access, the renditions on the cmis object is empty.
      // Use the alfresco API to trigger a first rendition of the document.
      return this.alfresco_api_location + '/node/workspace/SpacesStore/' + this.versionSeriesId + '/content/thumbnails/pdf/' + encodeURI(this.name) + '?c=force&lastModified=pdf%' + new Date().getUTCMilliseconds();
    },

});

form_widgets.FieldCmisFolder.include({

    wrap_cmis_object: function(cmisObject) {
        var obj = this._super.apply(this, arguments);
        obj.alfresco_api_location = this.alfresco_api_location;
        return obj;
    },

    bind_cmis_config: function(backend){
        this._super.apply(this, arguments);
        this.alfresco_api_location = backend.alfresco_api_location;
    },

    get_datatable_config: function(){
        var config = this._super.apply(this, arguments);
        config.columns[config.columns.length -1].width='105px';
        return config;
    },

    register_content_events: function(){
        var self = this;
        this._super.apply(this, arguments);
        /* bind content events */
        this.$el.find('.content-action-open-alf').on('click', function(e){
            var row = self._get_event_row(e);
            row.data().refresh().done(
                function(data){
                    self.open_in_alf(data.objectId);
                }
            );
        });
    },

    register_root_content_events: function(){
        var self = this;
        this._super.apply(this, arguments);
        this.$el.find('.root-content-action-open-alf').on('click', function(e){
            self.open_in_alf(self.dislayed_folder_cmisobject.objectId);
        });
    },

    open_in_alf: function(objectid){
        new Model("cmis.backend")
        .call("get_content_details_url",  [
             [this.backend.id],
             objectid,
             this.view.dataset.get_context()
         ])
        .then(function (url) {
            window.open(url);
        });
    },
});

});
