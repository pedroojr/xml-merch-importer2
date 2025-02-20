
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
    
    def action_import_nfe(self):
        for record in self:
            try:
                xml_content = base64.b64decode(record.xml_file)
                root = ET.fromstring(xml_content)
                ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
                
                for det in root.findall('.//nfe:det', ns):
                    prod = det.find('.//nfe:prod', ns)
                    if prod is not None:
                        # Busca produto existente pelo código EAN
                        ean = prod.find('nfe:cEAN', ns).text
                        product = self.env['product.product'].search([('barcode', '=', ean)], limit=1)
                        
                        if not product:
                            # Cria novo produto
                            vals = {
                                'name': prod.find('nfe:xProd', ns).text,
                                'default_code': prod.find('nfe:cProd', ns).text,
                                'barcode': ean,
                                'type': 'product',
                                'nfe_import_id': record.id,
                            }
                            product = self.env['product.product'].create(vals)
                
                record.state = 'imported'
                
            except Exception as e:
                record.state = 'failed'
                raise e

class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    nfe_import_id = fields.Many2one('nfe.import', 'Importação NF-e')
