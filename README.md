[![Build Status](https://travis-ci.org/acsone/alfodoo.svg?branch=13.0)](https://travis-ci.org/acsone/alfodoo)
[![codecov](https://codecov.io/gh/acsone/alfodoo/branch/13.0/graph/badge.svg)](https://codecov.io/gh/acsone/alfodoo)
# Alfodoo Modules

Alfodoo is a set of addons to seamlessly integrate an external Document
Management System with Odoo.

Alfresco Enterprise Content Management System (from version 4.2) is supported.

The code is structured in two parts:
- pure CMIS 1.1 compliant modules (cmis_field, cmis_web)
- Alfresco specific extension modules (cmis_alf, cmis_web_alf). 

It is therefore possible in principle to easily integrate Other CMIS compliants
content management systems such as Nuxeo, Documentum, etc. This has not been tested yet.

Documentation and installation instructions can be found at http://www.alfodoo.org.

[//]: # (addons)

Available addons
----------------
addon | version | summary
--- | --- | ---
[cmis_alf](cmis_alf/) | 14.0.1.0.0 | Alfresco extension for the CMIS Connector
[cmis_field](cmis_field/) | 14.0.1.0.0 | Specialized field to work with a CMIS server
[cmis_report_write](cmis_report_write/) | 14.0.1.0.0 | Cmis Report Write
[cmis_web](cmis_web/) | 14.0.1.0.0 | CMIS Web browser widget
[cmis_web_alf](cmis_web_alf/) | 14.0.1.0.0 | Extensions to the Alfodoo web widgets for Alfresco
[cmis_web_bus](cmis_web_bus/) | 14.0.1.0.0 | Cmis Web Bus
[cmis_web_proxy](cmis_web_proxy/) | 14.0.1.0.0 | Odoo as proxy server for your cmis requests.
[cmis_web_proxy_alf](cmis_web_proxy_alf/) | 14.0.1.0.0 | Alfodoo CMIS Web Proxy for Alfresco
[cmis_web_report_write](cmis_web_report_write/) | 14.0.1.0.0 | Cmis Web Report Write
[cmis_web_report_write_alf](cmis_web_report_write_alf/) | 14.0.1.0.0 | Cmis Web Report Write Alf

[//]: # (end addons)
