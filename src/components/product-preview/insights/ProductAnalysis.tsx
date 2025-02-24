
import React from 'react';
import { Product } from '../../../types/nfe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from '../../../utils/formatters';

interface ProductAnalysisProps {
  products: Product[];
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ products }) => {
  const sortedByQuantity = [...products].sort((a, b) => b.quantity - a.quantity);
  const sortedByValue = [...products].sort((a, b) => b.netPrice - a.netPrice);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Produtos com Maior Volume</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Valor Unitário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByQuantity.slice(0, 5).map((product) => (
              <TableRow key={product.code}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{formatNumber(product.quantity)}</TableCell>
                <TableCell>{formatCurrency(product.netPrice)}</TableCell>
                <TableCell>{formatCurrency(product.netPrice / product.quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Produtos com Maior Valor</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Valor Unitário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedByValue.slice(0, 5).map((product) => (
              <TableRow key={product.code}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{formatCurrency(product.netPrice)}</TableCell>
                <TableCell>{formatNumber(product.quantity)}</TableCell>
                <TableCell>{formatCurrency(product.netPrice / product.quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
