import { Product } from '../types/nfe';
import { extrairCorDaDescricao } from './colorParser';
import { extrairTamanhoDaDescricao } from './sizeParser';

export const parseNFeXML = (xmlText: string): Product[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  // Verifica se houve erro no parsing do XML
  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Erro ao analisar o arquivo XML");
  }
  
  // Namespace da NFe
  const ns = "http://www.portalfiscal.inf.br/nfe";
  
  // Seleciona todos os itens (det) da NFe
  const items = xmlDoc.getElementsByTagNameNS(ns, "det");
  
  const products: Product[] = [];
  
  // Função auxiliar para obter o texto de um elemento
  const getElementText = (element: Element, tagName: string) => {
    const el = element.getElementsByTagNameNS(ns, tagName)[0];
    return el ? el.textContent || "" : "";
  };

  // Função auxiliar para converter texto para número
  const parseNumber = (text: string) => {
    if (!text) return 0;
    const cleanText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
    const number = parseFloat(cleanText);
    return isNaN(number) ? 0 : number;
  };
  
  // Extrai os dados específicos para impostos ICMS
  const getICMSInfo = (icmsElement: Element) => {
    if (!icmsElement) return { cst: "", orig: "" };
    
    const icmsGroups = ['00', '10', '20', '30', '40', '51', '60', '70', '90'];
    
    for (const group of icmsGroups) {
      const icmsNode = icmsElement.getElementsByTagNameNS(ns, `ICMS${group}`)[0];
      if (icmsNode) {
        return {
          cst: getElementText(icmsNode, "CST"),
          orig: getElementText(icmsNode, "orig"),
        };
      }
    }
    
    // Tenta CSOSN para Simples Nacional
    const icmsSN = icmsElement.getElementsByTagNameNS(ns, "ICMSSN")[0];
    if (icmsSN) {
      return {
        cst: getElementText(icmsSN, "CSOSN"),
        orig: getElementText(icmsSN, "orig"),
      };
    }
    
    return { cst: "", orig: "" };
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // Extrai informações do produto
    const prod = item.getElementsByTagNameNS(ns, "prod")[0];
    const icms = item.getElementsByTagNameNS(ns, "ICMS")[0];
    
    if (!prod) {
      console.warn(`Item ${i + 1}: Nó 'prod' não encontrado`);
      continue;
    }
    
    const icmsInfo = getICMSInfo(icms);
    
    const totalPrice = parseNumber(getElementText(prod, "vProd"));
    const discount = parseNumber(getElementText(item, "vDesc"));
    const netPrice = totalPrice - discount;
    
    const nome = getElementText(prod, "xProd");
    const codigo = getElementText(prod, "cProd");
    const corIdentificada = extrairCorDaDescricao(nome);
    const tamanho = extrairTamanhoDaDescricao(nome);
    
    // Extrai referência da descrição ou usa o código como fallback
    const referencia = codigo;
    
    const product: Product = {
      code: codigo,
      ean: getElementText(prod, "cEAN"),
      name: nome,
      ncm: getElementText(prod, "NCM"),
      cfop: getElementText(prod, "CFOP"),
      uom: getElementText(prod, "uCom"),
      quantity: parseNumber(getElementText(prod, "qCom")),
      unitPrice: parseNumber(getElementText(prod, "vUnCom")),
      totalPrice: totalPrice,
      discount: discount,
      netPrice: netPrice,
      color: corIdentificada || '',
      size: tamanho,
      reference: referencia,
      useMarkup: false,
      markup: 30,
      salePrice: netPrice * 1.3
    };
    
    products.push(product);
  }
  
  return products;
};
