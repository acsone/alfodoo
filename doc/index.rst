.. CMIS Viewer documentation master file.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

#######
Alfodoo
#######

Alfodoo is a set of addons to seamless integrate an external Document
Management System and `Odoo`_.

Alfodoo provides a powerful widget (CMIS Viewer) and a set of addons for
displaying and managing content from a CMIS container linked to an Odoo model.

This Odoo widget has a modular and generic core providing functionality based
on the CMIS V1.1 protocol. This core can be extended by additional modules
in order to propose additional features or customizations proper to a specific
CMIS container. At this stage, the existing customization is for the Alfresco Document
Management System.
 
With these addons, you are now able to enrich the user's experience and
provide in Odoo great features that enable the users to easily store and
manage their documents in an external Document Management System through
a seamless integration. 


The development of Alfodoo has been founded by `ACSONE SA/NV`_ and
is now maintained by `Odoo community Association (OCA)`_, and several
:ref:`contributors`.

*Learn how to* :ref:`contribute`

*************
Core Features
*************

* **100% Open Source** (`AGPL version 3`_): the full `source code is available
  on GitHub`_
* Full responsive HTML Widget that lets you view and managed content from a
  `cmis:folder`.
* ...
* See a :ref:`code-overview` with examples of code

.. _`Odoo`: http://www.odoo.com
.. _`ACSONE SA/NV`: http://www.acsone.eu
.. _`Odoo community Association (OCA)`: https://odoo-community.org/
.. _`source code is available on GitHub`: https://github.com/OCA/connector-cmis
.. _`AGPL version 3`: http://www.gnu.org/licenses/agpl-3.0.html


*************
Prerequisites
*************

Dependencies
************

The Alfodoo framework requires the following:

* The Odoo **cmis** addon: The Odoo  cmis addon provides the bases for Odoo 
  modules implementing different integration scenario with a CMIS server. It allows
  you to configure a CMIS backend in Odoo and provides mixins models to inherit
  to add to Odoo objects the abilities to be linked/stored into a CMIS Backend.
  At the time of writing *Alfodoo* only supports the branch *9.0-cmis-enhanced*
  available into the `fork of ACSONE`_ of the OCA's `connector-cmis`_ repository and
  currently under `review`_. 
* `cmislib`_  the Apache Chemistry CMIS client library for Python: To be compliant
  with the latest version of CMIS (1.1), the connector use the latest version of the
  python cmislib library not yet released at this stage. The lib can be installed with:

    .. code-block:: shell
        
        pip install git+ssh://git@github.com/lmignon/python-cmislib.git@6.0.dev#egg=cmislib


.. _`fork of ACSONE`: https://github.com/acsone/connector-cmis/tree/9.0-cmis-enhanced
.. _`connector-cmis`: https://github.com/OCA/connector-cmis
.. _`review`: https://github.com/OCA/connector-cmis/pull/15
.. _`cmislib`: http://chemistry.apache.org/python/cmislib.html

Enable CORS in Alfresco 5.x
****************************

The CMIS Viewer widget will be loaded from a different web server than the Alfresco
Platform is running on. So we need to tell the Alfresco server that any request that
comes in from this custom web client should be allowed access to the Content Repository.
This is done by enabling CORS.

To enable CORS in the Alfresco Platform do the following:

Modify tomcat/conf/web.xml and add the following sections to allow requests from
http://localhost:8069. 
When specifying the cors.allowOrigin URL make sure to use the URL that will be
used by the web client.

.. code-block:: xml

  <!-- CORS Filter Begin -->
  <filter>
      <filter-name>CORS</filter-name>
      <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
      <init-param>
        <param-name>cors.allowed.origins</param-name>
        <param-value>http://localhost:8069,http://my-odoo-server-name.eu</param-value>
      </init-param>
      <init-param>
        <param-name>cors.allowed.methods</param-name>
        <param-value>GET,POST,HEAD,OPTIONS,PUT,DELETE</param-value>
      </init-param>
      <init-param>
        <param-name>cors.allowed.headers</param-name>
        <param-value>origin, authorization, x-file-size, x-file-name, content-type, accept, x-file-type, DNT, x-customheader ,keep-alive ,user-agent ,x-requested-with ,if-modified-since, cache-control,accept-ranges,content-encoding,content-length</param-value>
      </init-param>
      <init-param>
        <param-name>cors.exposed.headers</param-name>
        <param-value>origin, authorization, x-file-size, x-file-name, content-type, accept, x-file-type, DNT, x-customheader ,keep-alive ,user-agent ,x-requested-with ,if-modified-since, cache-control,accept-ranges,content-encoding,content-length</param-value>
      </init-param>
      <init-param>
        <param-name>cors.support.credentials</param-name>
        <param-value>true</param-value>
      </init-param>
      <init-param>
        <param-name>cors.preflight.maxage</param-name>
        <param-value>3600</param-value>
      </init-param>
   </filter>
   <!-- CORS Filter End -->

   <!-- CORS Filter Mappings Begin -->
   <filter-mapping>
      <filter-name>CORS</filter-name>
      <url-pattern>/api/*</url-pattern>
      <url-pattern>/service/*</url-pattern>
      <url-pattern>/s/*</url-pattern>
      <url-pattern>/cmisbrowser/*</url-pattern>
   </filter-mapping>

********
Overview
********

.. raw:: html

  <div style="margin-top:10px;">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/TK49kl0Viyk" frameborder="0" allowfullscreen></iframe>
  </div>


*******
Project
*******

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

   guides/concepts.rst
   guides/code_overview.rst


******************
Indices and tables
******************

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
