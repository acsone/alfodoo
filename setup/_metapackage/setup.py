import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo10-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo10-addon-cmis_alf',
        'odoo10-addon-cmis_field',
        'odoo10-addon-cmis_web',
        'odoo10-addon-cmis_web_alf',
        'odoo10-addon-cmis_web_proxy',
        'odoo10-addon-cmis_web_proxy_alf',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
        'Framework :: Odoo :: 10.0',
    ]
)
