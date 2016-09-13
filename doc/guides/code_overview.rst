.. _code-overview:

#############
Code Overview
#############

The main usage of theses addons is to let you extend an existing Odoo model to 
link an instance of this model to a folder in a CMIS container.

As an example, we'll see the steps to extend the Customer Claim object
to store the documents related to a claim into a CMIS container

.. code-block:: python

    from openerp import models
    from openerp.addons.cmis_field import fields

    
    class CrmClaim(models.Model):
        _inherit = 'crm.claim'

        cmis_folder = fields.CmisFolder()


.. code-block:: xml

    <?xml version="1.0" encoding="UTF-8"?>
    <odoo>
        <record id="crm_case_claims_form_view" model="ir.ui.view">
            <field name="name">CRM - Claims Form (cmis_crm_claim)</field>
            <field name="model">crm.claim</field>
            <field name="inherit_id" ref="crm_claim.crm_case_claims_form_view"/>
            <field name="arch" type="xml">
                <notebook position="inside">
                    <page string="Documents" groups="base.group_user">
                        <field name="cmis_folder"/>
                    </page>
                </notebook>
            </field>
        </record>
    </odoo>

The result is a new Document tab displayed on the Claim Odoo model.

Then you are able to see all the documents related to the claim on the claim object itself, and do all your work into odoo (such as documents drag&drop, preview, ...) even if your documents are stored into a cmis container

.. image:: ../_static/img/cmis_crm_claim.png
