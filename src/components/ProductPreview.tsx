
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from '../types/nfe';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Input } from "@/components/ui/input";

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ products, onProductUpdate, editable = false }) => {
  const totals = products.reduce((acc, product) => ({
    totalBruto: acc.totalBruto + product.totalPrice,
    totalDesconto: acc.totalDesconto + product.discount,
    totalLiquido: acc.totalLiquido + product.netPrice,
  }), {
    totalBruto: 0,
    totalDesconto: 0,
    totalLiquido: 0,
  });

  const handleUpdate = (index: number, field: keyof Product, value: string) => {
    if (!onProductUpdate) return;

    const product = { ...products[index] };
    if (field === 'color') {
      product.color = value;
    } else if (field === 'name') {
      product.name = value;
    }
    onProductUpdate(index, product);
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Código</TableHead>
            <TableHead className="font-semibold">EAN</TableHead>
            <TableHead className="font-semibold">Descrição</TableHead>
            <TableHead className="font-semibold">NCM</TableHead>
            <TableHead className="font-semibold">CFOP</TableHead>
            <TableHead className="font-semibold">Un.</TableHead>
            <TableHead className="font-semibold text-right">Qtd.</TableHead>
            <TableHead className="font-semibold text-right">Valor Un.</TableHead>
            <TableHead className="font-semibold text-right">Valor Bruto</TableHead>
            <TableHead className="font-semibold text-right">Desconto</TableHead>
            <TableHead className="font-semibold text-right">Valor Líquido</TableHead>
            <TableHead className="font-semibold">CST/CSOSN</TableHead>
            <TableHead className="font-semibold">Cor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.code} className="hover:bg-slate-50">
              <TableCell>{product.code || '-'}</TableCell>
              <TableCell>{product.ean || '-'}</TableCell>
              <TableCell className="max-w-md">
                {editable ? (
                  <Input
                    value={product.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    className="w-full"
                  />
                ) : (
                  product.name
                )}
              </TableCell>
              <TableCell>{product.ncm || '-'}</TableCell>
              <TableCell>{product.cfop || '-'}</TableCell>
              <TableCell>{product.uom || '-'}</TableCell>
              <TableCell className="text-right">{formatNumber(product.quantity)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.totalPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.discount)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.netPrice)}</TableCell>
              <TableCell>{product.taxCode || '-'}</TableCell>
              <TableCell>
                {editable ? (
                  <Input
                    type="color"
                    value={product.color}
                    onChange={(e) => handleUpdate(index, 'color', e.target.value)}
                    className="w-16 h-8 p-0 cursor-pointer"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: product.color }}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-slate-100 font-semibold">
            <TableCell colSpan={8}>Totais</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalBruto)}</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalLiquido)}</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductPreview;
