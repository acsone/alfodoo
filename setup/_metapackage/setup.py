import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo-addon-cmis_alf>=16.0dev,<16.1dev',
        'odoo-addon-cmis_field>=16.0dev,<16.1dev',
        'odoo-addon-cmis_report_write>=16.0dev,<16.1dev',
        'odoo-addon-cmis_web>=16.0dev,<16.1dev',
        'odoo-addon-cmis_web_alf>=16.0dev,<16.1dev',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
        'Framework :: Odoo :: 16.0',
    ]
)
