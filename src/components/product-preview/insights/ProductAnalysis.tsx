
import React from 'react';
import { Product } from '../../../types/nfe';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatNumber } from '../../../utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductAnalysisProps {
  products: Product[];
}

export const ProductAnalysis: React.FC<ProductAnalysisProps> = ({ products }) => {
  // Análises por tamanho
  const tamanhoStats = products.reduce((acc, product) => {
    const tamanho = product.size || 'Não especificado';
    if (!acc[tamanho]) {
      acc[tamanho] = {
        quantidade: 0,
        valorTotal: 0,
        produtos: []
      };
    }
    acc[tamanho].quantidade += product.quantity;
    acc[tamanho].valorTotal += product.netPrice;
    acc[tamanho].produtos.push(product);
    return acc;
  }, {} as Record<string, { quantidade: number; valorTotal: number; produtos: Product[] }>);

  // Análises por NCM
  const ncmStats = products.reduce((acc, product) => {
    if (!acc[product.ncm]) {
      acc[product.ncm] = {
        quantidade: 0,
        valorTotal: 0,
        descricao: product.name.split(' ')[0] // Pega primeiro termo como categoria
      };
    }
    acc[product.ncm].quantidade += product.quantity;
    acc[product.ncm].valorTotal += product.netPrice;
    return acc;
  }, {} as Record<string, { quantidade: number; valorTotal: number; descricao: string }>);

  // Análise por faixa de preço
  const getFaixaPreco = (preco: number): string => {
    if (preco <= 50) return 'Até R$ 50';
    if (preco <= 100) return 'R$ 51 a R$ 100';
    if (preco <= 200) return 'R$ 101 a R$ 200';
    return 'Acima de R$ 200';
  };

  const faixaPrecoStats = products.reduce((acc, product) => {
    const precoUnitario = product.netPrice / product.quantity;
    const faixa = getFaixaPreco(precoUnitario);
    if (!acc[faixa]) {
      acc[faixa] = {
        quantidade: 0,
        valorTotal: 0,
        produtos: []
      };
    }
    acc[faixa].quantidade += product.quantity;
    acc[faixa].valorTotal += product.netPrice;
    acc[faixa].produtos.push(product);
    return acc;
  }, {} as Record<string, { quantidade: number; valorTotal: number; produtos: Product[] }>);

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Análise por Tamanho</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Tamanho</TableHead>
                <TableHead className="font-semibold text-right">Quantidade</TableHead>
                <TableHead className="font-semibold text-right">Valor Total</TableHead>
                <TableHead className="font-semibold text-right">Preço Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(tamanhoStats)
                .sort((a, b) => b[1].quantidade - a[1].quantidade)
                .map(([tamanho, stats]) => (
                  <TableRow key={tamanho}>
                    <TableCell className="font-medium">{tamanho}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(stats.quantidade)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stats.valorTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stats.valorTotal / stats.quantidade)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Análise por NCM</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">NCM</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="font-semibold text-right">Quantidade</TableHead>
                <TableHead className="font-semibold text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(ncmStats)
                .sort((a, b) => b[1].valorTotal - a[1].valorTotal)
                .map(([ncm, stats]) => (
                  <TableRow key={ncm}>
                    <TableCell className="font-medium">{ncm}</TableCell>
                    <TableCell>{stats.descricao}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(stats.quantidade)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(stats.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Análise por Faixa de Preço</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Faixa de Preço</TableHead>
                <TableHead className="font-semibold text-right">Quantidade</TableHead>
                <TableHead className="font-semibold text-right">Valor Total</TableHead>
                <TableHead className="font-semibold text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(faixaPrecoStats)
                .sort((a, b) => b[1].valorTotal - a[1].valorTotal)
                .map(([faixa, stats]) => {
                  const percentualTotal = (stats.valorTotal / products.reduce((acc, p) => acc + p.netPrice, 0)) * 100;
                  return (
                    <TableRow key={faixa}>
                      <TableCell className="font-medium">{faixa}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(stats.quantidade)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(stats.valorTotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {percentualTotal.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
