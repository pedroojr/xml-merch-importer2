import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Image as ImageIcon, Copy, Check } from "lucide-react";
import { Product } from '../../types/nfe';
import { Column } from './types/column';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { toast } from "sonner";
import { generateProductDescription } from './productDescription';
import { formatNumberForCopy } from '../../utils/formatters';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

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
  const [copiedField, setCopiedField] = useState<string>('');
  const [showHidden, setShowHidden] = useState(() => {
    const saved = localStorage.getItem('showHidden');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('showHidden', JSON.stringify(showHidden));
  }, [showHidden]);

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

  const filterProducts = (products: Product[]) => {
    return products.filter(product => {
      const isItemHidden = hiddenItems.has(products.indexOf(product));
      return showHidden ? isItemHidden : !isItemHidden;
    });
  };

  const filteredProducts = filterProducts(products);

  const totals = filteredProducts.reduce((acc, product) => {
    const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
    const baseXapuriPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup);
    const baseEpitaPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup);
    
    const xapuriPrice = roundPrice(baseXapuriPrice, roundingType);
    const epitaPrice = roundPrice(baseEpitaPrice, roundingType);

    return {
      quantidade: acc.quantidade + product.quantity,
      valorTotal: acc.valorTotal + product.totalPrice,
      valorLiquido: acc.valorLiquido + product.netPrice,
      xapuri: acc.xapuri + (xapuriPrice * product.quantity),
      epita: acc.epita + (epitaPrice * product.quantity),
    };
  }, {
    quantidade: 0,
    valorTotal: 0,
    valorLiquido: 0,
    xapuri: 0,
    epita: 0,
  });

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-hidden"
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
            <Label htmlFor="show-hidden" className="font-medium">Mostrar apenas ocultados</Label>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Quantidade</div>
                <div className="text-2xl font-bold">{totals.quantidade.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Valor Total</div>
                <div className="text-2xl font-bold">{totals.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">Valor Líquido</div>
                <div className="text-2xl font-bold">{totals.valorLiquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-blue-600 mb-1">Total Xapuri</div>
                <div className="text-2xl font-bold text-blue-700">{totals.xapuri.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50">
              <CardContent className="pt-4">
                <div className="text-sm font-medium text-emerald-600 mb-1">Total Epitaciolândia</div>
                <div className="text-2xl font-bold text-emerald-700">{totals.epita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              {columns.map((column) => (
                visibleColumns.has(column.id) && (
                  <TableHead
                    key={column.id}
                    className={`font-semibold px-6 ${
                      column.alignment === 'right' ? 'text-right' : ''
                    } ${
                      column.id === 'xapuriPrice' ? 'bg-blue-50 text-blue-700' : ''
                    } ${
                      column.id === 'epitaPrice' ? 'bg-emerald-50 text-emerald-700' : ''
                    }`}
                  >
                    {column.header}
                  </TableHead>
                )
              ))}
              <TableHead className="font-semibold w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const productIndex = products.indexOf(product);
              const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
              const baseXapuriPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup);
              const baseEpitaPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup);
              
              const xapuriPrice = roundPrice(baseXapuriPrice, roundingType);
              const epitaPrice = roundPrice(baseEpitaPrice, roundingType);

              const betterDescription = generateProductDescription(product);

              return (
                <TableRow 
                  key={`${product.code}-${productIndex}`}
                  className="hover:bg-slate-100 transition-colors"
                >
                  {visibleColumns.has('image') && (
                    <TableCell className="w-20">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openGoogleSearch(product)}
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
                    if (column.id === 'unitPrice') value = product.unitPrice;
                    if (column.id === 'netPrice') value = unitNetPrice;
                    if (column.id === 'name') value = betterDescription;

                    const copyId = `${column.id}-${productIndex}`;
                    const isCopied = copiedField === copyId;

                    return (
                      <TableCell
                        key={column.id}
                        className={`px-6 py-4 ${
                          column.alignment === 'right' ? 'text-right tabular-nums' : ''
                        } ${
                          column.id === 'xapuriPrice' ? 'bg-blue-50' : ''
                        } ${
                          column.id === 'epitaPrice' ? 'bg-emerald-50' : ''
                        } group relative cursor-pointer hover:bg-slate-200`}
                        onClick={() => handleCopyToClipboard(value, column, copyId)}
                      >
                        <div className="flex items-center gap-2 justify-between">
                          <span>{column.format ? column.format(value) : value}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <TableCell className="px-6">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(productIndex)}
                      >
                        {hiddenItems.has(productIndex) ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
