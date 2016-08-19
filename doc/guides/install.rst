*******
Install
*******

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

* If you plan to use the viewer extension for Alfresco **'web_cmis_viewer_alf'**
  you also need the **cmis_alf** addon. As for the **cmis** addon, this one is
  available into a `dedicated branch of the fork of ACSONE`_ of the OCA's 
  `connector-cmis`_ repository

.. _`dedicated branch of the fork of ACSONE`: https://github.com/acsone/connector-cmis/tree/9.0-cmis-alf
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