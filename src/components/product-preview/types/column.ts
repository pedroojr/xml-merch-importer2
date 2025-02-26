
import { Product } from '../../../types/nfe';

export interface Column {
  id: string;
  header: string;
  initiallyVisible: boolean;
  alignment?: 'left' | 'right';
  width?: string;
  format?: (value: any) => string;
  getValue?: (product: Product) => any;
}

export const getDefaultColumns = (): Column[] => [
  { 
    id: 'image', 
    header: 'Imagem', 
    initiallyVisible: true,
    width: 'w-16'
  },
  { 
    id: 'code', 
    header: 'Código', 
    initiallyVisible: true,
    width: 'w-24'
  },
  { 
    id: 'ean', 
    header: 'EAN', 
    initiallyVisible: true,
    width: 'w-32'
  },
  { 
    id: 'reference', 
    header: 'Referência', 
    initiallyVisible: true,
    width: 'w-36'
  },
  { 
    id: 'name', 
    header: 'Descrição', 
    initiallyVisible: true,
    width: 'min-w-[180px] max-w-[300px]'
  },
  { 
    id: 'size', 
    header: 'Tamanho', 
    initiallyVisible: true,
    width: 'w-20'
  },
  { 
    id: 'color', 
    header: 'Cor', 
    initiallyVisible: true,
    width: 'w-28'
  },
  { 
    id: 'ncm', 
    header: 'NCM', 
    initiallyVisible: true,
    width: 'w-24'
  },
  { 
    id: 'cfop', 
    header: 'CFOP', 
    initiallyVisible: true,
    width: 'w-20'
  },
  { 
    id: 'uom', 
    header: 'Unidade', 
    initiallyVisible: true,
    width: 'w-20'
  },
  { 
    id: 'quantity', 
    header: 'Quantidade', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-24',
    format: (value: number) => value.toLocaleString()
  },
  { 
    id: 'unitPrice', 
    header: 'Custo Unit.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'totalPrice', 
    header: 'Valor Total', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'discount', 
    header: 'Desconto Total', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'unitDiscount', 
    header: 'Desconto Unit.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    getValue: (product: Product) => product.quantity > 0 ? product.discount / product.quantity : 0
  },
  { 
    id: 'netPrice', 
    header: 'Valor Líquido', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'xapuriPrice', 
    header: 'Preço Xapuri', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-28',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'epitaPrice', 
    header: 'Preço Epitaciolândia', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-32',
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
];

export const compactColumns = [
  'image',         // Imagem
  'reference',     // Referência
  'name',          // Descrição
  'size',          // Tamanho
  'color',         // Cor
  'ean',           // EAN
  'quantity',      // Quantidade
  'unitPrice',     // Custo Unitário
  'unitDiscount',  // Desconto Unitário
  'xapuriPrice',   // Preço Xapuri
  'epitaPrice',    // Preço Epitaciolândia
];
