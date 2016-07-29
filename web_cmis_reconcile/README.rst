.. image:: https://img.shields.io/badge/licence-AGPL--3-blue.svg
    :target: http://www.gnu.org/licenses/agpl-3.0-standalone.html
    :alt: License: AGPL-3

========================
CMIS documents reconcile
========================

This let's you link document from a folder into a CMIS container to an object
in Odoo. This process is driven by a wizard that scan the content of a specific
folder. For each document found in a format supported by the previewer, you
can link to an existing object in Odoo or create a new instance of a specific
model. As result, the document will be moved from the scanned folder to
the folder related to the Odoo object into CMIS.

This module is a techincal module providing a new wizard. To use this new
wizard you must register your own client action as follow

.. code-block:: xml

        <record id="action_my_model_reconcile" model="ir.actions.client">
            <field name="name">Import documents related to my model</field>
            <field name="res_model">my.model</field>
            <field name="tag">cmis_document_reconciliation_view</field>
            <field name="context">{"cmis_directory":'/test',
                                   "cmis_fields_mapping": {
                                        'cmis:creationDate': 'in_date',
                                        'cmis:name': 'name',
                                    },
                                    "context": {
                                    },
                                   }</field>
        </record>


and create a menu entry for your new action

.. code-block:: xml

      <menuitem id="menu_cmis_reconcile_my_model"
            name="Import CMIS My Model documents"
            parent=""
            action="action_my_model_reconcile" sequence="20"/>


Installation
============

To install this module, you need to:

 * do this ...

Configuration
=============

To configure this module, you need to:

 * go to ...

Usage
=====

To use this module, you need to:

 * go to ...

Credits
=======

Contributors
------------

* Laurent Mignon <laurent.mignon@acsone.eu>

Maintainer
----------

.. image:: https://www.acsone.eu/logo.png
   :alt: ACSONE SA/NV
   :target: http://www.acsone.eu

This module is maintained by ACSONE SA/NV.
