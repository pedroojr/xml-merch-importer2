
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Product } from '../../types/nfe';
import { formatCurrency } from '../../utils/formatters';
import { GlobalControls } from './GlobalControls';
import { ProductTableRow } from './ProductTableRow';
import { calculateSalePrice, roundPrice, calculateTotals } from './productCalculations';

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  products, 
  onProductUpdate, 
  editable = false 
}) => {
  const [globalMarkup, setGlobalMarkup] = useState(30);
  const [roundingType, setRoundingType] = useState<'90' | '50'>('90');

  const totals = calculateTotals(products);
  const totalItems = products.reduce((acc, product) => acc + product.quantity, 0);

  const handleGlobalMarkupChange = (value: number) => {
    setGlobalMarkup(value);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      if (product.useMarkup) {
        const newProduct = { ...product };
        newProduct.markup = value;
        newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, value), roundingType);
        onProductUpdate(index, newProduct);
      }
    });
  };

  const handleGlobalRoundingChange = (type: '90' | '50') => {
    setRoundingType(type);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      if (product.useMarkup) {
        const newProduct = { ...product };
        newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, newProduct.markup), type);
        onProductUpdate(index, newProduct);
      }
    });
  };

  const handleUpdate = (index: number, field: keyof Product, value: any) => {
    if (!onProductUpdate) return;

    const product = { ...products[index] };
    
    switch (field) {
      case 'name':
      case 'color':
      case 'uom':
        product[field] = value as string;
        break;
      case 'useMarkup':
        product.useMarkup = value as boolean;
        product.markup = globalMarkup;
        if (product.useMarkup) {
          product.salePrice = roundPrice(calculateSalePrice(product, globalMarkup), roundingType);
        }
        break;
      case 'salePrice':
        product.salePrice = parseFloat(value) || 0;
        break;
    }

    onProductUpdate(index, product);
  };

  return (
    <div className="space-y-4">
      <GlobalControls
        markup={globalMarkup}
        roundingType={roundingType}
        onMarkupChange={handleGlobalMarkupChange}
        onRoundingChange={handleGlobalRoundingChange}
      />

      <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-24 font-semibold">Código</TableHead>
              <TableHead className="w-32 font-semibold">EAN</TableHead>
              <TableHead className="min-w-[400px] font-semibold">Descrição</TableHead>
              <TableHead className="w-28 font-semibold">NCM</TableHead>
              <TableHead className="w-24 font-semibold">CFOP</TableHead>
              <TableHead className="w-32 font-semibold">Unidade</TableHead>
              <TableHead className="w-24 font-semibold text-right">Qtd.</TableHead>
              <TableHead className="w-32 font-semibold text-right">Valor Un.</TableHead>
              <TableHead className="w-32 font-semibold text-right">Valor Bruto</TableHead>
              <TableHead className="w-32 font-semibold text-right">Desconto</TableHead>
              <TableHead className="w-32 font-semibold text-right">Valor Líquido</TableHead>
              <TableHead className="w-40 font-semibold">Cor</TableHead>
              <TableHead className="w-24 font-semibold text-center">Markup</TableHead>
              <TableHead className="w-40 font-semibold text-right">Preço Venda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <ProductTableRow
                key={product.code}
                product={product}
                index={index}
                editable={editable}
                onUpdate={handleUpdate}
                units={product.uom ? [product.uom] : []}
                globalMarkup={globalMarkup}
                roundingType={roundingType}
              />
            ))}
            <TableRow className="bg-slate-100 font-semibold">
              <TableCell colSpan={6}>Totais</TableCell>
              <TableCell className="text-right">{totalItems}</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalBruto)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.totalLiquido)}</TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductPreview;
