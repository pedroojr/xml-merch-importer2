
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
    xml_filename = fields.Char('Nome do arquivo XML', size=64)
    access_key = fields.Char('Chave de Acesso', size=44)
    certificate_file = fields.Binary('Certificado Digital A1')
    certificate_filename = fields.Char('Nome do certificado', size=64)
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
                return {'warning': {'title': 'Erro', 'message': str(e)}}
    
    def _process_xml_content(self, record, xml_content):
        """Processa o conteúdo XML da NF-e"""
        root = ET.fromstring(xml_content)
        ns = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        
        # Extrair dados da nota
        try:
            # Extrair informações do emitente
            emit = root.find('.//nfe:emit', ns)
            if emit is not None:
                emit_name = emit.find('nfe:xNome', ns)
                if emit_name is not None and emit_name.text:
                    record.name = f"NF-e {record.access_key[-8:]} - {emit_name.text}"
        except Exception as e:
            _logger.warning(f"Erro ao extrair informações do emitente: {str(e)}")
        
        for det in root.findall('.//nfe:det', ns):
            prod = det.find('.//nfe:prod', ns)
            if prod is not None:
                # Busca produto existente pelo código EAN
                ean = prod.find('nfe:cEAN', ns)
                ean_text = ean.text if ean is not None else None
                
                # Se não tiver EAN, usa o código do produto
                if not ean_text or ean_text == 'SEM GTIN':
                    product = None
                else:
                    product = self.env['product.product'].search([('barcode', '=', ean_text)], limit=1)
                
                if not product:
                    # Cria novo produto
                    name_element = prod.find('nfe:xProd', ns)
                    code_element = prod.find('nfe:cProd', ns)
                    
                    vals = {
                        'name': name_element.text if name_element is not None else 'Produto sem nome',
                        'default_code': code_element.text if code_element is not None else 'SEM CÓDIGO',
                        'barcode': ean_text if ean_text and ean_text != 'SEM GTIN' else None,
                        'type': 'product',
                        'nfe_import_id': record.id,
                        'color': self._extract_color_from_name(name_element.text if name_element is not None else ''),
                    }
                    product = self.env['product.product'].create(vals)
    
    def _extract_color_from_name(self, name):
        """Extrai cor do nome do produto"""
        # Lista de cores comuns em português
        colors = {
            'BRANCO': '#FFFFFF',
            'PRETO': '#000000',
            'VERMELHO': '#FF0000',
            'VERDE': '#00FF00',
            'AZUL': '#0000FF',
            'AMARELO': '#FFFF00',
            'LARANJA': '#FFA500',
            'ROXO': '#800080',
            'ROSA': '#FFC0CB',
            'CINZA': '#808080',
            'MARROM': '#A52A2A',
            'BEGE': '#F5F5DC',
        }
        
        # Procura por cores no nome do produto
        name_upper = name.upper()
        for color_name, color_hex in colors.items():
            if color_name in name_upper:
                return color_hex
        
        return '#FFFFFF'  # Cor padrão quando não identificada
    
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
                # Simplificando a validação do certificado para evitar problemas
                p12 = crypto.load_pkcs12(cert_data, record.certificate_password.encode())
                _logger.info("Certificado carregado com sucesso")
            except Exception as e:
                os.unlink(cert_file.name)
                _logger.error(f"Erro ao carregar certificado: {str(e)}")
                error_msg = str(e)
                if "mac verify failure" in error_msg.lower():
                    raise Exception("Senha do certificado incorreta. Por favor, verifique a senha e tente novamente.")
                elif "asn1 encoding routines" in error_msg.lower():
                    raise Exception("Formato de certificado inválido. Certifique-se de que é um arquivo PFX/P12 válido.")
                else:
                    raise Exception(f"Erro ao validar certificado: {error_msg}")
            
            # Determinar o endpoint da SEFAZ
            endpoint = self._get_sefaz_endpoint(record.access_key)
            
            # Montando a requisição SOAP para consultar a NF-e
            xml_consulta = self._prepare_consulta_xml(record.access_key)
            
            # Fazendo a requisição usando o certificado
            headers = {'Content-Type': 'application/soap+xml; charset=utf-8'}
            
            # Adicionar mais opções para lidar com certificados complexos
            response = requests.post(
                endpoint,
                data=xml_consulta,
                cert=(cert_file.name, record.certificate_password),
                verify=True,
                headers=headers,
                timeout=60  # Aumentando timeout para 60 segundos
            )
            
            # Remover arquivo temporário do certificado
            os.unlink(cert_file.name)
            
            if response.status_code != 200:
                _logger.error(f"Erro na consulta à SEFAZ: {response.status_code} - {response.text}")
                raise Exception(f"Erro na consulta à SEFAZ. Código: {response.status_code}")
            
            # Processar a resposta da SEFAZ
            xml_nfe = self._extract_nfe_xml_from_response(response.text)
            
            if not xml_nfe:
                _logger.error("Não foi possível extrair o XML da NF-e da resposta")
                raise Exception("Não foi possível extrair o XML da NF-e da resposta da SEFAZ")
            
            return xml_nfe
            
        except Exception as e:
            _logger.error(f"Erro ao buscar NF-e na SEFAZ: {str(e)}")
            raise Exception(f"Erro ao buscar NF-e na SEFAZ: {str(e)}")
    
    def _get_sefaz_endpoint(self, access_key):
        """Retorna o endpoint da SEFAZ com base na UF contida na chave de acesso"""
        # A UF está nos primeiros 2 dígitos da chave de acesso
        uf_codigo = access_key[:2]
        
        # Mapeamento de códigos de UF para endpoints da SEFAZ
        endpoints = {
            '35': 'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',  # SP
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
            for path in [
                './/nfe:retConsSitNFe//nfe:procNFe',
                './/nfe:nfeProc',
                './/nfe:NFe',
                './/procNFe',
                './/NFe'
            ]:
                nfe_xml_element = root.find(path, namespaces)
                if nfe_xml_element is not None:
                    # Converter o elemento para string XML
                    return ET.tostring(nfe_xml_element, encoding='utf-8')
            
            # Busca genérica por qualquer elemento que possa conter a NF-e
            for elem in root.iter():
                if 'NFe' in elem.tag:
                    return ET.tostring(elem, encoding='utf-8')
            
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
