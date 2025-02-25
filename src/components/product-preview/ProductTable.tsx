
import React, { useState, useEffect } from 'react';
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

  const handleSearchClick = async (product: Product) => {
    setLoading(true);
    // Simular resultados de busca com placeholder
    // Na vida real, isso viria de uma API de busca de imagens
    setSearchResults([
      'https://picsum.photos/200/200?random=1',
      'https://picsum.photos/200/200?random=2',
      'https://picsum.photos/200/200?random=3',
      'https://picsum.photos/200/200?random=4',
      'https://picsum.photos/200/200?random=5',
      'https://picsum.photos/200/200?random=6'
    ]);
    setLoading(false);
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
                      onClick={() => setSelectedProductIndex(isSelected ? null : index)}
                      className="w-full"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
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
                      onClick={() => {
                        setSelectedProductIndex(isSelected ? null : index);
                        if (!isSelected) handleSearchClick(product);
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
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
              {isSelected && (
                <TableRow>
                  <TableCell colSpan={columns.filter(col => visibleColumns.has(col.id)).length + 1}>
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">{product.name}</h3>
                        <Button
                          variant="outline"
                          onClick={() => handleSearchClick(product)}
                          className="gap-2"
                        >
                          <Search className="h-4 w-4" />
                          Buscar Imagens
                        </Button>
                      </div>

                      {loading ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          {searchResults.map((url, idx) => (
                            <div key={idx} className="relative group">
                              <img
                                src={url}
                                alt={`Result ${idx + 1}`}
                                className="w-full h-48 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => {
                                    // Aqui você implementaria a lógica para salvar a imagem
                                    console.log('Salvando imagem:', url);
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                  Selecionar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};
