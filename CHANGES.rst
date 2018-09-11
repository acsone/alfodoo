10.0.4.0.0 (Sep, 11, 2018)
~~~~~~~~~~~~~~~~~~~~~~~~~~

* Fix: cmis_web: clear rows before reloading the table to avoid error if an
  expanded row is no more into the reloaded info.
* Fix: prevent error on first preview if the document name contains invalid
  characters.
* Fix: refresh the table when the data on the current view are refreshed.
* Improvement: cmis_proxy : Improve modularity of _check_access_operation.
  It's now possible to define a method '_check_cmis_access_operation' on the
  model to adapt the _check_access_operation behaviour.
* Improvement: New dialog to resolve conflict when we try to create a new
  document with the same name as an existing one.
* Improvement: New dialog to rename cmis content.
* Ensure compatibility with the next version of cmislib (py3 compat)
  available into github `<https://github.com/apache/chemistry-cmislib/tree/
  py3_compat>`_ or svn `<https://svn.apache.org/repos/asf/chemistry/cmislib/
  branches/py3_compat/>`_
* Fix: cmis_field: Add support for cmis_folder defined as related

10.0.3.0.1 (Jan, 30, 2018)
~~~~~~~~~~~~~~~~~~~~~~~~~~

* Fix: copy=False is now the default on CmisFolder fields.

10.0.3.0.0 (Dec, 21, 2017)
~~~~~~~~~~~~~~~~~~~~~~~~~~

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


10.0.2.0.0 (Oct, 17, 2017)
~~~~~~~~~~~~~~~~~~~~~~~~~~

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


10.0.1.0.0 (Jan, 4, 2016)
~~~~~~~~~~~~~~~~~~~~~~~~~

* First release


..
  Model:
  2.0.1 (date of release)
  ~~~~~~~~~~~~~~~~~~~~~~~

  * change 1
  * change 2
