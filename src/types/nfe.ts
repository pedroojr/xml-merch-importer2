
export interface Product {
  code: string;           // cProd - Código do produto
  ean: string;           // cEAN - Código EAN/GTIN
  name: string;          // xProd - Descrição do produto
  ncm: string;          // NCM - Nomenclatura Comum do Mercosul
  cfop: string;         // CFOP - Código Fiscal de Operações e Prestações
  uom: string;          // uCom - Unidade Comercial
  quantity: number;      // qCom - Quantidade Comercial
  unitPrice: number;     // vUnCom - Valor Unitário de Comercialização
  totalPrice: number;    // vProd - Valor Total Bruto
  discount: number;      // vDesc - Valor do Desconto
  netPrice: number;      // Valor Total Líquido (após descontos)
  taxCode: string;      // Código da Situação Tributária
}
