
import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from '../../types/nfe';
import { formatCurrency } from '../../utils/formatters';
import { calculateSalePrice, roundPrice } from './productCalculations';

interface UnitValuesTableProps {
  products: Product[];
  xapuriMarkup: number;
  epitaMarkup: number;
  roundingType: '90' | '50';
  confirmedItems: Set<number>;
  onConfirmItem: (index: number) => void;
}

export const UnitValuesTable: React.FC<UnitValuesTableProps> = ({
  products,
  xapuriMarkup,
  epitaMarkup,
  roundingType,
  confirmedItems,
  onConfirmItem,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead className="w-32 font-semibold">EAN</TableHead>
          <TableHead className="min-w-[400px] font-semibold">Descrição</TableHead>
          <TableHead className="w-32 font-semibold text-right">Valor Un.</TableHead>
          <TableHead className="w-32 font-semibold text-right">Desconto Un.</TableHead>
          <TableHead className="w-32 font-semibold text-right">Valor Líq. Un.</TableHead>
          <TableHead className="w-32 font-semibold text-right">Preço Xapuri</TableHead>
          <TableHead className="w-32 font-semibold text-right">Preço Epitaciolândia</TableHead>
          <TableHead className="w-24 font-semibold text-center">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, index) => {
          const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
          const unitDiscount = product.quantity > 0 ? product.discount / product.quantity : 0;
          const xapuriPrice = product.quantity > 0 ? 
            roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup), roundingType) : 0;
          const epitaPrice = product.quantity > 0 ? 
            roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup), roundingType) : 0;
          const isConfirmed = confirmedItems.has(index);

          return (
            <TableRow 
              key={product.code} 
              className={cn(
                "hover:bg-slate-50 transition-colors",
                isConfirmed && "bg-slate-100"
              )}
            >
              <TableCell>{product.ean || '-'}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(unitDiscount)}</TableCell>
              <TableCell className="text-right">{formatCurrency(unitNetPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(xapuriPrice)}</TableCell>
              <TableCell className="text-right">{formatCurrency(epitaPrice)}</TableCell>
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className={isConfirmed ? "text-green-600" : ""}
                  onClick={() => onConfirmItem(index)}
                  disabled={isConfirmed}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
