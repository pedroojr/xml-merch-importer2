
import React, { useState } from 'react';
import { Product } from '../../types/nfe';
import { calculateTotals, RoundingType } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MarkupControls } from './MarkupControls';
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ProfitabilityAnalysis } from './insights/ProfitabilityAnalysis';
import { ProductAnalysis } from './insights/ProductAnalysis';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
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

  const columns: Column[] = [
    { id: 'code', header: 'Código', initiallyVisible: true },
    { id: 'ean', header: 'EAN', initiallyVisible: true },
    { id: 'name', header: 'Descrição', initiallyVisible: true },
    { id: 'ncm', header: 'NCM', initiallyVisible: true },
    { id: 'cfop', header: 'CFOP', initiallyVisible: true },
    { id: 'uom', header: 'Unidade', initiallyVisible: true },
    { id: 'quantity', header: 'Quantidade', initiallyVisible: true },
    { id: 'unitPrice', header: 'Valor Unit.', initiallyVisible: true },
    { id: 'totalPrice', header: 'Valor Total', initiallyVisible: true },
    { id: 'discount', header: 'Desconto', initiallyVisible: true },
    { id: 'netPrice', header: 'Valor Líquido', initiallyVisible: true },
    { id: 'xapuriPrice', header: 'Preço Xapuri', initiallyVisible: true },
    { id: 'epitaPrice', header: 'Preço Epitaciolândia', initiallyVisible: true },
    { id: 'color', header: 'Cor', initiallyVisible: true },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.initiallyVisible).map(col => col.id))
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
      <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-4">
                      <Eye className="h-4 w-4 mr-2" />
                      Colunas
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {columns.map((column) => (
                      visibleColumns.has(column.id) && (
                        <TableHead
                          key={column.id}
                          className={`font-semibold ${
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
                      <TableRow key={product.code}>
                        {visibleColumns.has('code') && <td>{product.code}</td>}
                        {visibleColumns.has('ean') && <td>{product.ean}</td>}
                        {visibleColumns.has('name') && <td>{product.name}</td>}
                        {visibleColumns.has('ncm') && <td>{product.ncm}</td>}
                        {visibleColumns.has('cfop') && <td>{product.cfop}</td>}
                        {visibleColumns.has('uom') && <td>{product.uom}</td>}
                        {visibleColumns.has('quantity') && (
                          <td className="text-right">{product.quantity}</td>
                        )}
                        {visibleColumns.has('unitPrice') && (
                          <td className="text-right">{product.unitPrice}</td>
                        )}
                        {visibleColumns.has('totalPrice') && (
                          <td className="text-right">{product.totalPrice}</td>
                        )}
                        {visibleColumns.has('discount') && (
                          <td className="text-right">{product.discount}</td>
                        )}
                        {visibleColumns.has('netPrice') && (
                          <td className="text-right">{unitNetPrice}</td>
                        )}
                        {visibleColumns.has('xapuriPrice') && (
                          <td className="text-right">{xapuriPrice}</td>
                        )}
                        {visibleColumns.has('epitaPrice') && (
                          <td className="text-right bg-emerald-50">{epitaPrice}</td>
                        )}
                        {visibleColumns.has('color') && <td>{product.color}</td>}
                        <td>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleVisibility(index)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
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
