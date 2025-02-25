
import { Product } from '../types/nfe';
import { extrairCorDaDescricao } from './colorParser';
import { extrairTamanhoDaDescricao } from './sizeParser';
import { identifyBrand } from './brandIdentifier';

export const parseNFeXML = (xmlText: string): Product[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Erro ao analisar o arquivo XML");
  }
  
  const ns = "http://www.portalfiscal.inf.br/nfe";
  const items = xmlDoc.getElementsByTagNameNS(ns, "det");
  const products: Product[] = [];
  
  const getElementText = (element: Element, tagName: string) => {
    const el = element.getElementsByTagNameNS(ns, tagName)[0];
    return el ? el.textContent || "" : "";
  };

  const parseNumber = (text: string) => {
    if (!text) return 0;
    const cleanText = text.replace(/[^\d,.-]/g, '').replace(',', '.');
    const number = parseFloat(cleanText);
    return isNaN(number) ? 0 : number;
  };

  // Primeiro, calcula o valor total dos produtos e o valor total da nota
  let totalProductsValue = 0;
  let totalInvoiceValue = 0;

  // Pega o valor total da nota do nó total
  const totalNode = xmlDoc.getElementsByTagNameNS(ns, "total")[0];
  if (totalNode) {
    const icmsTotalNode = totalNode.getElementsByTagNameNS(ns, "ICMSTot")[0];
    if (icmsTotalNode) {
      totalProductsValue = parseNumber(getElementText(icmsTotalNode, "vProd"));
      totalInvoiceValue = parseNumber(getElementText(icmsTotalNode, "vNF"));
    }
  }

  // Calcula a porcentagem de desconto global
  const totalDiscount = totalProductsValue - totalInvoiceValue;
  const discountPercentage = totalDiscount > 0 ? (totalDiscount / totalProductsValue) * 100 : 0;
  
  console.log('Valor Total Produtos:', totalProductsValue);
  console.log('Valor Total Nota:', totalInvoiceValue);
  console.log('Desconto Total:', totalDiscount);
  console.log('Porcentagem de Desconto:', discountPercentage.toFixed(2) + '%');
  
  const getICMSInfo = (element: Element) => {
    if (!element) return { cst: "", orig: "" };
    
    const icmsGroups = ['00', '10', '20', '30', '40', '51', '60', '70', '90'];
    
    for (const group of icmsGroups) {
      const icmsNode = element.getElementsByTagNameNS(ns, `ICMS${group}`)[0];
      if (icmsNode) {
        return {
          cst: getElementText(icmsNode, "CST"),
          orig: getElementText(icmsNode, "orig"),
        };
      }
    }
    
    // Tenta CSOSN para Simples Nacional
    const icmsSN = element.getElementsByTagNameNS(ns, "ICMSSN")[0];
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
    const prod = item.getElementsByTagNameNS(ns, "prod")[0];
    const icms = item.getElementsByTagNameNS(ns, "ICMS")[0];
    
    if (!prod) {
      console.warn(`Item ${i + 1}: Nó 'prod' não encontrado`);
      continue;
    }
    
    const icmsInfo = getICMSInfo(icms);
    
    // Valores brutos
    const quantity = parseNumber(getElementText(prod, "qCom"));
    const unitPrice = parseNumber(getElementText(prod, "vUnCom"));
    const totalPrice = parseNumber(getElementText(prod, "vProd"));
    
    // Aplica a porcentagem de desconto ao preço unitário
    const unitDiscount = unitPrice * (discountPercentage / 100);
    const netUnitPrice = unitPrice - unitDiscount;
    
    // Calcula os valores totais
    const totalDiscount = unitDiscount * quantity;
    const netPrice = netUnitPrice * quantity;
    
    const nome = getElementText(prod, "xProd");
    const codigo = getElementText(prod, "cProd");
    const corIdentificada = extrairCorDaDescricao(nome);
    const tamanho = extrairTamanhoDaDescricao(nome);
    const referencia = codigo;

    // Identifica a marca baseada na referência e nome
    const { brand, confidence } = identifyBrand(referencia, nome);
    
    const product: Product = {
      code: codigo,
      ean: getElementText(prod, "cEAN"),
      name: nome,
      ncm: getElementText(prod, "NCM"),
      cfop: getElementText(prod, "CFOP"),
      uom: getElementText(prod, "uCom"),
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      discount: totalDiscount,
      netPrice: netPrice,
      color: corIdentificada || '',
      size: tamanho,
      reference: referencia,
      useMarkup: false,
      markup: 30,
      salePrice: netPrice * 1.3,
      brand: brand, // Adicionando a marca identificada
      brandConfidence: confidence // Adicionando o nível de confiança da identificação
    };
    
    products.push(product);
  }
  
  return products;
};
