
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Image as ImageIcon, Search, Download } from "lucide-react";
import { Product } from '../../types/nfe';
import { Column } from './types/column';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { Input } from "@/components/ui/input";

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
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const openGoogleSearch = (product: Product) => {
    const searchTerms = `${product.ean || ''} ${product.reference || ''} ${product.code || ''}`.trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&tbm=isch`, '_blank');
  };

  return (
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
                  column.id === 'xapuriPrice' ? 'bg-blue-50 text-blue-700' : ''
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
          const baseXapuriPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, xapuriMarkup);
          const baseEpitaPrice = calculateSalePrice({ ...product, netPrice: unitNetPrice }, epitaMarkup);
          
          const xapuriPrice = roundPrice(baseXapuriPrice, roundingType);
          const epitaPrice = roundPrice(baseEpitaPrice, roundingType);

          const isSelected = selectedProductIndex === index;

          return (
            <React.Fragment key={product.code}>
              <TableRow 
                className={`
                  ${index % 2 === 0 ? 'bg-slate-50/50' : ''}
                  hover:bg-slate-100 transition-colors
                `}
              >
                {visibleColumns.has('image') && (
                  <TableCell className="w-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openGoogleSearch(product)}
                      className="w-full"
                      title="Buscar imagem no Google"
                    >
                      <ImageIcon className="w-4 h-4" />
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
                  if (column.id === 'unitPrice') value = product.unitPrice;
                  if (column.id === 'netPrice') value = unitNetPrice;

                  return (
                    <TableCell
                      key={column.id}
                      className={`px-6 py-4 ${
                        column.alignment === 'right' ? 'text-right tabular-nums' : ''
                      } ${
                        column.id === 'xapuriPrice' ? 'bg-blue-50' : ''
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
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
