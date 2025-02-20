
import React, { useEffect } from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Product } from '../../types/nfe';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CORES_OPCOES } from '../../utils/colorParser';
import { calculateSalePrice, roundPrice } from './productCalculations';

interface ProductTableRowProps {
  product: Product;
  index: number;
  editable: boolean;
  onUpdate: (index: number, field: keyof Product, value: any) => void;
  units: string[];
  globalMarkup: number;
  roundingType: '90' | '50';
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
    if (product.useMarkup) {
      const newSalePrice = roundPrice(calculateSalePrice(product, globalMarkup), roundingType);
      if (newSalePrice !== product.salePrice) {
        onUpdate(index, 'salePrice', newSalePrice);
      }
    }
  }, [globalMarkup, product.useMarkup, roundingType]);

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
      <TableCell>
        {editable ? (
          <Select
            value={product.uom}
            onValueChange={(value) => onUpdate(index, 'uom', value)}
          >
            <SelectTrigger className="w-[100px] border-blue-200">
              <SelectValue placeholder="UN" />
            </SelectTrigger>
            <SelectContent>
              {units.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          product.uom
        )}
      </TableCell>
      <TableCell className="text-right">{formatNumber(product.quantity)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.unitPrice)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.totalPrice)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.discount)}</TableCell>
      <TableCell className="text-right">{formatCurrency(product.netPrice)}</TableCell>
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
      <TableCell className="text-center">
        {editable && (
          <Checkbox
            checked={product.useMarkup}
            onCheckedChange={(checked) => {
              onUpdate(index, 'useMarkup', checked);
              if (checked) {
                const newSalePrice = roundPrice(calculateSalePrice({...product, useMarkup: true}, globalMarkup), roundingType);
                onUpdate(index, 'salePrice', newSalePrice);
              }
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        {editable ? (
          <Input
            type="number"
            value={product.salePrice || 0}
            onChange={(e) => onUpdate(index, 'salePrice', parseFloat(e.target.value) || 0)}
            className="w-full border-blue-200 focus:border-blue-400"
          />
        ) : (
          formatCurrency(product.salePrice || 0)
        )}
      </TableCell>
    </TableRow>
  );
};
