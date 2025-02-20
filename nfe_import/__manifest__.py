
{
    'name': 'NFe Import 2',
    'version': '1.0',
    'category': 'Inventory',
    'summary': 'Importação de NF-e com cadastro automático de produtos',
    'sequence': 1,
    'author': 'Seu Nome',
    'website': 'https://seusite.com.br',
    'license': 'LGPL-3',
    'depends': ['base', 'product'],
    'data': [
        'security/ir.model.access.csv',
        'views/nfe_import_views.xml',
    ],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
