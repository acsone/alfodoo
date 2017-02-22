9.0.?.?.? (?)
~~~~~~~~~~~~~

* Fix: A name in CMIS can not ends with a dot. On the CMIS backend the
  'sanitize_cmis_name' method removes this character if it's found at the
  end of the string to sanitize and this case is detected by the method
  'is_valid_cmis_name'.
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
