import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo13-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo13-addon-cmis_alf',
        'odoo13-addon-cmis_field',
        'odoo13-addon-cmis_report_write',
        'odoo13-addon-cmis_web',
        'odoo13-addon-cmis_web_alf',
        'odoo13-addon-cmis_web_bus',
        'odoo13-addon-cmis_web_proxy',
        'odoo13-addon-cmis_web_proxy_alf',
        'odoo13-addon-cmis_web_report_write',
        'odoo13-addon-cmis_web_report_write_alf',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
    ]
)
