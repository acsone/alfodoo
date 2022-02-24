odoo.define('cmis_web.field_utils', function (require) {
  "use strict";
  const field_utils = require('web.field_utils')
  const FieldCmisDocument = require('cmis_web.form_widgets').FieldCmisDocument

  function format(value, field, options) {
    value = typeof value === 'string' ? value : '';
    if (options && options.escape) {
      value = _.escape(value);
    }
    return value;
  }

  field_utils.format.cmis_document = format;
});