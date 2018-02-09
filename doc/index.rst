.. CMIS Viewer documentation master file.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. important:: **Alfofoo for Odoo 11**

  A crowdfunding campaign is currently running to finance the migration of Alfodoo to make it compatible with Odoo 11. **Be part of this project now!** `More info here`_ https://www.indiegogo.com/projects/alfodoo-for-odoo-11-software#/

.. _`More info here`: https://www.indiegogo.com/projects/alfodoo-for-odoo-11-software#/

#######
Alfodoo
#######

Alfodoo is a set of `addons`_ to seamlessly integrate an external Document
Management System with `Odoo`_.

Alfodoo provides a new kind of field *CmisFolder* and its powerful widget *FieldCmisFolder*.
Alfodoo is a set of addons to display and manage content from a CMIS container linked to an Odoo model.

The Odoo widget has a modular and generic core providing functionality based
on the CMIS V1.1 protocol. This core can be extended by additional modules
in order to propose additional features or customizations proper to a specific
CMIS container. At this stage, the existing customization is for the Alfresco Document
Management System.
 
With these addons, you are now able to enrich the user's experience and
provide in Odoo great features that enable the users to easily store and
manage their documents in an external Document Management System through
a seamless integration. 

.. raw:: html

  <div style="margin-top:10px;">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/TK49kl0Viyk" frameborder="0" allowfullscreen></iframe>
  </div>

*************
Key Features
*************

* Easy to create Alfresco space folders for any Odoo business object
* Drag&Drop of content (office document, image, mail, ….) in Alfresco from Odoo. Your content is immediately filed in the right location
* Update your document (versioning) without leaving  Odoo
* Easy content preview and browsing (PDF, Image, Media preview)
* Easy connector configuration – Everything can be done directly from the Odoo interface

In addition to these features, extensions can be implemented to add more advanced functionality such as:

* **Space template**:  possibility to create a dedicated structured space template linked to a type of Odoo object (project, …).
* **Reporting**:  from an Odoo object, possibility to generate any kind of reports in most common formats (PDF, MS office, ..). The generated document is automatically classified in the appropriate folder and enriched with appropriate metadata
* **Proxy mode**:  with this mode, instead of using the actual user credentials for submitting Odoo widget requests (CMIS) to Alfresco, a proxy user is used.

Alfodoo is **100% Open Source** (`AGPL version 3`_): the full `source code is available on GitHub`_
  
Full responsive HTML Widget that enables you to view and manage content from a
  `cmis:folder`.
  
See a :ref:`code-overview` with examples of code

.. _`Odoo`: http://www.odoo.com
.. _`ACSONE SA/NV`: http://www.acsone.eu
.. _`Odoo community Association (OCA)`: https://odoo-community.org/
.. _`source code is available on GitHub`: https://github.com/acsone/alfodoo
.. _`addons`: https://github.com/acsone/alfodoo
.. _`AGPL version 3`: http://www.gnu.org/licenses/agpl-3.0.html

***************************
Support Alfodoo development
***************************

Alfodoo is open source, there are many ways to :ref:`contribute` in different areas
(eg testing, documentation, reporting issues, fixing bugs).

The development of Alfodoo has been funded by `ACSONE SA/NV`_.

.. image:: https://www.acsone.eu/logo.png
   :alt: ACSONE SA/NV
   :target: https://www.acsone.eu

You can also donate to support the continued development of Alfodoo. Collected funds
will be dedicated to the improvement of Alfodoo (support of new Odoo and Alfresco versions
development of new features).

.. raw:: html

  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
  <input type="hidden" name="cmd" value="_s-xclick">
  <input type="hidden" name="hosted_button_id" value="XP2F8CTB34STJ">
  <input type="image" src="https://www.paypalobjects.com/en_US/BE/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
  <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
  </form>

**************************************
Overview: Manage the documents in Odoo
**************************************

The main part of the functionality is accessed through a "Documents" tab configurable on each Odoo model providing a "real-time" view on the Alfresco content.

The "Documents" tab gives direct access to the items (documents list, sub-folders, …) linked to the Odoo object. The items are stored in the related Alfresco folder.

First the user triggers the creation (button "Create folder in DMS") of the related Alfresco folder.

.. image:: ./_static/img/cmis_crm_claim_empty.png

Then the following functionality becomes available:

.. raw:: html

  <table class="table">
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-refresh" aria-hidden="true"></span></td><td><strong>Refresh content table:</strong> This option refreshes the folder content</td>
    </tr>
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-folder-close" aria-hidden="true"></span></td><td><strong>Create folder:</strong> A (sub-)folder is created in the current folder. The user gives a name for the folder and selects "Create"</td>
    </tr>
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-file" aria-hidden="true"></span></td><td><strong>Create document:</strong> Upload a document in the current folder. The user selects a file and clicks on "Create" to upload the document</td>
    </tr>
    <tr>
        <td> <div class="btn-odoo alf-ico"  aria-hidden="true"></div></span></td><td><strong>Show in Alfresco:</strong> This option opens Alfresco Share and shows the folder details page</td>
    </tr>
  </table>

In the content table, the user can see the documents and folders list.

.. image:: ./_static/img/cmis_crm_claim_new_folder.png

The following information is displayed for each item:

* The item name
* The item description
* Last Modification date
* An icon used to hide or unhide the item details (folder or document Alfresco metadata: cm:folder, cm:content, cm:title)
* A contextual menu: the options list for a folder item or for a document item 

.. image:: ./_static/img/cmis_crm_claim_doc_details.png

For a "Document" item, the following options are available:

.. raw:: html

  <table class="table">
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-download-alt" aria-hidden="true"></span></td>
        <td colspan="2"><strong>Download:</strong> Download the document</td>
    </tr>
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-eye-open" aria-hidden="true"></span></td>
        <td colspan="2"><strong>Preview:</strong> Preview the document</td>
    </tr>
    <tr>
        <td> <span class="btn-odoo glyphicon glyphicon-align-justify" aria-hidden="true"></span></td>
        <td colspan="2"><strong>More actions:</strong></td>
    </tr>
    <tr>
        <td colspan="2">
        <td style="padding-left:5em"><strong>View details:</strong> this option shows some documents metadata (Alfresco cm:content).</td>
   </tr>
   <tr>
        <td colspan="2">
        <td style="padding-left:5em"><strong>Update:</strong> with this option the user can upload a new document in the folder. In case the document is associated with the Alfresco versionnable aspect Alfresco, the document version number (major) is automatically incremented.</td>
   </tr>
   <tr>
        <td colspan="2">
        <td style="padding-left:5em"><strong>Delete:</strong> delete the document.</td>
   </tr>
    <tr>
        <td> <div class="btn-odoo alf-ico"  aria-hidden="true"></div></span></td>
        <td colspan="2"><strong>Show in Alfresco:</strong> This option opens Alfresco share and shows the document details page.</td>
    </tr>
  </table>

*******
Project
*******

The Alfodoo project has the objective to provide a collection of 'addons' in order to integrate the odoo platform with a Document Management System supporting the CMIS V1.1 protocol.

Currently, the project proposes an integration between Odoo and the open-source ECM platform Alfresco.

The aim is to offer Odoo users a transparent and easy access to the documents stored in the appropriate location in Alfresco.


.. toctree::
   :maxdepth: 1

   project/contribute
   project/contributors
   project/license
   project/changes
   project/roadmap


*****************
Developer's guide
*****************

.. toctree::
   :maxdepth: 2

   guides/short_guide.rst


API Reference
=============

.. toctree::
   :maxdepth: 1

   api/api_cmis_field.rst


******************
Indices and tables
******************

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
