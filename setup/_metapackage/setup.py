import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo12-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo12-addon-cmis_alf',
        'odoo12-addon-cmis_field',
        'odoo12-addon-cmis_web',
        'odoo12-addon-cmis_web_alf',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
        'Framework :: Odoo :: 12.0',
    ]
)
