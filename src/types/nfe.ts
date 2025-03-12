
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
  netPrice: number;      // Valor com Desconto (após descontos)
  color: string;        // Cor do produto em formato HEX
  size: string;         // Tamanho do produto
  reference: string;    // Referência do produto
  useMarkup: boolean;   // Indica se deve usar markup no cálculo
  markup: number;       // Percentual de markup
  salePrice: number;    // Preço de venda calculado
  imageUrl?: string;    // URL da imagem do produto
  brand: string;        // Marca identificada do produto
  brandConfidence: number; // Nível de confiança na identificação da marca (0-1)
  taxPercent?: number; // Percentual de imposto de entrada
}

export interface SavedNFe {
  id: string;
  products: Product[];
  date: string;
  name: string;
  invoiceNumber?: string;
  brandName?: string;
  hiddenItems?: Set<number>;
  xapuriMarkup?: number;
  epitaMarkup?: number;
  roundingType?: string;
  taxPercent?: number; // Percentual de imposto de entrada
}
