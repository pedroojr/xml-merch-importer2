
import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { ProductPreview } from '../components/product-preview';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Info, FileSpreadsheet } from 'lucide-react';
import { parseNFeXML } from '../utils/nfeParser';
import { Product } from '../types/nfe';

const STORAGE_KEYS = {
  XAPURI_MARKUP: 'nfe_import_xapuri_markup',
  EPITA_MARKUP: 'nfe_import_epita_markup',
  ROUNDING_TYPE: 'nfe_import_rounding_type'
};

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedXapuriMarkup = localStorage.getItem(STORAGE_KEYS.XAPURI_MARKUP);
    const savedEpitaMarkup = localStorage.getItem(STORAGE_KEYS.EPITA_MARKUP);
    const savedRoundingType = localStorage.getItem(STORAGE_KEYS.ROUNDING_TYPE);

    if (savedXapuriMarkup) {
      const markup = Number(savedXapuriMarkup);
      console.log('Carregando markup Xapuri:', markup);
    }
    
    if (savedEpitaMarkup) {
      const markup = Number(savedEpitaMarkup);
      console.log('Carregando markup Epitaciolândia:', markup);
    }

    if (savedRoundingType) {
      console.log('Carregando tipo de arredondamento:', savedRoundingType);
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (products.length > 0) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair da página?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [products]);

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

  const handleExcelExport = () => {
    const headers = ['Código', 'EAN', 'Nome', 'NCM', 'CFOP', 'UOM', 'Quantidade', 'Preço Unit.', 'Total', 'Desconto', 'Líquido', 'Cor', 'Preço Venda'];
    const rows = products.map(p => [
      p.code,
      p.ean,
      p.name,
      p.ncm,
      p.cfop,
      p.uom,
      p.quantity,
      p.unitPrice,
      p.totalPrice,
      p.discount,
      p.netPrice,
      p.color,
      p.salePrice
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'produtos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Produtos exportados para Excel com sucesso!');
  };

  const handleConfigurationUpdate = (
    xapuriMarkup: number, 
    epitaMarkup: number, 
    roundingType: string
  ) => {
    localStorage.setItem(STORAGE_KEYS.XAPURI_MARKUP, xapuriMarkup.toString());
    localStorage.setItem(STORAGE_KEYS.EPITA_MARKUP, epitaMarkup.toString());
    localStorage.setItem(STORAGE_KEYS.ROUNDING_TYPE, roundingType);
    
    console.log('Configurações salvas:', {
      xapuriMarkup,
      epitaMarkup,
      roundingType
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-[2000px] w-full px-4 py-8">
        {products.length === 0 && (
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
          </div>
        )}

        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-slate-600">Processando arquivo XML...</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="w-full animate-fade-up">
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
              <ProductPreview 
                products={products} 
                onProductUpdate={handleProductUpdate}
                editable={true}
                onConfigurationUpdate={handleConfigurationUpdate}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button 
                variant="outline"
                onClick={handleExcelExport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Exportar para Excel
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
