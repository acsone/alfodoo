/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('web_cmis_viewer_alf.cmis_viewer_widgets_alf', function( require) {
"use strict";

var core = require('web.core');
var cmis_widgets = require('web_cmis_viewer.cmis_viewer_widgets');
var Model = require('web.Model');

var _t = core._t;


cmis_widgets.CmisObjectWrapper.include({

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
      return this.alfresco_api_location + '/node/workspace/SpacesStore/' + this.versionSeriesId + '/content/thumbnails/pdf/' + this.name + '?c=force&lastModified=pdf%' + new Date().getUTCMilliseconds();
    },

});

cmis_widgets.CmisViewer.include({

    init: function (){
        this._super.apply(this, arguments);
        this.cmis_backend_fields.push('alfresco_api_location');
    },
    
    wrap_cmis_object: function(cmisObject) {
        var obj = this._super.apply(this, arguments);
        obj.alfresco_api_location = this.alfresco_api_location;
        return obj;
    },

   on_cmis_config_loaded: function(result) {
         if (result.length != 1){
             this.do_warn(_t("CMIS Config Error"), _t("One and only one CMIS backend must be configurerd"));
             return;
         }
         this.alfresco_api_location = result[0].alfresco_api_location;
         this._super.apply(this, arguments);
   },

    get_datatable_config: function(){
        var config = this._super.apply(this, arguments);
        config.columns[4].width='105px';
        return config;
    },

    register_content_events: function(){
        var self = this;
        this._super.apply(this, arguments);
        /* bind content events */
        this.$el.find('.content-action-open-alf').on('click', function(e){
            var row = self._get_event_row(e);
            self.open_in_alf(row.data().objectId);
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
             [this.cmis_backend_id],
             objectid,
             this.view.dataset.get_context()
         ])
        .then(function (url) {
            window.open(url);
        });
    },
});

});
