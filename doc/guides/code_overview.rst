.. _code-overview:

#############
Code Overview
#############

The main usage of theses addons is to lets you extend an existing Odoo model to 
link instances of this model to a folder in a cmis container.

As an example, we'll see the steps to extend the Curstomer Claim object
to store the documents related to a claim into a CMIS container

.. code-block:: python

    from openerp import models
    
    
    class CrmClaim(models.Model):
        _name = 'crm.claim'
        _inherit = ['crm.claim', 'cmis.folder']

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
                        <field name="cmis_objectid" readonly="1" widget="cmis_viewer"/>
                        <field name="cmis_backend_id" readonly="1" invisible="1"/>
                    </page>
                </notebook>
            </field>
        </record>
    </odoo>

And you are now able to see all the documents related to the claim on the claim itself, and do all your work into odoo even if your documents are stored into a cmis container

.. image:: ../_static/img/cmis_crm_claim.png
