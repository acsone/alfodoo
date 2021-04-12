# -*- coding: utf-8 -*-
# Copyright 2017 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).

{
    'name': 'Cmis Web Bus',
    'description': """
        Instant Messaging Bus to send notification to the CMIS components
        in live""",
    'version': '10.0.1.0.0',
    'license': 'AGPL-3',
    'author': 'ACSONE SA/NV',
    'website': 'https://acsone.eu/',
    'depends': [
        'cmis_web',
        'bus',
    ],
    'data': [
        'views/cmis_web_bus.xml'
    ],
    'demo': [
    ],
}
