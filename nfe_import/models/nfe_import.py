
from odoo import models, fields, api
import base64
import xml.etree.ElementTree as ET
import logging
import requests
import tempfile
import os
from cryptography.hazmat.primitives.serialization import pkcs12
from OpenSSL import crypto

_logger = logging.getLogger(__name__)

class NFeImport(models.Model):
    _name = 'nfe.import'
    _description = 'Importação de NF-e'

    name = fields.Char('Nome', required=True)
    xml_file = fields.Binary('Arquivo XML')
    access_key = fields.Char('Chave de Acesso', size=44)
    certificate_file = fields.Binary('Certificado Digital A1')
    certificate_password = fields.Char('Senha do Certificado')
    state = fields.Selection([
        ('draft', 'Rascunho'),
        ('imported', 'Importado'),
        ('failed', 'Falhou')
    ], string='Status', default='draft')
    product_ids = fields.One2many('product.product', 'nfe_import_id', 'Produtos')
    
    def action_import_nfe(self):
        for record in self:
            try:
                # Se tiver XML, importa diretamente
                if record.xml_file:
                    xml_content = base64.b64decode(record.xml_file)
                    self._process_xml_content(record, xml_content)
                # Se tiver chave de acesso e certificado, busca na SEFAZ
                elif record.access_key and record.certificate_file and record.certificate_password:
                    xml_content = self._fetch_nfe_from_sefaz(record)
                    if xml_content:
                        self._process_xml_content(record, xml_content)
                    else:
                        record.state = 'failed'
                        return {'warning': {'title': 'Erro', 'message': 'Não foi possível obter o XML da NF-e na SEFAZ'}}
                else:
                    record.state = 'failed'
                    return {'warning': {'title': 'Erro', 'message': 'É necessário fornecer um arquivo XML ou uma chave de acesso com certificado digital'}}
                
                record.state = 'imported'
                
            except Exception as e:
                _logger.error(f"Erro ao importar NF-e: {str(e)}")
                record.state = 'failed'
                raise e
    
    def _process_xml_content(self, record, xml_content):
        """Processa o conteúdo XML da NF-e"""
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
                        'color': '#FFFFFF',  # Cor padrão quando não especificada
                    }
                    product = self.env['product.product'].create(vals)
    
    def _fetch_nfe_from_sefaz(self, record):
        """Busca a NF-e na SEFAZ usando a chave de acesso e o certificado digital"""
        try:
            # Salvando o certificado em um arquivo temporário
            cert_data = base64.b64decode(record.certificate_file)
            cert_file = tempfile.NamedTemporaryFile(delete=False)
            cert_file.write(cert_data)
            cert_file.close()
            
            # Verificando se o certificado e a senha são válidos
            try:
                with open(cert_file.name, 'rb') as f:
                    p12 = pkcs12.load_key_and_certificates(
                        f.read(), 
                        record.certificate_password.encode(), 
                        None
                    )
            except Exception as e:
                os.unlink(cert_file.name)
                _logger.error(f"Erro ao carregar certificado: {str(e)}")
                return None
            
            # Determinar o endpoint da SEFAZ (varia por estado)
            # Aqui estamos usando o ambiente de homologação para teste
            # Em produção, deve-se usar os endpoints oficiais
            endpoint = self._get_sefaz_endpoint(record.access_key)
            
            # Montando a requisição SOAP para consultar a NF-e
            xml_consulta = self._prepare_consulta_xml(record.access_key)
            
            # Fazendo a requisição usando o certificado
            response = requests.post(
                endpoint,
                data=xml_consulta,
                cert=(cert_file.name, record.certificate_password),
                verify=True,
                headers={'Content-Type': 'application/soap+xml; charset=utf-8'}
            )
            
            # Remover arquivo temporário do certificado
            os.unlink(cert_file.name)
            
            if response.status_code != 200:
                _logger.error(f"Erro na consulta à SEFAZ: {response.status_code} - {response.text}")
                return None
            
            # Processar a resposta da SEFAZ
            # O formato da resposta depende do serviço específico da SEFAZ
            # Aqui estamos assumindo que a resposta contém o XML da NF-e
            xml_nfe = self._extract_nfe_xml_from_response(response.text)
            
            if not xml_nfe:
                _logger.error("Não foi possível extrair o XML da NF-e da resposta")
                return None
            
            return xml_nfe
            
        except Exception as e:
            _logger.error(f"Erro ao buscar NF-e na SEFAZ: {str(e)}")
            return None
    
    def _get_sefaz_endpoint(self, access_key):
        """Retorna o endpoint da SEFAZ com base na UF contida na chave de acesso"""
        # A UF está nos primeiros 2 dígitos da chave de acesso
        uf_codigo = access_key[:2]
        
        # Mapeamento de códigos de UF para endpoints da SEFAZ
        # Em produção, este mapeamento deve ser mais completo e preciso
        endpoints = {
            '35': 'https://nfe.fazenda.sp.gov.br/ws/nfeconsulta2.asmx',  # SP
            '31': 'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',  # MG
            '33': 'https://nfe.sefaz.rj.gov.br/nfe/services/NFeConsultaProtocolo4',  # RJ
            # Adicionar outros estados conforme necessário
        }
        
        # Estados que usam o SVRS (Sistema Virtual Rio Grande do Sul)
        svrs_ufs = ['41', '43', '50', '11', '14', '16', '17', '21', '22', '24', '27', '28', '29', '42', '53']
        
        if uf_codigo in endpoints:
            return endpoints[uf_codigo]
        elif uf_codigo in svrs_ufs:
            return 'https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx'
        else:
            # Padrão para outros estados (usando o ambiente nacional)
            return 'https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx'
    
    def _prepare_consulta_xml(self, access_key):
        """Prepara o XML de consulta para a SEFAZ"""
        # Este é um template básico para consulta de NF-e pela chave de acesso
        # O formato exato pode variar conforme a versão da NF-e e o serviço específico
        
        template = f"""<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfeConsulta2">
      <cUF>35</cUF>
      <versaoDados>4.00</versaoDados>
    </nfeCabecMsg>
  </soap:Header>
  <soap:Body>
    <nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NfeConsulta2">
      <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>1</tpAmb>
        <xServ>CONSULTAR</xServ>
        <chNFe>{access_key}</chNFe>
      </consSitNFe>
    </nfeDadosMsg>
  </soap:Body>
</soap:Envelope>"""
        
        return template
    
    def _extract_nfe_xml_from_response(self, response_text):
        """Extrai o XML da NF-e da resposta da SEFAZ"""
        try:
            # Analisar a resposta SOAP
            root = ET.fromstring(response_text)
            
            # Namespace da resposta pode variar
            namespaces = {
                'soap': 'http://www.w3.org/2003/05/soap-envelope',
                'nfe': 'http://www.portalfiscal.inf.br/nfe'
            }
            
            # Procurar o elemento que contém o XML da NF-e
            # O caminho exato pode variar conforme o serviço
            nfe_xml_element = root.find('.//nfe:retConsSitNFe//nfe:procNFe', namespaces)
            
            if nfe_xml_element is not None:
                # Converter o elemento para string XML
                return ET.tostring(nfe_xml_element, encoding='utf-8')
            
            return None
            
        except Exception as e:
            _logger.error(f"Erro ao extrair XML da NF-e da resposta: {str(e)}")
            return None

class ProductProduct(models.Model):
    _inherit = 'product.product'
    
    nfe_import_id = fields.Many2one('nfe.import', 'Importação NF-e')
    color = fields.Char(
        string='Cor',
        help='Cor do produto em formato hexadecimal (ex: #FFFFFF)',
        default='#FFFFFF',
        size=7  # Tamanho exato para um código HEX (#RRGGBB)
    )
