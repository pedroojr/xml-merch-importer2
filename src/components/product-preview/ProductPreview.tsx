import React, { useState } from 'react';
import { Product } from '../../types/nfe';
import { calculateTotals } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MarkupControls } from './MarkupControls';
import { UnitValuesTable } from './UnitValuesTable';
import { ProductTableRow } from './ProductTableRow';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from '../../utils/formatters';
import { Button } from "src/components/ui/button"
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [xapuriMarkup, setXapuriMarkup] = useState(35);
  const [epitaMarkup, setEpitaMarkup] = useState(40);
  const [roundingType, setRoundingType] = useState<'90' | '50'>('90');
  const [confirmedItems, setConfirmedItems] = useState<Set<number>>(new Set());

  const totals = calculateTotals(products);
  const totalItems = products.reduce((acc, product) => acc + product.quantity, 0);

  const handleXapuriMarkupChange = (value: number) => {
    setXapuriMarkup(value);
  };

  const handleEpitaMarkupChange = (value: number) => {
    setEpitaMarkup(value);
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
                    globalMarkup={30}
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
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="unit">
            <MarkupControls
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              onXapuriMarkupChange={handleXapuriMarkupChange}
              onEpitaMarkupChange={handleEpitaMarkupChange}
            />
            <UnitValuesTable
              products={products}
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              roundingType={roundingType}
              confirmedItems={confirmedItems}
              onConfirmItem={handleConfirmItem}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductPreview;
