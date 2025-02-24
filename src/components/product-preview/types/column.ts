
import { Product } from '../../../types/nfe';

export interface Column {
  id: string;
  header: string;
  initiallyVisible: boolean;
  alignment?: 'left' | 'right';
  format?: (value: any) => string;
  getValue?: (product: Product) => any;
}

export const getDefaultColumns = (): Column[] => [
  { 
    id: 'image', 
    header: 'Imagem', 
    initiallyVisible: true
  },
  { id: 'code', header: 'Código', initiallyVisible: true },
  { id: 'ean', header: 'EAN', initiallyVisible: true },
  { id: 'name', header: 'Descrição', initiallyVisible: true },
  { id: 'ncm', header: 'NCM', initiallyVisible: true },
  { id: 'cfop', header: 'CFOP', initiallyVisible: true },
  { id: 'uom', header: 'Unidade', initiallyVisible: true },
  { 
    id: 'quantity', 
    header: 'Quantidade', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString()
  },
  { 
    id: 'unitPrice', 
    header: 'Custo Unit.', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'totalPrice', 
    header: 'Valor Total', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'discount', 
    header: 'Desconto Total', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'unitDiscount', 
    header: 'Desconto Unit.', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    getValue: (product: Product) => product.quantity > 0 ? product.discount / product.quantity : 0
  },
  { 
    id: 'netPrice', 
    header: 'Valor Líquido', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'xapuriPrice', 
    header: 'Preço Xapuri', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'epitaPrice', 
    header: 'Preço Epitaciolândia', 
    initiallyVisible: true, 
    alignment: 'right',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { id: 'color', header: 'Cor', initiallyVisible: true },
];

export const compactColumns = [
  'image',         // Imagem
  'name',          // Descrição
  'ean',           // EAN
  'quantity',      // Quantidade
  'unitPrice',     // Custo Unitário
  'unitDiscount',  // Desconto Unitário
  'xapuriPrice',   // Preço Xapuri
  'epitaPrice',    // Preço Epitaciolândia
];
