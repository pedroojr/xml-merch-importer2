
import React from 'react';
import { Product } from '../../../types/nfe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductAnalysisProps {
  products: Product[];
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ products }) => {
  // Sort by quantity and filter out products that have higher total value
  const sortedByQuantity = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .filter(product => {
      const productValue = product.netPrice;
      const productsWithHigherValue = products.filter(p => p.netPrice > productValue);
      return productsWithHigherValue.length < 5;
    });

  // Sort by total value and filter out products that have higher quantity
  const sortedByValue = [...products]
    .sort((a, b) => b.netPrice - a.netPrice)
    .filter(product => {
      const productQuantity = product.quantity;
      const productsWithHigherQuantity = products.filter(p => p.quantity > productQuantity);
      return productsWithHigherQuantity.length < 5;
    });

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Produtos com Maior Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Produto</TableHead>
                <TableHead className="font-semibold text-right">Quantidade</TableHead>
                <TableHead className="font-semibold text-right">Valor Unit.</TableHead>
                <TableHead className="font-semibold text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByQuantity.slice(0, 5).map((product) => (
                <TableRow key={product.code}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(product.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.netPrice / product.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(product.netPrice)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Produtos com Maior Valor Total</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Produto</TableHead>
                <TableHead className="font-semibold text-right">Valor Total</TableHead>
                <TableHead className="font-semibold text-right">Quantidade</TableHead>
                <TableHead className="font-semibold text-right">Valor Unit.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByValue.slice(0, 5).map((product) => (
                <TableRow key={product.code} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(product.netPrice)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatNumber(product.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.netPrice / product.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
