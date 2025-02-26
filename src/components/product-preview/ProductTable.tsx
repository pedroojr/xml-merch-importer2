import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Image as ImageIcon, Copy, Check } from "lucide-react";
import { Product } from '../../types/nfe';
import { Column } from './types/column';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { toast } from "sonner";
import { formatNumberForCopy } from '../../utils/formatters';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { extrairTamanhoDaDescricao } from '../../utils/sizeParser';

interface ProductTableProps {
  products: Product[];
  visibleColumns: Set<string>;
  columns: Column[];
  hiddenItems: Set<number>;
  handleToggleVisibility: (index: number) => void;
  handleImageSearch: (index: number, product: Product) => void;
  xapuriMarkup: number;
  epitaMarkup: number;
  roundingType: RoundingType;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  visibleColumns,
  columns,
  hiddenItems,
  handleToggleVisibility,
  handleImageSearch,
  xapuriMarkup,
  epitaMarkup,
  roundingType,
}) => {
  const [showHidden, setShowHidden] = useState(() => {
    const saved = localStorage.getItem('showHidden');
    return saved ? JSON.parse(saved) : false;
  });
  const [copiedField, setCopiedField] = useState<string>('');

  const openGoogleSearch = (product: Product) => {
    const searchTerms = `${product.ean || ''} ${product.reference || ''} ${product.code || ''}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&tbm=isch`, '_blank');
  };

  const formatValueForCopy = (value: any, column: Column): string => {
    if (typeof value === 'number') {
      if (column.id.toLowerCase().includes('price') || 
          column.id.toLowerCase().includes('discount') || 
          column.id === 'unitPrice' || 
          column.id === 'netPrice') {
        return formatNumberForCopy(value, 2);
      }
      if (column.id === 'quantity') {
        return formatNumberForCopy(value, 4);
      }
    }
    return value?.toString() || '';
  };

  const handleCopyToClipboard = async (value: any, column: Column, field: string) => {
    try {
      const formattedValue = formatValueForCopy(value, column);
      await navigator.clipboard.writeText(formattedValue);
      setCopiedField(field);
      toast.success('Copiado para a área de transferência');
      setTimeout(() => setCopiedField(''), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const filteredProducts = products.filter(product => {
    const isItemHidden = hiddenItems.has(products.indexOf(product));
    return showHidden ? isItemHidden : !isItemHidden;
  });

  const totals = filteredProducts.reduce((acc, product) => ({
    quantidade: acc.quantidade + product.quantity,
    valorTotal: acc.valorTotal + product.totalPrice,
    valorLiquido: acc.valorLiquido + product.netPrice,
  }), {
    quantidade: 0,
    valorTotal: 0,
    valorLiquido: 0,
  });

  return (
    <div className="w-full">
      <div className="bg-slate-50 p-4 mb-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-hidden"
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
            <Label htmlFor="show-hidden" className="font-medium">
              Mostrar apenas ocultados
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Quantidade</div>
                <div className="text-base font-semibold">{totals.quantidade.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Valor Total</div>
                <div className="text-base font-semibold">{totals.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Valor Líquido</div>
                <div className="text-base font-semibold">{totals.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              {columns.map((column) => (
                visibleColumns.has(column.id) && (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.width,
                      column.alignment === 'right' && "text-right",
                      column.id === 'xapuriPrice' && "bg-blue-50 text-blue-700",
                      column.id === 'epitaPrice' && "bg-emerald-50 text-emerald-700",
                      "px-4 py-2 font-medium"
                    )}
                  >
                    {column.header}
                  </TableHead>
                )
              ))}
              <TableHead className="w-[80px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product, index) => {
              const productIndex = products.indexOf(product);
              const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
              const baseXapuriPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup);
              const baseEpitaPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup);
              
              const xapuriPrice = roundPrice(baseXapuriPrice, roundingType);
              const epitaPrice = roundPrice(baseEpitaPrice, roundingType);
              
              const tamanhoDescricao = extrairTamanhoDaDescricao(product.name);
              const tamanhoReferencia = extrairTamanhoDaDescricao(product.reference);
              const tamanho = tamanhoDescricao || tamanhoReferencia;

              return (
                <TableRow 
                  key={`${product.code}-${productIndex}`}
                  className="hover:bg-slate-100 transition-colors"
                >
                  {visibleColumns.has('image') && (
                    <TableCell className="w-[80px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImageSearch(productIndex, product)}
                        className="w-full"
                        title="Buscar imagem no Google"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                  {columns.map((column) => {
                    if (!visibleColumns.has(column.id) || column.id === 'image') return null;

                    let value: any = column.getValue ? 
                      column.getValue(product) : 
                      product[column.id as keyof Product];

                    if (column.id === 'xapuriPrice') value = xapuriPrice;
                    if (column.id === 'epitaPrice') value = epitaPrice;
                    if (column.id === 'size') value = tamanho;

                    const copyId = `${column.id}-${productIndex}`;
                    const isCopied = copiedField === copyId;

                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.width,
                          "px-4 py-2",
                          column.alignment === 'right' && "text-right tabular-nums",
                          column.id === 'xapuriPrice' && "bg-blue-50",
                          column.id === 'epitaPrice' && "bg-emerald-50",
                          "group relative cursor-pointer"
                        )}
                        onClick={() => handleCopyToClipboard(value, column, copyId)}
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <span className={cn(
                            "truncate",
                            column.alignment === 'right' ? "ml-auto" : "mr-auto"
                          )}>
                            {column.format ? column.format(value) : value}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {isCopied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-500" />
                            )}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="w-[80px] text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(productIndex)}
                      className="w-8 h-8 p-0"
                    >
                      {hiddenItems.has(productIndex) ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
