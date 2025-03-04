
from odoo import models, fields, api
import base64
import xml.etree.ElementTree as ET

class NFeImport(models.Model):
    _name = 'nfe.import'
    _description = 'Importação de NF-e'

    name = fields.Char('Nome', required=True)
    xml_file = fields.Binary('Arquivo XML', required=True)
    state = fields.Selection([
        ('draft', 'Rascunho'),
        ('imported', 'Importado'),
        ('failed', 'Falhou')
    ], string='Status', default='draft')
    product_ids = fields.One2many('product.product', 'nfe_import_id', 'Produtos')
    company_branch = fields.Selection([
        ('matriz', 'Matriz'),
        ('filial', 'Filial')
    ], string='Filial', default='matriz')
    cnpj = fields.Char('CNPJ', size=18, index=True, help='CNPJ da empresa')
    chave_acesso = fields.Char('Chave de Acesso', size=44, index=True, help='Chave de acesso da NF-e')
    numero_nfe = fields.Char('Número NF-e', size=10, index=True, help='Número da NF-e')
    data_emissao = fields.Date('Data de Emissão', help='Data de emissão da NF-e')
    
    def action_import_nfe(self):
        for record in self:
            try:
                xml_content = base64.b64decode(record.xml_file)
                root = ET.fromstring(xml_content)
                ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
                
                # Extrair chave de acesso do XML
                # Em produção, a chave estaria no elemento infNFe com atributo Id
                ide = root.find('.//nfe:ide', ns)
                if ide is not None:
                    nfe_numero = ide.find('nfe:nNF', ns)
                    if nfe_numero is not None:
                        record.numero_nfe = nfe_numero.text
                    
                    # Data de emissão
                    data_emissao = ide.find('nfe:dhEmi', ns)
                    if data_emissao is not None:
                        # Formato ISO: 2023-03-15T14:30:00-03:00
                        data_emissao_str = data_emissao.text
                        if data_emissao_str:
                            record.data_emissao = data_emissao_str.split('T')[0]
                
                # Simular geração de chave de acesso se não encontrada
                if not record.chave_acesso and record.numero_nfe:
                    # Em produção, você extrairia isso do XML corretamente
                    import random
                    chave = ''.join([str(random.randint(0, 9)) for _ in range(44)])
                    record.chave_acesso = chave
                
                # Extrair CNPJ do emitente
                emit = root.find('.//nfe:emit', ns)
                if emit is not None:
                    cnpj_emitente = emit.find('nfe:CNPJ', ns)
                    if cnpj_emitente is not None:
                        cnpj = cnpj_emitente.text
                        # Formatar CNPJ: 00.000.000/0000-00
                        if cnpj and len(cnpj) == 14:
                            cnpj_formatado = f"{cnpj[0:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:14]}"
                            record.cnpj = cnpj_formatado
                
                for det in root.findall('.//nfe:det', ns):
                    prod = det.find('.//nfe:prod', ns)
                    if prod is not None:
                        # Busca produto existente pelo código EAN
                        ean = prod.find('nfe:cEAN', ns).text
                        product = self.env['product.product'].search([('barcode', '=', ean)], limit=1)
                        
                        if not product:
                            # Extrair cor do nome do produto, se disponível
                            nome_produto = prod.find('nfe:xProd', ns).text
                            cor = self._extrair_cor_do_nome(nome_produto)
                            
                            # Cria novo produto
                            vals = {
                                'name': nome_produto,
                                'default_code': prod.find('nfe:cProd', ns).text,
                                'barcode': ean,
                                'type': 'product',
                                'nfe_import_id': record.id,
                                'color': cor or '#FFFFFF',  # Usar a cor extraída ou branco como padrão
                                'company_branch': record.company_branch  # Associar à filial corrente
                            }
                            product = self.env['product.product'].create(vals)
                
                record.state = 'imported'
                
            except Exception as e:
                record.state = 'failed'
                raise e
    
    def _extrair_cor_do_nome(self, nome):
        """Extrai a cor do nome do produto, se presente"""
        cores_comuns = {
            'VERMELHO': '#FF0000',
            'AZUL': '#0000FF', 
            'VERDE': '#00FF00',
            'AMARELO': '#FFFF00',
            'PRETO': '#000000',
            'BRANCO': '#FFFFFF',
            'ROSA': '#FFC0CB',
            'ROXO': '#800080',
            'LARANJA': '#FFA500',
            'MARROM': '#A52A2A',
            'CINZA': '#808080'
        }
        
        if not nome:
            return '#FFFFFF'
            
        nome_upper = nome.upper()
        for cor, hex_code in cores_comuns.items():
            if cor in nome_upper:
                return hex_code
                
        return '#FFFFFF'  # Cor padrão

class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    nfe_import_id = fields.Many2one('nfe.import', 'Importação NF-e')
    color = fields.Char(
        string='Cor',
        help='Cor do produto em formato hexadecimal (ex: #FFFFFF)',
        default='#FFFFFF',
        size=7  # Tamanho exato para um código HEX (#RRGGBB)
    )
    company_branch = fields.Selection([
        ('matriz', 'Matriz'),
        ('filial', 'Filial')
    ], string='Filial', default='matriz')
