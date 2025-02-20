
import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import ProductPreview from '../components/ProductPreview';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { Product } from '../types/nfe';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      // Em um cenário real, aqui enviaríamos o arquivo para o backend do Odoo
      // Por enquanto, simulamos o processamento com dados de exemplo
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dados de exemplo para demonstração
      const exampleProducts: Product[] = [
        {
          code: '001',
          ean: '7894900010015',
          name: 'Produto Exemplo 1',
          ncm: '22021000',
          cfop: '5102',
          uom: 'UN',
          quantity: 10,
          unitPrice: 50.00,
          totalPrice: 500.00,
          discount: 50.00,
          netPrice: 450.00,
          taxCode: '000'
        },
        {
          code: '002',
          ean: '7894900010022',
          name: 'Produto Exemplo 2',
          ncm: '22021000',
          cfop: '5102',
          uom: 'UN',
          quantity: 5,
          unitPrice: 100.00,
          totalPrice: 500.00,
          discount: 25.00,
          netPrice: 475.00,
          taxCode: '000'
        }
      ];

      setProducts(exampleProducts);
      toast.success('Arquivo XML processado com sucesso');
    } catch (error) {
      toast.error('Erro ao processar o arquivo XML');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            <Info size={16} />
            <span>Importador de NF-e</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Importação de Produtos via XML</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Faça upload do arquivo XML da NF-e para importar automaticamente os produtos para o seu catálogo no Odoo
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="max-w-3xl mx-auto">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processando arquivo XML...</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="space-y-4">
            <ProductPreview products={products} />
            <div className="flex justify-end">
              <Button 
                onClick={() => toast.success('Produtos importados com sucesso')}
                className="bg-blue-700 hover:bg-blue-800 text-white"
              >
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Como utilizar</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-lg font-medium mb-2">1. Selecione o arquivo</div>
              <p className="text-gray-600">Faça upload do arquivo XML da NF-e</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-lg font-medium mb-2">2. Revise os dados</div>
              <p className="text-gray-600">Confira as informações dos produtos</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-lg font-medium mb-2">3. Confirme a importação</div>
              <p className="text-gray-600">Clique em "Confirmar Importação" para finalizar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
