9.?.?.?.? (?)
~~~~~~~~~~~~~

* Fix: copy=False is now the default on CmisFolder fields.
* Improvement: Implement Checkin Checkout.
* Improvement: New addons cmis_web_proxy and cmis_web_proxy_alf.  With these
  addons, instead of using the actual user credentials for submitting
  Odoo widget requests (CMIS) to Alfresco, a proxy user is used.
* Improvement: Handle name conflict on folder create.
  A new parameter on the backend let's you choice between 2 strategies:
  'error' or 'increment. If a folder already exists with the same name, the
  system will raise an error if 'error' is specified as strategy (default)
  otherwise a suffix is added to the name to make it unique.
* Fix: Into the JS Widget, The width of the dropdown menu for actions on nodes
  properly fit the length of the action labels.
* Fix: Into the JS Widget, declare the charset used when information
  are posted to CMIS.
* Fix: Refresh the document before downloading or opening it into alfresco
  to always get the latest version. (issue #83)
* Fix: Display only the buttons in the main toolbar for which the user has the
  appropriate permissions.
* Fix: JS error when multiple documents are uploaded at once.


9.0.2.0.0 (Oct, 17, 2017)
~~~~~~~~~~~~~~~~~~~~~~~~~

* Improvement: Allow the preview of image files.
* Fix: Display the node title if set into the CMIS container.
* Fix: On the import document dialog, rename 'Create' button into 'Add'
* Fix: For items displayed into the datatable, adjust the dropdown menu
  position based on page width.
* Fix: A name in CMIS can not ends with a dot. On the CMIS backend the
  'sanitize_cmis_name' method removes this character if it's found at the
  end of the string to sanitize and this case is detected by the method
  'is_valid_cmis_name'.
* Fix: Redraw the datatable widget on tab activate
* Fix: JS error into Firefox on create/update document
* Fix: The document preview works also with IE.
* Fix: Makes the file required into the update document dialog.
* Fix: Improves the layout of the data grid widget with internet explorer.
* Fix: Makes the delete confirmation message translatable.
* Improvement: Add new method on the cmis_folder field to get a proxy object
  that let's you perform CMIS actions on the forlder into the CMIS container.
* Improvement: Display the CMIS widget in edit mode. In some cases it's useful
  to have access to the preview of one document when filling the html form to
  copy/paste information from document into the form.
* Improvement: The name used to create the folder in CMIS is automatically sanitized.
  This feature can be deactivated by a flag on the backend configuration and it's also
  possible to specify the character to use as replacement to invalid characters.
* Fix JS error when trying to order by *last modification date.*


9.0.1.0.0 (Oct. 25, 2016)
~~~~~~~~~~~~~~~~~~~~~~~~~

* First release


..
  Model:
  2.0.1 (date of release)
  ~~~~~~~~~~~~~~~~~~~~~~~

  * change 1
  * change 2
