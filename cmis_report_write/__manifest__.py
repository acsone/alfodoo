# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Cmis Report Write',
    'description': """
        Save your report into a CMIS container""",
    'version': '10.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV',
    'website': 'https://acsone.eu/',
    'depends': [
        'cmis_field',
        'report'
    ],
    'data': [
        'views/ir_actions_report_xml.xml',
    ],
    'demo': [
        'demo/cmis_test_model_qweb.xml',
    ],
    'installable': True,
}
