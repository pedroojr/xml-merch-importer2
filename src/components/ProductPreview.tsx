
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from '../types/nfe';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
}

const UNITS = [
  'UN', 'PC', 'CX', 'KG', 'L', 'M', 'M2', 'M3', 'PAR',
  'PCT', 'ROL', 'TON', 'CM', 'DZ', 'G', 'ML'
];

const ProductPreview: React.FC<ProductPreviewProps> = ({ products, onProductUpdate, editable = false }) => {
  const totals = products.reduce((acc, product) => ({
    totalBruto: acc.totalBruto + product.totalPrice,
    totalDesconto: acc.totalDesconto + product.discount,
    totalLiquido: acc.totalLiquido + product.netPrice,
  }), {
    totalBruto: 0,
    totalDesconto: 0,
    totalLiquido: 0,
  });

  const calculateSalePrice = (product: Product) => {
    if (!product.useMarkup) return product.netPrice;
    const markupMultiplier = 1 + (product.markup || 0) / 100;
    return product.netPrice * markupMultiplier;
  };

  const roundPrice = (price: number, type: '90' | '50') => {
    const integer = Math.floor(price);
    return type === '90' ? integer + 0.90 : Math.round(price / 0.5) * 0.5;
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
      case 'useMarkup':
        product.useMarkup = value as boolean;
        if (product.useMarkup) {
          product.salePrice = calculateSalePrice(product);
        }
        break;
      case 'markup':
        product.markup = parseFloat(value) || 0;
        if (product.useMarkup) {
          product.salePrice = calculateSalePrice(product);
        }
        break;
      case 'salePrice':
        product.salePrice = parseFloat(value) || 0;
        break;
    }

    onProductUpdate(index, product);
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Código</TableHead>
            <TableHead className="font-semibold">EAN</TableHead>
            <TableHead className="font-semibold">Descrição</TableHead>
            <TableHead className="font-semibold">NCM</TableHead>
            <TableHead className="font-semibold">CFOP</TableHead>
            <TableHead className="font-semibold">Unidade</TableHead>
            <TableHead className="font-semibold text-right">Qtd.</TableHead>
            <TableHead className="font-semibold text-right">Valor Un.</TableHead>
            <TableHead className="font-semibold text-right">Valor Bruto</TableHead>
            <TableHead className="font-semibold text-right">Desconto</TableHead>
            <TableHead className="font-semibold text-right">Valor Líquido</TableHead>
            <TableHead className="font-semibold">Cor</TableHead>
            <TableHead className="font-semibold text-center">Markup</TableHead>
            <TableHead className="font-semibold text-right">Preço Venda</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.code} className="hover:bg-slate-50">
              <TableCell>{product.code || '-'}</TableCell>
              <TableCell>{product.ean || '-'}</TableCell>
              <TableCell className="max-w-md">
                {editable ? (
                  <Input
                    value={product.name}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    className="w-full"
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
                    onValueChange={(value) => handleUpdate(index, 'uom', value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="UN" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
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
              <TableCell>{product.color}</TableCell>
              <TableCell>
                {editable && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={product.useMarkup}
                      onCheckedChange={(checked) => handleUpdate(index, 'useMarkup', checked)}
                    />
                    <Input
                      type="number"
                      value={product.markup || 0}
                      onChange={(e) => handleUpdate(index, 'markup', e.target.value)}
                      className="w-20"
                      disabled={!product.useMarkup}
                    />
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editable ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={product.salePrice || 0}
                      onChange={(e) => handleUpdate(index, 'salePrice', e.target.value)}
                      className="w-24"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleUpdate(index, 'salePrice', roundPrice(product.salePrice || 0, '90'))}
                        className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        .90
                      </button>
                      <button
                        onClick={() => handleUpdate(index, 'salePrice', roundPrice(product.salePrice || 0, '50'))}
                        className="text-xs bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        .50
                      </button>
                    </div>
                  </div>
                ) : (
                  formatCurrency(product.salePrice || 0)
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-slate-100 font-semibold">
            <TableCell colSpan={8}>Totais</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalBruto)}</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalDesconto)}</TableCell>
            <TableCell className="text-right">{formatCurrency(totals.totalLiquido)}</TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductPreview;
