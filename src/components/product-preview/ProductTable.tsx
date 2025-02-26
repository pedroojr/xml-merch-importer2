
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Image as ImageIcon, Copy, Check, GripVertical } from "lucide-react";
import { Product } from '../../types/nfe';
import { Column } from './types/column';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { toast } from "sonner";
import { formatNumberForCopy } from '../../utils/formatters';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { extrairTamanhoDaDescricao, extrairTamanhoDaReferencia } from '../../utils/sizeParser';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

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
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('columnWidths');
    return saved ? JSON.parse(saved) : {};
  });

  const handleColumnResize = (columnId: string, width: number) => {
    const newWidths = { ...columnWidths, [columnId]: width };
    setColumnWidths(newWidths);
    localStorage.setItem('columnWidths', JSON.stringify(newWidths));
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

  const filteredProducts = products.filter(product => {
    const isItemHidden = hiddenItems.has(products.indexOf(product));
    return showHidden ? isItemHidden : !isItemHidden;
  });

  return (
    <div className="w-full space-y-4">
      <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-hidden"
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
            <Label htmlFor="show-hidden" className="text-sm font-medium">
              Mostrar apenas ocultados
            </Label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-white/50">
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Quantidade</div>
                <div className="text-sm font-medium">{products.length} itens</div>
              </CardContent>
            </Card>
            <Card className="bg-white/50">
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Valor Total</div>
                <div className="text-sm font-medium tabular-nums">{products.reduce((acc, p) => acc + p.totalPrice, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/50">
              <CardContent className="p-3">
                <div className="text-xs font-medium text-muted-foreground">Valor Líquido</div>
                <div className="text-sm font-medium tabular-nums">{products.reduce((acc, p) => acc + p.netPrice, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              {columns.map((column) => (
                visibleColumns.has(column.id) && (
                  <TableHead
                    key={column.id}
                    className={cn(
                      "h-9 px-3 text-xs font-medium select-none group",
                      column.alignment === 'right' && "text-right",
                      column.id === 'xapuriPrice' && "bg-blue-50/50 text-blue-700",
                      column.id === 'epitaPrice' && "bg-emerald-50/50 text-emerald-700"
                    )}
                    style={{ width: columnWidths[column.id] || column.minWidth }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.header}</span>
                      <ResizableBox
                        width={columnWidths[column.id] || column.minWidth || 100}
                        height={0}
                        minConstraints={[column.minWidth || 100, 0]}
                        maxConstraints={[1000, 0]}
                        onResizeStop={(e, { size }) => handleColumnResize(column.id, size.width)}
                        handle={<GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-100 cursor-col-resize" />}
                        axis="x"
                      />
                    </div>
                  </TableHead>
                )
              ))}
              <TableHead className="w-12 text-center text-xs font-medium">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => {
              const isHidden = hiddenItems.has(index);
              if (showHidden ? !isHidden : isHidden) return null;

              const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
              const xapuriPrice = roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup), roundingType);
              const epitaPrice = roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup), roundingType);
              
              const tamanhoReferencia = extrairTamanhoDaReferencia(product.reference);
              const tamanhoDescricao = extrairTamanhoDaDescricao(product.name);
              const tamanho = tamanhoReferencia || tamanhoDescricao || '';

              return (
                <TableRow 
                  key={`${product.code}-${index}`}
                  className={cn(
                    "h-10 hover:bg-slate-50/80 transition-colors",
                    isHidden && "opacity-60"
                  )}
                >
                  {visibleColumns.has('image') && (
                    <TableCell className="w-12 p-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleImageSearch(index, product)}
                        className="h-10 w-full rounded-none"
                      >
                        <ImageIcon className="h-4 w-4" />
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

                    const copyId = `${column.id}-${index}`;
                    const isCopied = copiedField === copyId;

                    return (
                      <TableCell
                        key={column.id}
                        className={cn(
                          column.width,
                          "px-3 group relative cursor-pointer text-sm",
                          column.id === 'name' && "break-words whitespace-normal",
                          column.alignment === 'right' && "text-right tabular-nums",
                          column.id === 'xapuriPrice' && "bg-blue-50/50",
                          column.id === 'epitaPrice' && "bg-emerald-50/50"
                        )}
                        onClick={() => handleCopyToClipboard(value, column, copyId)}
                      >
                        <div className={cn(
                          "flex items-center gap-1",
                          column.alignment === 'right' ? "justify-end" : "justify-between"
                        )}>
                          <span className={cn(
                            column.id === 'name' ? "whitespace-normal" : "truncate",
                            column.alignment === 'right' ? "ml-auto" : "mr-auto"
                          )}>
                            {column.format ? column.format(value) : value}
                          </span>
                          <span className={cn(
                            "transition-opacity flex-shrink-0",
                            isCopied ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          )}>
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="w-12 p-0 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(index)}
                      className="h-10 w-full rounded-none"
                    >
                      {isHidden ? (
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
