
import React, { useState, useEffect } from 'react';
import { Product } from '../../types/nfe';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductAnalysis } from './insights/ProductAnalysis';
import { ProfitabilityAnalysis } from './insights/ProfitabilityAnalysis';
import { PricingAnalysis } from './insights/PricingAnalysis';
import { ProductToolbar } from './ProductToolbar';
import { ProductTable } from './ProductTable';
import { getDefaultColumns, compactColumns } from './types/column';
import FileUpload from '../FileUpload';

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
  onConfigurationUpdate?: (xapuriMarkup: number, epitaMarkup: number, roundingType: string) => void;
  onNewFile?: (products: Product[]) => void;
  hiddenItems?: Set<number>;
  onToggleVisibility?: (index: number) => void;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  products, 
  onProductUpdate, 
  editable = false,
  onConfigurationUpdate,
  onNewFile,
  hiddenItems = new Set(),
  onToggleVisibility
}) => {
  const [xapuriMarkup, setXapuriMarkup] = useState(() => {
    const saved = localStorage.getItem('xapuriMarkup');
    return saved ? Number(saved) : 120;
  });

  const [epitaMarkup, setEpitaMarkup] = useState(() => {
    const saved = localStorage.getItem('epitaMarkup');
    return saved ? Number(saved) : 140;
  });

  const [roundingType, setRoundingType] = useState<RoundingType>(() => {
    const saved = localStorage.getItem('roundingType');
    return (saved as RoundingType) || '90';
  });

  const [localHiddenItems, setLocalHiddenItems] = useState<Set<number>>(hiddenItems);
  const [compactMode, setCompactMode] = useState(() => {
    const saved = localStorage.getItem('compactMode');
    return saved ? JSON.parse(saved) : false;
  });

  const columns = getDefaultColumns();
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('visibleColumns');
    if (saved) {
      const parsedColumns = JSON.parse(saved) as string[];
      return new Set(parsedColumns);
    }
    return new Set(compactMode ? compactColumns : columns.map(col => col.id));
  });

  // Atualizar o estado local quando as props mudarem
  useEffect(() => {
    setLocalHiddenItems(hiddenItems);
  }, [hiddenItems]);

  useEffect(() => {
    localStorage.setItem('xapuriMarkup', xapuriMarkup.toString());
    localStorage.setItem('epitaMarkup', epitaMarkup.toString());
    localStorage.setItem('roundingType', roundingType);
    localStorage.setItem('compactMode', JSON.stringify(compactMode));
  }, [xapuriMarkup, epitaMarkup, roundingType, compactMode]);

  const handleMarkupChange = (xapuri: number, epita: number, rounding: RoundingType) => {
    setXapuriMarkup(xapuri);
    setEpitaMarkup(epita);
    setRoundingType(rounding);
    onConfigurationUpdate?.(xapuri, epita, rounding);
  };

  const handleImageSearch = async (index: number, product: Product) => {
    const searchTerms = `${product.ean} ${product.code} ${product.name}`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(searchTerms)}&tbm=isch`, '_blank');
  };

  const toggleColumn = (columnId: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnId)) {
      newVisibleColumns.delete(columnId);
    } else {
      newVisibleColumns.add(columnId);
    }
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('visibleColumns', JSON.stringify(Array.from(newVisibleColumns)));
  };

  const toggleCompactMode = () => {
    const newMode = !compactMode;
    setCompactMode(newMode);
    const newColumns = new Set(newMode ? compactColumns : columns.map(col => col.id));
    setVisibleColumns(newColumns);
    localStorage.setItem('visibleColumns', JSON.stringify(Array.from(newColumns)));
  };

  const handleToggleVisibility = (index: number) => {
    // Usar a função de callback prop se fornecida, caso contrário usar a local
    if (onToggleVisibility) {
      onToggleVisibility(index);
    } else {
      const newHiddenItems = new Set(localHiddenItems);
      if (newHiddenItems.has(index)) {
        newHiddenItems.delete(index);
        toast.success('Item exibido novamente');
      } else {
        newHiddenItems.add(index);
        toast.success('Item ocultado');
      }
      setLocalHiddenItems(newHiddenItems);
    }
  };

  const handleNewFileRequest = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xml';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          onNewFile?.(products);
          toast.success('Nova nota carregada com sucesso');
        } catch (error) {
          toast.error('Erro ao carregar nova nota');
        }
      }
    };
    fileInput.click();
  };

  // Determinar qual conjunto de itens ocultos usar
  const effectiveHiddenItems = onToggleVisibility ? hiddenItems : localHiddenItems;

  return (
    <div className="w-full max-w-full flex-1">
      <div className="rounded-lg border bg-white shadow-sm">
        <Tabs defaultValue="unified" className="w-full">
          <div className="sticky top-0 z-10 bg-white border-b">
            <TabsList className="w-full justify-start rounded-none border-0">
              <TabsTrigger value="unified">Visão Unificada</TabsTrigger>
              <TabsTrigger value="insights">Insights e Análises</TabsTrigger>
              <TabsTrigger value="pricing">Precificação Estratégica</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unified" className="p-0 w-full">
            <ProductToolbar
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              roundingType={roundingType}
              onXapuriMarkupChange={(value) => handleMarkupChange(value, epitaMarkup, roundingType)}
              onEpitaMarkupChange={(value) => handleMarkupChange(xapuriMarkup, value, roundingType)}
              onRoundingChange={(value) => handleMarkupChange(xapuriMarkup, epitaMarkup, value)}
              compactMode={compactMode}
              toggleCompactMode={toggleCompactMode}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onNewFileRequest={handleNewFileRequest}
            />

            <ProductTable
              products={products}
              visibleColumns={visibleColumns}
              columns={columns}
              hiddenItems={effectiveHiddenItems}
              handleToggleVisibility={handleToggleVisibility}
              handleImageSearch={handleImageSearch}
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              roundingType={roundingType}
            />
          </TabsContent>

          <TabsContent value="insights" className="p-4">
            <div className="space-y-8 w-full">
              <ProfitabilityAnalysis
                products={products}
                xapuriMarkup={xapuriMarkup}
                epitaMarkup={epitaMarkup}
              />
              <ProductAnalysis products={products} />
            </div>
          </TabsContent>
          
          <TabsContent value="pricing" className="p-4">
            <div className="space-y-8 w-full">
              <PricingAnalysis
                products={products}
                xapuriMarkup={xapuriMarkup}
                epitaMarkup={epitaMarkup}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductPreview;
