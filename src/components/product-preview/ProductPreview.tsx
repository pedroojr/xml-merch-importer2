
import React, { useState } from 'react';
import { Product } from '../../types/nfe';
import { calculateSalePrice, roundPrice, RoundingType } from './productCalculations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ProductAnalysis } from './insights/ProductAnalysis';
import { ProfitabilityAnalysis } from './insights/ProfitabilityAnalysis';
import { ProductImageModal } from './ProductImageModal';
import { searchProductImage, downloadImage } from '../../services/imageSearch';
import { ProductToolbar } from './ProductToolbar';
import { ProductTable } from './ProductTable';
import { getDefaultColumns, compactColumns } from './types/column';

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
  const [xapuriMarkup, setXapuriMarkup] = useState(120);
  const [epitaMarkup, setEpitaMarkup] = useState(140);
  const [roundingType, setRoundingType] = useState<RoundingType>('90');
  const [confirmedItems, setConfirmedItems] = useState<Set<number>>(new Set());
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());
  const [compactMode, setCompactMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ index: number; product: Product } | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string>('');

  const columns = getDefaultColumns();
  const defaultVisibleColumns = compactMode ? 
    compactColumns :
    columns.map(col => col.id);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(defaultVisibleColumns)
  );

  const handleImageSearch = async (index: number, product: Product) => {
    try {
      const url = await searchProductImage({
        ean: product.ean,
        code: product.code,
        description: product.name
      });
      
      setSearchUrl(url);
      setSelectedProduct({ index, product });
      setIsImageModalOpen(true);
      
    } catch (error) {
      toast.error('Erro ao buscar imagem do produto');
    }
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setSelectedProduct(null);
  };

  const handleNewImageSearch = async () => {
    if (selectedProduct) {
      const url = await searchProductImage({
        ean: selectedProduct.product.ean,
        code: selectedProduct.product.code,
        description: selectedProduct.product.name
      });
      setSearchUrl(url);
    }
  };

  const handleDownloadImage = () => {
    if (selectedProduct) {
      const fileName = `${selectedProduct.product.ean}-${selectedProduct.product.name}`;
      downloadImage(searchUrl, fileName);
    }
  };

  const toggleColumn = (columnId: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnId)) {
      newVisibleColumns.delete(columnId);
    } else {
      newVisibleColumns.add(columnId);
    }
    setVisibleColumns(newVisibleColumns);
  };

  const toggleCompactMode = () => {
    setCompactMode(!compactMode);
    setVisibleColumns(new Set(compactMode ? 
      columns.map(col => col.id) :
      compactColumns
    ));
  };

  const handleToggleVisibility = (index: number) => {
    const newHiddenItems = new Set(hiddenItems);
    if (newHiddenItems.has(index)) {
      newHiddenItems.delete(index);
      toast.success('Item exibido novamente');
    } else {
      newHiddenItems.add(index);
      toast.success('Item ocultado');
    }
    setHiddenItems(newHiddenItems);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white shadow-sm animate-fade-up">
        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="unified">Visão Unificada</TabsTrigger>
            <TabsTrigger value="insights">Insights e Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="relative">
            <ProductToolbar
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
              roundingType={roundingType}
              onXapuriMarkupChange={setXapuriMarkup}
              onEpitaMarkupChange={setEpitaMarkup}
              onRoundingChange={setRoundingType}
              compactMode={compactMode}
              toggleCompactMode={toggleCompactMode}
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />

            <div className="overflow-x-auto">
              <ProductTable
                products={products}
                visibleColumns={visibleColumns}
                columns={columns}
                hiddenItems={hiddenItems}
                handleToggleVisibility={handleToggleVisibility}
                handleImageSearch={handleImageSearch}
                xapuriMarkup={xapuriMarkup}
                epitaMarkup={epitaMarkup}
                roundingType={roundingType}
              />
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-8 p-6">
            <ProfitabilityAnalysis
              products={products}
              xapuriMarkup={xapuriMarkup}
              epitaMarkup={epitaMarkup}
            />
            <ProductAnalysis products={products} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedProduct && (
        <ProductImageModal
          isOpen={isImageModalOpen}
          onClose={handleCloseModal}
          imageUrl={searchUrl}
          productName={selectedProduct.product.name}
          productEan={selectedProduct.product.ean}
          onSearchNew={handleNewImageSearch}
          onDownload={handleDownloadImage}
        />
      )}
    </div>
  );
};

export default ProductPreview;
