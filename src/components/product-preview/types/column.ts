
import { Product } from '../../../types/nfe';

export interface Column {
  id: string;
  header: string;
  initiallyVisible: boolean;
  alignment?: 'left' | 'right';
  width?: string;
  format?: (value: any, product?: Product) => string;
  getValue?: (product: Product) => any;
  minWidth?: number;
}

export const getDefaultColumns = (): Column[] => [
  { 
    id: 'image', 
    header: 'Imagem', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 48
  },
  { 
    id: 'code', 
    header: 'Código', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 100
  },
  { 
    id: 'name', 
    header: 'Descrição', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 300
  },
  { 
    id: 'size', 
    header: 'Tam.', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 64
  },
  { 
    id: 'reference', 
    header: 'Referência', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 120
  },
  { 
    id: 'ean', 
    header: 'EAN', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 120
  },
  { 
    id: 'color', 
    header: 'Cor', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 96
  },
  { 
    id: 'ncm', 
    header: 'NCM', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 96
  },
  { 
    id: 'cfop', 
    header: 'CFOP', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 80
  },
  { 
    id: 'uom', 
    header: 'UN', 
    initiallyVisible: true,
    width: 'w-fit',
    minWidth: 56
  },
  { 
    id: 'quantity', 
    header: 'Qtd.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 80,
    format: (value: number) => value.toLocaleString()
  },
  { 
    id: 'unitPrice', 
    header: 'Custo Un.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 112,
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'totalPrice', 
    header: 'Total', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 112,
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'netPrice', 
    header: 'Líquido', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 140,
    format: (value: number, product?: Product) => {
      if (!product) return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const discountPercent = product.totalPrice > 0 ? (product.discount / product.totalPrice) * 100 : 0;
      return `${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${discountPercent.toFixed(1)}%)`;
    }
  },
  { 
    id: 'unitDiscount', 
    header: 'Desc. Un.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 112,
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    getValue: (product: Product) => product.quantity > 0 ? product.discount / product.quantity : 0
  },
  { 
    id: 'xapuriPrice', 
    header: 'Preço Xap.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 112,
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  },
  { 
    id: 'epitaPrice', 
    header: 'Preço Epit.', 
    initiallyVisible: true, 
    alignment: 'right',
    width: 'w-fit',
    minWidth: 112,
    format: (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }
];

export const compactColumns = [
  'image',
  'name',
  'size',
  'reference',
  'ean',
  'quantity',
  'unitPrice',
  'unitDiscount',
  'netPrice',
  'xapuriPrice',
  'epitaPrice',
];
