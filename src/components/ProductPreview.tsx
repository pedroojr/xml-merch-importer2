
import React, { useState } from 'react';
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
import { CORES_OPCOES } from '../utils/colorParser';

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
  const [globalMarkup, setGlobalMarkup] = useState(30);
  const [roundingType, setRoundingType] = useState<'90' | '50'>('90');

  const totals = products.reduce((acc, product) => ({
    totalBruto: acc.totalBruto + product.totalPrice,
    totalDesconto: acc.totalDesconto + product.discount,
    totalLiquido: acc.totalLiquido + product.netPrice,
  }), {
    totalBruto: 0,
    totalDesconto: 0,
    totalLiquido: 0,
  });

  const calculateSalePrice = (product: Product, markup: number) => {
    if (!product.useMarkup) return product.netPrice;
    const markupMultiplier = 1 + markup / 100;
    return product.netPrice * markupMultiplier;
  };

  const roundPrice = (price: number, type: '90' | '50') => {
    const integer = Math.floor(price);
    return type === '90' ? integer + 0.90 : Math.round(price / 0.5) * 0.5;
  };

  const handleGlobalMarkupChange = (value: number) => {
    setGlobalMarkup(value);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      if (product.useMarkup) {
        const newProduct = { ...product };
        newProduct.markup = value;
        newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, value), roundingType);
        onProductUpdate(index, newProduct);
      }
    });
  };

  const handleGlobalRoundingChange = (type: '90' | '50') => {
    setRoundingType(type);
    if (!onProductUpdate) return;

    products.forEach((product, index) => {
      if (product.useMarkup) {
        const newProduct = { ...product };
        newProduct.salePrice = roundPrice(calculateSalePrice(newProduct, newProduct.markup), type);
        onProductUpdate(index, newProduct);
      }
    });
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
        product.markup = globalMarkup;
        if (product.useMarkup) {
          product.salePrice = roundPrice(calculateSalePrice(product, globalMarkup), roundingType);
        }
        break;
      case 'salePrice':
        product.salePrice = parseFloat(value) || 0;
        break;
    }

    onProductUpdate(index, product);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium">Markup Global (%)</label>
            <Input
              type="number"
              value={globalMarkup}
              onChange={(e) => handleGlobalMarkupChange(parseFloat(e.target.value) || 0)}
              className="w-24"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Arredondamento</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleGlobalRoundingChange('90')}
                className={`px-3 py-1 rounded text-sm ${
                  roundingType === '90' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                .90
              </button>
              <button
                onClick={() => handleGlobalRoundingChange('50')}
                className={`px-3 py-1 rounded text-sm ${
                  roundingType === '50' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                .50
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm animate-fade-up overflow-x-auto">
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
              <TableHead className="w-24 font-semibold text-center">Markup</TableHead>
              <TableHead className="w-40 font-semibold text-right">Preço Venda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.code} className="hover:bg-slate-50">
                <TableCell>{product.code || '-'}</TableCell>
                <TableCell>{product.ean || '-'}</TableCell>
                <TableCell>
                  {editable ? (
                    <Input
                      value={product.name}
                      onChange={(e) => handleUpdate(index, 'name', e.target.value)}
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
                      onValueChange={(value) => handleUpdate(index, 'uom', value)}
                    >
                      <SelectTrigger className="w-[100px] border-blue-200">
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
                <TableCell>
                  {editable ? (
                    <Select
                      value={product.color}
                      onValueChange={(value) => handleUpdate(index, 'color', value)}
                    >
                      <SelectTrigger className="w-full border-blue-200">
                        <SelectValue placeholder="Selecione uma cor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Outra cor...</SelectItem>
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
                      onCheckedChange={(checked) => handleUpdate(index, 'useMarkup', checked)}
                    />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {editable ? (
                    <Input
                      type="number"
                      value={product.salePrice || 0}
                      onChange={(e) => handleUpdate(index, 'salePrice', e.target.value)}
                      className="w-full border-blue-200 focus:border-blue-400"
                    />
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
    </div>
  );
};

export default ProductPreview;
