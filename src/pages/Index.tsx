
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import { ProductPreview } from '../components/product-preview';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Info, Github } from 'lucide-react';
import { parseNFeXML } from '../utils/nfeParser';
import { Product } from '../types/nfe';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsedProducts = parseNFeXML(text);
      setProducts(parsedProducts);
      toast.success('Arquivo XML processado com sucesso');
    } catch (error) {
      toast.error('Erro ao processar o arquivo XML');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProductUpdate = (index: number, updatedProduct: Product) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
  };

  const handleGithubExport = () => {
    // Aqui você implementaria a lógica de exportação para o GitHub
    toast.success('Produtos exportados para o GitHub com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient 0to-b from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            <Info size={16} />
            <span>Importador de NF-e</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Importação de Produtos via XML</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Faça upload do arquivo XML da NF-e para importar automaticamente os produtos para o seu catálogo no Odoo
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="max-w-3xl mx-auto">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-slate-600">Processando arquivo XML...</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-6 animate-fade-up">
            <ProductPreview 
              products={products} 
              onProductUpdate={handleProductUpdate}
              editable={true}
            />
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline"
                onClick={handleGithubExport}
                className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
              >
                <Github size={18} />
                Exportar para GitHub
              </Button>
              <Button 
                onClick={() => toast.success('Produtos importados com sucesso!')}
                className="bg-blue-700 hover:bg-blue-800 text-white px-6"
              >
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
