
import React, { useEffect } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Product } from '../../types/nfe';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CORES_OPCOES } from '../../utils/colorParser';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';

interface ProductTableRowProps {
  product: Product;
  index: number;
  editable: boolean;
  onUpdate: (index: number, field: keyof Product, value: any) => void;
  units: string[];
  globalMarkup: number;
  roundingType: RoundingType;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  index,
  editable,
  onUpdate,
  units,
  globalMarkup,
  roundingType
}) => {
  useEffect(() => {
    const newSalePrice = roundPrice(calculateSalePrice(product, globalMarkup), roundingType);
    if (newSalePrice !== product.salePrice) {
      onUpdate(index, 'salePrice', newSalePrice);
    }
  }, [globalMarkup, roundingType, product.netPrice]);

  // Calcula valores unitários
  const unitNetPrice = product.quantity > 0 ? product.netPrice / product.quantity : 0;
  
  // Calcula o preço de venda unitário considerando markup e arredondamento
  const unitSalePrice = product.quantity > 0 ? 
    roundPrice(calculateSalePrice({ ...product, netPrice: unitNetPrice }, globalMarkup), roundingType) : 0;

  return (
    <TableRow className="hover:bg-slate-50">
      <TableCell>{product.code || '-'}</TableCell>
      <TableCell>{product.ean || '-'}</TableCell>
      <TableCell>
        {editable ? (
          <Input
            value={product.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            className="w-full border-blue-200 focus:border-blue-400"
          />
        ) : (
          product.name
        )}
      </TableCell>
      <TableCell>{product.ncm || '-'}</TableCell>
      <TableCell>{product.cfop || '-'}</TableCell>
      <TableCell>{product.uom || '-'}</TableCell>
      <TableCell className="text-right">{formatNumber(product.quantity)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.totalPrice)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.discount)}</TableCell>
      <TableCell className="text-right">{formatCurrency(unitNetPrice)}</TableCell>
      <TableCell>
        {editable ? (
          <Select
            value={product.color || '_OTHER_'}
            onValueChange={(value) => onUpdate(index, 'color', value === '_OTHER_' ? '' : value)}
          >
            <SelectTrigger className="w-full border-blue-200">
              <SelectValue placeholder="Selecione uma cor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_OTHER_">Outra cor...</SelectItem>
              {CORES_OPCOES.map((cor) => (
                <SelectItem key={cor.value} value={cor.value}>
                  {cor.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          product.color
        )}
      </TableCell>
      <TableCell className="text-right min-w-[120px]">
        {formatCurrency(unitSalePrice)}
      </TableCell>
    </TableRow>
  );
};
