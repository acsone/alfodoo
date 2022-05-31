
<!-- /!\ Non OCA Context : Set here the badge of your runbot / runboat instance. -->
[![Pre-commit Status](https://github.com/acsone/alfodoo/actions/workflows/pre-commit.yml/badge.svg?branch=14.0)](https://github.com/acsone/alfodoo/actions/workflows/pre-commit.yml?query=branch%3A14.0)
[![Build Status](https://github.com/acsone/alfodoo/actions/workflows/test.yml/badge.svg?branch=14.0)](https://github.com/acsone/alfodoo/actions/workflows/test.yml?query=branch%3A14.0)
[![codecov](https://codecov.io/gh/acsone/alfodoo/branch/14.0/graph/badge.svg)](https://codecov.io/gh/acsone/alfodoo)
<!-- /!\ Non OCA Context : Set here the badge of your translation instance. -->

<!-- /!\ do not modify above this line -->

# Alfodoo

Alfodoo is a set of addons to seamlessly integrate an external Document
Management System with Odoo.

Alfresco Enterprise Content Management System (from version 4.2) is supported.

The code is structured in two parts:

- pure CMIS 1.1 compliant modules (cmis_field, cmis_web)
- Alfresco specific extension modules (cmis_alf, cmis_web_alf).

It is therefore possible in principle to easily integrate Other CMIS compliants
content management systems such as Nuxeo, Documentum, etc. This has not been tested yet.

Documentation and installation instructions can be found at https://alfodoo.org.

<!-- /!\ do not modify below this line -->

<!-- prettier-ignore-start -->

[//]: # (addons)

This part will be replaced when running the oca-gen-addons-table script from OCA/maintainer-tools.

[//]: # (end addons)

<!-- prettier-ignore-end -->

## Licenses

This repository is licensed under [AGPL-3.0](LICENSE).

However, each module can have a totally different license, as long as they adhere to ACSONE
policy. Consult each module's `__manifest__.py` file, which contains a `license` key
that explains its license.

----
<!-- /!\ Non OCA Context : Set here the full description of your organization. -->
