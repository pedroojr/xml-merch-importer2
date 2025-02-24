
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Product } from '../../types/nfe';
import { formatCurrency } from '../../utils/formatters';
import { GlobalControls } from './GlobalControls';
import { ProductTableRow } from './ProductTableRow';
import { calculateSalePrice, roundPrice, calculateTotals } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  products, 
  onProductUpdate, 
  editable = false 
}) => {
  const [globalMarkup, setGlobalMarkup] = useState(30);
  const [xapuriMarkup, setXapuriMarkup] = useState(35); // Markup específico para Xapuri
  const [roundingType, setRoundingType] = useState<'90' | '50'>('90');
  const [confirmedItems, setConfirmedItems] = useState<Set<number>>(new Set());

  const totals = calculateTotals(products);
  const totalItems = products.reduce((acc, product) => acc + product.quantity, 0);

  const handleGlobalMarkupChange = (value: number) => {
    setGlobalMarkup(value);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      const newProduct = { ...product };
      newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, value), roundingType);
      onProductUpdate(index, newProduct);
    });
  };

  const handleXapuriMarkupChange = (value: number) => {
    setXapuriMarkup(value);
  };

  const handleGlobalRoundingChange = (type: '90' | '50') => {
    setRoundingType(type);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      const newProduct = { ...product };
      newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, newProduct.markup), type);
      onProductUpdate(index, newProduct);
    });
  };

  const handleConfirmItem = (index: number) => {
    const newConfirmedItems = new Set(confirmedItems);
    newConfirmedItems.add(index);
    setConfirmedItems(newConfirmedItems);
    toast.success('Item confirmado com sucesso!');
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
      <GlobalControls
        markup={globalMarkup}
        roundingType={roundingType}
        onMarkupChange={handleGlobalMarkupChange}
        onRoundingChange={handleGlobalRoundingChange}
      />

      <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
        <Tabs defaultValue="complete" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="complete">Visão Completa</TabsTrigger>
            <TabsTrigger value="unit">Valores Unitários</TabsTrigger>
          </TabsList>

          <TabsContent value="complete">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-24 font-semibold">Código</TableHead>
                  <TableHead className="w-32 font-semibold">EAN</TableHead>
                  <TableHead className="min-w-[400px] font-semibold">Descrição</TableHead>
                  <TableHead className="w-28 font-semibold">NCM</TableHead>
                  <TableHead className="w-24 font-semibold">CFOP</TableHead>
                  <TableHead className="w-32 font-semibold">Unidade</TableHead>
                  <TableHead className="w-24 font-semibold text-right">Qtd.</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Valor Un.</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Valor Bruto</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Desconto</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Valor Líquido</TableHead>
                  <TableHead className="w-40 font-semibold">Cor</TableHead>
                  <TableHead className="w-40 font-semibold text-right">Preço Venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => (
                  <ProductTableRow
                    key={product.code}
                    product={product}
                    index={index}
                    editable={editable}
                    onUpdate={handleUpdate}
                    units={product.uom ? [product.uom] : []}
                    globalMarkup={globalMarkup}
                    roundingType={roundingType}
                  />
                ))}
                <TableRow className="bg-slate-100 font-semibold">
                  <TableCell colSpan={6}>Totais</TableCell>
                  <TableCell className="text-right">{totalItems}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.totalBruto)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.totalLiquido)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="unit">
            <div className="p-4 border-b bg-slate-50">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">
                  Markup Xapuri (%)
                </label>
                <input
                  type="number"
                  value={xapuriMarkup}
                  onChange={(e) => handleXapuriMarkupChange(Number(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-32 font-semibold">EAN</TableHead>
                  <TableHead className="min-w-[400px] font-semibold">Descrição</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Valor Un.</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Desconto Un.</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Valor Líq. Un.</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Preço Venda</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Markup Xapuri</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Preço Xapuri</TableHead>
                  <TableHead className="w-24 font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, index) => {
                  const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
                  const unitDiscount = product.quantity > 0 ? product.discount / product.quantity : 0;
                  const unitSalePrice = product.quantity > 0 ? 
                    roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, globalMarkup), roundingType) : 0;
                  const xapuriPrice = product.quantity > 0 ? 
                    roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup), roundingType) : 0;

                  return (
                    <TableRow key={product.code} className="hover:bg-slate-50">
                      <TableCell>{product.ean || '-'}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(unitDiscount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(unitNetPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(unitSalePrice)}</TableCell>
                      <TableCell className="text-right">{xapuriMarkup}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(xapuriPrice)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={confirmedItems.has(index) ? "text-green-600" : ""}
                          onClick={() => handleConfirmItem(index)}
                          disabled={confirmedItems.has(index)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductPreview;
