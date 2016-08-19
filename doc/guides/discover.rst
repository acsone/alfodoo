
===================
The Alfodoo project
===================
The Alfodoo project has the objective to provide a collection of 'addons' in order to integrate the odoo platform with a Document Management System supporting the CMIS V1.1 protocol.

Currently, the project proposes integration between Odoo and the open-source ECM platform Alfresco.

The aim is to offer to the odoo users a transparent and easy access to the documents stored in the appropriate location in Alfresco. 


.. raw:: html

  <div style="margin-top:10px;">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/TK49kl0Viyk" frameborder="0" allowfullscreen></iframe>
  </div>
  

============================
Manage the documents in Odoo
============================

Visually the main part of the functionality is accessed through a "Document tab" configurable on each Odoo model providing a "real-time" view on the Alfresco content.

From the user point of view, the Document tab gives a direct access to the items (documents lists, sub-folders, …) linked to the Odoo object and contained in the linked Alfresco folder.

The first action is to let the user creates manually  (means "only when needed") the linked folder in Alfresco

Insert Image

Then the Document tab shows a global menu providing the following functionality:

Insert Image


* **Refresh content table**: This option refreshes the folder content
* **Create folder**:  A (sub-)folder is created in the current folder. The user gives a name for the folder and selects "Create"
* **Create document**:         Upload a document in the current folder. The user selects a file and click on "Create" to upload the document
* **Show in Alfresco**:        This option opens Alfresco Share and shows the folder details page

In the content table, the User can see the documents and folders list.

The following information is displayed for each item:

* An icon used to hide or unhide the item details (folder or document Alfresco metadata: cm:folder, cm:content, cm:title)
* The item name
* The item description
* Last Modified date
* A contextual menu: the options list for the a folder item or for a document item 

For a "Document" item, the following options are available:

* **Download**:	Download the document
* **Preview**	Preview the document
* **More actions**:
	* **View details**: this option shows some documents metadata (Alfresco cm:content). 
	* **Update**: with this option the user can upload a new document in the folder. In case the document is associated with the Alfresco versionnable aspect Alfresco, the document version number (major) is automatically incremented.
	* **Delete**: delete the document
* **Show in Alfresco**: This option opens Alfresco share and shows the document details page.

