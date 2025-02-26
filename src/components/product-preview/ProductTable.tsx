
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Image as ImageIcon, Copy, Check } from "lucide-react";
import { Product } from '../../types/nfe';
import { Column } from './types/column';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { toast } from "sonner";
import { generateProductDescription } from './productDescription';
import { formatNumberForCopy } from '../../utils/formatters';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const [showHidden, setShowHidden] = useState(false);
  const [showUnconfirmed, setShowUnconfirmed] = useState(false);

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

  // Função para verificar se um produto está confirmado
  const isProductConfirmed = (product: Product) => {
    return product.brandConfidence >= 0.8;
  };

  // Função para filtrar produtos baseado nas configurações
  const filterProducts = (products: Product[]) => {
    return products.filter(product => {
      const isItemHidden = hiddenItems.has(products.indexOf(product));
      const isConfirmed = isProductConfirmed(product);

      if (showHidden && showUnconfirmed) {
        return isItemHidden && !isConfirmed;
      }
      if (showHidden) {
        return isItemHidden;
      }
      if (showUnconfirmed) {
        return !isConfirmed;
      }
      return !isItemHidden;
    });
  };

  // Agrupa produtos por marca
  const groupedProducts = products.reduce((groups, product) => {
    const brand = product.brand || 'OUTROS';
    if (!groups[brand]) {
      groups[brand] = [];
    }
    groups[brand].push(product);
    return groups;
  }, {} as Record<string, Product[]>);

  // Ordena as marcas por quantidade de produtos
  const sortedBrands = Object.entries(groupedProducts)
    .sort(([,a], [,b]) => b.length - a.length);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-50 border rounded-lg">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-hidden"
                  checked={showHidden}
                  onCheckedChange={setShowHidden}
                />
                <Label htmlFor="show-hidden" className="font-medium">Mostrar apenas ocultados</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-unconfirmed"
                  checked={showUnconfirmed}
                  onCheckedChange={setShowUnconfirmed}
                />
                <Label htmlFor="show-unconfirmed" className="font-medium">Mostrar apenas não confirmados</Label>
              </div>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Legenda:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Alta Confiança ≥ 80%
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Média Confiança ≥ 60%
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                Baixa Confiança &lt; 60%
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {sortedBrands.map(([brand, brandProducts]) => {
        const filteredProducts = filterProducts(brandProducts);
        if (filteredProducts.length === 0) return null;

        return (
          <div key={brand} className="bg-white rounded-lg shadow-sm">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">
                {brand} 
                <span className="ml-2 text-sm text-slate-500">
                  ({filteredProducts.length} produtos)
                </span>
              </h3>
            </div>
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

                  const confidenceClass = product.brandConfidence >= 0.8 
                    ? 'bg-green-50/50' 
                    : product.brandConfidence >= 0.6 
                      ? 'bg-yellow-50/50' 
                      : 'bg-red-50/50';

                  return (
                    <TableRow 
                      key={`${product.code}-${productIndex}`}
                      className={`
                        hover:bg-slate-100 transition-colors
                        ${confidenceClass}
                      `}
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
        );
      })}
    </div>
  );
};
