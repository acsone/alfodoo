10.0.?.?.? (?)
~~~~~~~~~~~~~~

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


10.0.1.0.0 (Jan, 4, 20016)
~~~~~~~~~~~~~~~~~~~~~~~~~~

* First release


..
  Model:
  2.0.1 (date of release)
  ~~~~~~~~~~~~~~~~~~~~~~~

  * change 1
  * change 2
