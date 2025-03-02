import React, { useState, useEffect } from 'react';
import { Product } from '../../types/nfe';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductAnalysis } from './insights/ProductAnalysis';
import { ProductToolbar } from './ProductToolbar';
import { ProductTable } from './ProductTable';
import { getDefaultColumns, compactColumns } from './types/column';
import { ProductAnalysisTabs } from './ProductAnalysisTabs';
import SefazIntegration from './SefazIntegration';
import { parseNFeXML } from '../../utils/nfeParser';

interface ProductPreviewProps {
  products: Product[];
  onProductUpdate?: (index: number, product: Product) => void;
  editable?: boolean;
  onConfigurationUpdate?: (xapuriMarkup: number, epitaMarkup: number, roundingType: string) => void;
  onNewFile?: (products: Product[]) => void;
  hiddenItems?: Set<number>;
  onToggleVisibility?: (index: number) => void;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({ 
  products, 
  onProductUpdate, 
  editable = false,
  onConfigurationUpdate,
  onNewFile,
  hiddenItems = new Set(),
  onToggleVisibility
}) => {
  // Calculate suggested markups
  const totalBruto = products.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalLiquido = products.reduce((sum, p) => sum + p.netPrice, 0);
  
  // Markup sugerido para Xapuri (ajustando para custo líquido)
  const precoVendaXapuri = totalBruto * 2.2;
  const xapuriSuggestedMarkup = totalLiquido > 0 ? Math.round(((precoVendaXapuri / totalLiquido) - 1) * 100) : 120;
  
  // Markup sugerido para Epitaciolândia (já está em relação ao custo líquido)
  const epitaSuggestedMarkup = 130; // Equivalente a preço = custo líquido * 2.3

  const [xapuriMarkup, setXapuriMarkup] = useState(() => {
    const saved = localStorage.getItem('xapuriMarkup');
    return saved ? Number(saved) : xapuriSuggestedMarkup;
  });

  const [epitaMarkup, setEpitaMarkup] = useState(() => {
    const saved = localStorage.getItem('epitaMarkup');
    return saved ? Number(saved) : epitaSuggestedMarkup;
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

  const effectiveHiddenItems = onToggleVisibility ? hiddenItems : localHiddenItems;

  const handleNfeLoaded = (xmlContent: string) => {
    try {
      const parsedProducts = parseNFeXML(xmlContent);
      
      if (parsedProducts.length > 0) {
        onNewFile?.(parsedProducts);
        toast.success(`NF-e carregada com sucesso! ${parsedProducts.length} produtos encontrados.`);
      } else {
        toast.error('Não foi possível extrair produtos da NF-e.');
      }
    } catch (error) {
      console.error('Erro ao processar XML da NF-e:', error);
      toast.error('Erro ao processar o arquivo XML da NF-e.');
    }
  };

  return (
    <div className="w-full max-w-full flex-1">
      <div className="rounded-lg border bg-white shadow-sm">
        <Tabs defaultValue="unified" className="w-full">
          <div className="sticky top-0 z-10 bg-white border-b">
            <TabsList className="w-full justify-start rounded-none border-0">
              <TabsTrigger value="unified">Visão Unificada</TabsTrigger>
              <TabsTrigger value="insights">Insights e Análises</TabsTrigger>
              <TabsTrigger value="sefaz">Integração SEFAZ</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="unified" className="p-0 w-full">
            <ProductToolbar
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              roundingType={roundingType}
              onXapuriMarkupChange={(value) => handleMarkupChange(xapuriMarkup, value, roundingType)}
              onEpitaMarkupChange={(value) => handleMarkupChange(xapuriMarkup, value, roundingType)}
              onRoundingChange={(value) => handleMarkupChange(xapuriMarkup, epitaMarkup, value)}
              compactMode={compactMode}
              toggleCompactMode={toggleCompactMode}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onNewFileRequest={handleNewFileRequest}
              xapuriSuggestedMarkup={xapuriSuggestedMarkup}
              epitaSuggestedMarkup={epitaSuggestedMarkup}
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
              <ProductAnalysisTabs 
                products={products} 
                xapuriMarkup={xapuriMarkup} 
                epitaMarkup={epitaMarkup} 
              />
              <ProductAnalysis products={products} />
            </div>
          </TabsContent>
          
          <TabsContent value="sefaz" className="p-0 w-full">
            <SefazIntegration onNfeLoaded={handleNfeLoaded} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductPreview;
