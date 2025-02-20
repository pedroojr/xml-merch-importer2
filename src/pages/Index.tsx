
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProductPreview from '../components/ProductPreview';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Product } from '../types/nfe';
import { parseNFeXML } from '../utils/nfeParser';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          try {
            const parsedProducts = parseNFeXML(text);
            setProducts(parsedProducts);
            toast.success(`${parsedProducts.length} produtos encontrados`);
          } catch (error) {
            console.error('Error parsing XML:', error);
            toast.error('Erro ao processar o arquivo XML da NFe');
          }
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('Erro ao ler o arquivo');
      console.error('Error reading file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (products.length === 0) {
      toast.error('Nenhum produto para importar');
      return;
    }
    // Mock API call to ODOO
    toast.success('Produtos importados com sucesso');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Importação de Produtos</h1>
          <p className="text-gray-600">Importe produtos de notas fiscais XML (NF-e)</p>
        </div>

        <FileUpload onFileSelect={handleFileSelect} />

        {isProcessing && (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-600">Processando arquivo...</div>
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-4">
            <ProductPreview products={products} />
            <div className="flex justify-end">
              <Button onClick={handleImport}>
                Importar Produtos
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
