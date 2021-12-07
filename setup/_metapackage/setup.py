import setuptools

with open('VERSION.txt', 'r') as f:
    version = f.read().strip()

setuptools.setup(
    name="odoo11-addons-acsone-alfodoo",
    description="Meta package for acsone-alfodoo Odoo addons",
    version=version,
    install_requires=[
        'odoo11-addon-cmis_alf',
        'odoo11-addon-cmis_field',
        'odoo11-addon-cmis_web',
        'odoo11-addon-cmis_web_alf',
    ],
    classifiers=[
        'Programming Language :: Python',
        'Framework :: Odoo',
        'Framework :: Odoo :: 11.0',
    ]
)
