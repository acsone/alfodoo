/*---------------------------------------------------------
 + * Odoo web_cmis_viewer
 + * Author  Laurent Mignon 2016 Acsone SA/NV
 + * License in __openerp__.py at root level of the module
 + *---------------------------------------------------------
 +*/

 odoo.define('cmis_web_proxy_alf.form_widgets', function( require) {
"use strict";

var core = require('web.core');
var form_widgets = require('cmis_web.form_widgets');
var Model = require('web.Model');

var _t = core._t;


form_widgets.CmisObjectWrapper.include({

    init: function(){
        this._super.apply(this, arguments);
        this.alfresco_api_location = null;
        this.token = null;
    },

    get_preview_url : function(){
      var _url =  this._super.apply(this, arguments);
      if (_url) {
          return _url;
      }
      // By default, review are generated in alfresco the first time it's requested by share
      // Before this first access, the renditions on the cmis object is empty.
      // Use the alfresco API to trigger a first rendition of the document.
      var params = {
          'c': 'force',
          'lastModified': 'pdf%' + new Date().getUTCMilliseconds(),
          'token': this.token,
          'objectId': this.objectId,
          'versionSeriesId': this.versionSeriesId
          
      }
      return this.alfresco_api_location + '/content/thumbnails/pdf/' + this.name + '?' + $.param(params);
    },

});

form_widgets.FieldCmisFolder.include({

    wrap_cmis_object: function(cmisObject) {
        var obj = this._super.apply(this, arguments);
        obj.alfresco_api_location = this.alfresco_api_location;
        obj.token = this.gen_cmis_session_token();
        return obj;
    },

    bind_cmis_config: function(backend){
        this._super.apply(this, arguments);
        this.alfresco_api_location = backend.alfresco_api_location;
    },
});

});
