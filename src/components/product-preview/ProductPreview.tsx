import React, { useState } from 'react';
import { Product } from '../../types/nfe';
import { calculateTotals, calculateSalePrice, RoundingType } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MarkupControls } from './MarkupControls';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { ProfitabilityAnalysis } from './insights/ProfitabilityAnalysis';
import { ProductAnalysis } from './insights/ProductAnalysis';
import { Button } from "@/components/ui/button";
import { Eye, Columns, EyeOff } from "lucide-react";
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
}

interface Column {
  id: string;
  header: string;
  initiallyVisible: boolean;
  alignment?: 'left' | 'right';
  format?: (value: any) => string;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  products, 
  onProductUpdate, 
  editable = false 
}) => {
  const [xapuriMarkup, setXapuriMarkup] = useState(35);
  const [epitaMarkup, setEpitaMarkup] = useState(40);
  const [roundingType, setRoundingType] = useState<RoundingType>('90');
  const [confirmedItems, setConfirmedItems] = useState<Set<number>>(new Set());
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());
  const [compactMode, setCompactMode] = useState(false);

  const columns: Column[] = [
    { id: 'code', header: 'Código', initiallyVisible: true },
    { id: 'ean', header: 'EAN', initiallyVisible: false },
    { id: 'name', header: 'Descrição', initiallyVisible: true },
    { id: 'ncm', header: 'NCM', initiallyVisible: false },
    { id: 'cfop', header: 'CFOP', initiallyVisible: false },
    { id: 'uom', header: 'Unidade', initiallyVisible: true },
    { 
      id: 'quantity', 
      header: 'Quantidade', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatNumber
    },
    { 
      id: 'unitPrice', 
      header: 'Valor Unit.', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { 
      id: 'totalPrice', 
      header: 'Valor Total', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { 
      id: 'discount', 
      header: 'Desconto', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { 
      id: 'netPrice', 
      header: 'Valor Líquido', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { 
      id: 'xapuriPrice', 
      header: 'Preço Xapuri', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { 
      id: 'epitaPrice', 
      header: 'Preço Epitaciolândia', 
      initiallyVisible: true, 
      alignment: 'right',
      format: formatCurrency
    },
    { id: 'color', header: 'Cor', initiallyVisible: false },
  ];

  const defaultVisibleColumns = compactMode ? 
    ['code', 'name', 'quantity', 'unitPrice', 'totalPrice'] :
    columns.filter(col => col.initiallyVisible).map(col => col.id);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(defaultVisibleColumns)
  );

  const toggleColumn = (columnId: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnId)) {
      newVisibleColumns.delete(columnId);
    } else {
      newVisibleColumns.add(columnId);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const toggleCompactMode = () => {
    setCompactMode(!compactMode);
    setVisibleColumns(new Set(compactMode ? 
      columns.filter(col => col.initiallyVisible).map(col => col.id) :
      ['code', 'name', 'quantity', 'unitPrice', 'totalPrice']
    ));
  };

  const handleXapuriMarkupChange = (value: number) => {
    setXapuriMarkup(value);
  };

  const handleEpitaMarkupChange = (value: number) => {
    setEpitaMarkup(value);
  };

  const handleRoundingChange = (value: RoundingType) => {
    setRoundingType(value);
  };

  const handleConfirmItem = (index: number) => {
    const newConfirmedItems = new Set(confirmedItems);
    newConfirmedItems.add(index);
    setConfirmedItems(newConfirmedItems);
    toast.success('Item confirmado com sucesso!');
  };

  const handleToggleVisibility = (index: number) => {
    const newHiddenItems = new Set(hiddenItems);
    if (newHiddenItems.has(index)) {
      newHiddenItems.delete(index);
      toast.success('Item exibido novamente');
    } else {
      newHiddenItems.add(index);
      toast.success('Item ocultado');
    }
    setHiddenItems(newHiddenItems);
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
      case 'salePrice':
        product.salePrice = parseFloat(value) || 0;
        break;
    }

    onProductUpdate(index, product);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-sm animate-fade-up">
        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="unified">Visão Unificada</TabsTrigger>
            <TabsTrigger value="insights">Insights e Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="relative">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <MarkupControls
                  xapuriMarkup={xapuriMarkup}
                  epitaMarkup={epitaMarkup}
                  roundingType={roundingType}
                  onXapuriMarkupChange={handleXapuriMarkupChange}
                  onEpitaMarkupChange={handleEpitaMarkupChange}
                  onRoundingChange={handleRoundingChange}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleCompactMode}
                  >
                    {compactMode ? 'Modo Detalhado' : 'Modo Compacto'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="min-w-[160px]">
                        <Columns className="h-4 w-4 mr-2" />
                        Personalizar Visão
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {columns.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={visibleColumns.has(column.id)}
                          onCheckedChange={() => toggleColumn(column.id)}
                        >
                          {column.header}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {columns.map((column) => (
                      visibleColumns.has(column.id) && (
                        <TableHead
                          key={column.id}
                          className={`font-semibold px-6 ${
                            column.alignment === 'right' ? 'text-right' : ''
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
                  {products.map((product, index) => {
                    if (hiddenItems.has(index)) return null;

                    const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
                    const xapuriPrice = product.quantity > 0 ? 
                      calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup) : 0;
                    const epitaPrice = product.quantity > 0 ? 
                      calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup) : 0;

                    return (
                      <TableRow 
                        key={product.code}
                        className={`
                          ${index % 2 === 0 ? 'bg-slate-50/50' : ''}
                          hover:bg-slate-100 transition-colors
                        `}
                      >
                        {columns.map((column) => {
                          if (!visibleColumns.has(column.id)) return null;

                          let value = product[column.id as keyof Product];
                          if (column.id === 'xapuriPrice') value = xapuriPrice;
                          if (column.id === 'epitaPrice') value = epitaPrice;
                          if (column.id === 'unitPrice') value = product.unitPrice;
                          if (column.id === 'netPrice') value = unitNetPrice;

                          return (
                            <TableCell
                              key={column.id}
                              className={`px-6 py-4 ${
                                column.alignment === 'right' ? 'text-right tabular-nums' : ''
                              } ${
                                column.id === 'epitaPrice' ? 'bg-emerald-50' : ''
                              }`}
                            >
                              {column.format ? column.format(value) : value}
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-6">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVisibility(index)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-8 p-6">
            <ProfitabilityAnalysis
              products={products}
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
            />
            <ProductAnalysis products={products} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductPreview;
