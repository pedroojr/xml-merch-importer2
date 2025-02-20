
{
    'name': 'Importador NF-e',  # Nome mais amigável em português
    'version': '16.0.1.0.0',    # Versão específica do Odoo
    'category': 'Inventory/Inventory',
    'summary': 'Importação de NF-e com cadastro automático de produtos',
    'sequence': 1,
    'description': """
        Módulo para importação de NF-e no Odoo
        * Importação de XML da NF-e
        * Cadastro automático de produtos
        * Atualização de estoque
        * Controle de cores dos produtos
    """,
    'author': 'Seu Nome',
    'website': 'https://seusite.com.br',
    'license': 'LGPL-3',
    'depends': [
        'base',
        'product',
        'stock',
        'account'
    ],
    'data': [
        'security/ir.model.access.csv',
        'views/nfe_import_views.xml',
    ],
    'images': ['static/description/icon.png'],
    'demo': [],
    'installable': True,
    'application': True,
    'auto_install': False,
}
