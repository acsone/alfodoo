import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo14-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo14-addon-cmis_alf',
        'odoo14-addon-cmis_field',
        'odoo14-addon-cmis_report_write',
        'odoo14-addon-cmis_web',
        'odoo14-addon-cmis_web_alf',
        'odoo14-addon-cmis_web_bus',
        'odoo14-addon-cmis_web_proxy',
        'odoo14-addon-cmis_web_proxy_alf',
        'odoo14-addon-cmis_web_report_write',
        'odoo14-addon-cmis_web_report_write_alf',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
        'Framework :: Odoo :: 14.0',
    ]
)
