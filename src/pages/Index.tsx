import React, { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { ProductPreview } from '../components/product-preview';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { Info, FileSpreadsheet, Save, History, Edit2 } from 'lucide-react';
import { parseNFeXML } from '../utils/nfeParser';
import { Product, SavedNFe } from '../types/nfe';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SefazIntegration from '../components/SefazIntegration';
import DataSystemIntegration from '../components/DataSystemIntegration';

const STORAGE_KEYS = {
  XAPURI_MARKUP: 'nfe_import_xapuri_markup',
  EPITA_MARKUP: 'nfe_import_epita_markup',
  ROUNDING_TYPE: 'nfe_import_rounding_type',
  SAVED_NFES: 'nfe_import_saved_nfes'
};

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<Set<number>>(new Set());
  const [savedNFes, setSavedNFes] = useState<SavedNFe[]>([]);
  const [currentNFeId, setCurrentNFeId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [brandName, setBrandName] = useState<string>("");
  const [isEditingBrand, setIsEditingBrand] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState("upload");
  const [xmlContentForDataSystem, setXmlContentForDataSystem] = useState<string | null>(null);

  useEffect(() => {
    const savedNFesJson = localStorage.getItem(STORAGE_KEYS.SAVED_NFES);
    if (savedNFesJson) {
      try {
        const parsedNFes = JSON.parse(savedNFesJson);
        const processedNFes = parsedNFes.map((nfe: any) => ({
          ...nfe,
          hiddenItems: nfe.hiddenItems ? new Set(nfe.hiddenItems) : new Set()
        }));
        setSavedNFes(processedNFes);
      } catch (error) {
        console.error('Erro ao carregar notas salvas:', error);
      }
    }
    
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
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const nfNumber = extractInvoiceNumber(xmlDoc);
      
      setInvoiceNumber(nfNumber || "");
      setBrandName("Fornecedor");
      setHiddenItems(new Set());
      setCurrentNFeId(null);
      setIsEditingBrand(false);
      
      setXmlContentForDataSystem(text);
      setCurrentTab("datasystem");
      
      toast.success('Arquivo XML processado com sucesso. Analisando produtos no DataSystem...');
    } catch (error) {
      toast.error('Erro ao processar o arquivo XML');
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleXmlFromSefaz = (xmlContent: string) => {
    try {
      const parsedProducts = parseNFeXML(xmlContent);
      setProducts(parsedProducts);
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const nfNumber = extractInvoiceNumber(xmlDoc);
      
      setInvoiceNumber(nfNumber || "");
      setBrandName("Fornecedor");
      setHiddenItems(new Set());
      setCurrentNFeId(null);
      setIsEditingBrand(false);
      
      setXmlContentForDataSystem(xmlContent);
      setCurrentTab("datasystem");
      
      toast.success('NF-e obtida da SEFAZ e processada com sucesso. Analisando produtos no DataSystem...');
    } catch (error) {
      toast.error('Erro ao processar o arquivo XML da SEFAZ');
      console.error('Error:', error);
    }
  };

  const extractInvoiceNumber = (xmlDoc: Document): string => {
    try {
      const ns = "http://www.portalfiscal.inf.br/nfe";
      const ide = xmlDoc.getElementsByTagNameNS(ns, "ide")[0];
      if (ide) {
        const nNF = ide.getElementsByTagNameNS(ns, "nNF")[0];
        return nNF ? nNF.textContent || "" : "";
      }
    } catch (error) {
      console.error("Erro ao extrair número da nota:", error);
    }
    return "";
  };

  const handleProductUpdate = (index: number, updatedProduct: Product) => {
    const newProducts = [...products];
    newProducts[index] = updatedProduct;
    setProducts(newProducts);
  };

  const handleGoogleSheetsExport = () => {
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
    link.setAttribute('download', 'produtos_para_google_sheets.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Produtos exportados para Google Planilhas com sucesso!');
    
    toast.info('Para importar: Abra o Google Planilhas, clique em Arquivo > Importar > Upload > Selecione o arquivo CSV baixado', {
      duration: 6000,
    });
  };

  const handleConfigurationUpdate = (
    xapuriMarkup: number, 
    epitaMarkup: number, 
    roundingType: string
  ) => {
    localStorage.setItem(STORAGE_KEYS.XAPURI_MARKUP, xapuriMarkup.toString());
    localStorage.setItem(STORAGE_KEYS.EPITA_MARKUP, epitaMarkup.toString());
    localStorage.setItem(STORAGE_KEYS.ROUNDING_TYPE, roundingType);
    
    if (currentNFeId) {
      const updatedNFes = savedNFes.map(nfe => {
        if (nfe.id === currentNFeId) {
          return {
            ...nfe,
            xapuriMarkup,
            epitaMarkup,
            roundingType
          };
        }
        return nfe;
      });
      
      setSavedNFes(updatedNFes);
      saveNFesToLocalStorage(updatedNFes);
    }
    
    console.log('Configurações salvas:', {
      xapuriMarkup,
      epitaMarkup,
      roundingType
    });
  };
  
  const handleToggleVisibility = (index: number) => {
    const newHiddenItems = new Set(hiddenItems);
    if (newHiddenItems.has(index)) {
      newHiddenItems.delete(index);
    } else {
      newHiddenItems.add(index);
    }
    setHiddenItems(newHiddenItems);
    
    if (currentNFeId) {
      const updatedNFes = savedNFes.map(nfe => {
        if (nfe.id === currentNFeId) {
          return {
            ...nfe,
            hiddenItems: newHiddenItems
          };
        }
        return nfe;
      });
      
      setSavedNFes(updatedNFes);
      saveNFesToLocalStorage(updatedNFes);
    }
  };

  const saveNFesToLocalStorage = (nfes: SavedNFe[]) => {
    const serializableNFes = nfes.map(nfe => ({
      ...nfe,
      hiddenItems: nfe.hiddenItems ? Array.from(nfe.hiddenItems) : []
    }));
    
    localStorage.setItem(STORAGE_KEYS.SAVED_NFES, JSON.stringify(serializableNFes));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSaveCurrentNFe = () => {
    if (products.length === 0) {
      toast.error('Não há produtos para salvar');
      return;
    }
    
    const now = new Date();
    const newNFe: SavedNFe = {
      id: now.getTime().toString(),
      products: [...products],
      date: formatDate(now),
      name: `NF ${formatDate(now)}`,
      invoiceNumber: invoiceNumber,
      brandName: brandName,
      hiddenItems: new Set(hiddenItems),
      xapuriMarkup: Number(localStorage.getItem(STORAGE_KEYS.XAPURI_MARKUP) || '120'),
      epitaMarkup: Number(localStorage.getItem(STORAGE_KEYS.EPITA_MARKUP) || '140'),
      roundingType: localStorage.getItem(STORAGE_KEYS.ROUNDING_TYPE) || '90'
    };
    
    const updatedNFes = [newNFe, ...savedNFes.filter(nfe => nfe.id !== currentNFeId)].slice(0, 3);
    
    setSavedNFes(updatedNFes);
    setCurrentNFeId(newNFe.id);
    saveNFesToLocalStorage(updatedNFes);
    
    toast.success('Nota fiscal salva com sucesso');
  };

  const handleLoadNFe = (nfe: SavedNFe) => {
    setProducts(nfe.products);
    setHiddenItems(nfe.hiddenItems || new Set());
    setCurrentNFeId(nfe.id);
    setInvoiceNumber(nfe.invoiceNumber || "");
    setBrandName(nfe.brandName || "Fornecedor");
    setIsEditingBrand(false);
    
    if (nfe.xapuriMarkup) {
      localStorage.setItem(STORAGE_KEYS.XAPURI_MARKUP, nfe.xapuriMarkup.toString());
    }
    
    if (nfe.epitaMarkup) {
      localStorage.setItem(STORAGE_KEYS.EPITA_MARKUP, nfe.epitaMarkup.toString());
    }
    
    if (nfe.roundingType) {
      localStorage.setItem(STORAGE_KEYS.ROUNDING_TYPE, nfe.roundingType);
    }
    
    toast.success(`Nota fiscal ${nfe.name} carregada com sucesso`);
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
                Faça upload do arquivo XML da NF-e ou consulte diretamente na SEFAZ para importar automaticamente os produtos
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="max-w-3xl mx-auto">
                <Tabs defaultValue="upload" value={currentTab} onValueChange={setCurrentTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="upload">Upload de XML</TabsTrigger>
                    <TabsTrigger value="sefaz">Consulta SEFAZ</TabsTrigger>
                    <TabsTrigger value="datasystem">DataSystem</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload">
                    <FileUpload onFileSelect={handleFileSelect} />
                  </TabsContent>
                  
                  <TabsContent value="sefaz">
                    <SefazIntegration onXmlReceived={handleXmlFromSefaz} />
                  </TabsContent>
                  
                  <TabsContent value="datasystem">
                    <DataSystemIntegration xmlContent={xmlContentForDataSystem} />
                  </TabsContent>
                </Tabs>
                
                {savedNFes.length > 0 && (
                  <div className="mt-8 text-center">
                    <p className="text-slate-600 mb-3">Ou carregue uma nota fiscal salva anteriormente:</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {savedNFes.map((nfe) => (
                        <Button
                          key={nfe.id}
                          variant="outline"
                          onClick={() => handleLoadNFe(nfe)}
                          className="flex items-center gap-2"
                        >
                          <History size={16} />
                          {nfe.brandName || "NF"}: {nfe.invoiceNumber || nfe.name} ({nfe.products.length} itens)
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
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
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {isEditingBrand ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-40 text-base font-medium"
                      autoFocus
                      onBlur={() => setIsEditingBrand(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingBrand(false);
                      }}
                    />
                    <button 
                      onClick={() => setIsEditingBrand(false)}
                      className="text-blue-600 text-sm"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">
                      NF: <span className="font-semibold">{brandName}</span>
                    </h2>
                    <button 
                      onClick={() => setIsEditingBrand(true)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <span className="text-gray-600">-</span>
                    <span className="text-gray-600">
                      {invoiceNumber}, {formatDate(new Date())}
                    </span>
                  </div>
                )}
                <span className="text-sm text-slate-500 ml-2">
                  ({products.length} produtos)
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleSaveCurrentNFe}
                  className="flex items-center gap-2"
                >
                  <Save size={16} />
                  Salvar Nota
                </Button>
                {savedNFes.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <History size={16} />
                        Histórico
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {savedNFes.map((nfe) => (
                        <DropdownMenuItem
                          key={nfe.id}
                          onClick={() => handleLoadNFe(nfe)}
                          className="cursor-pointer"
                        >
                          {nfe.brandName || "NF"}: {nfe.invoiceNumber || nfe.name} - {nfe.date}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            
            <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200">
              <ProductPreview 
                products={products} 
                onProductUpdate={handleProductUpdate}
                editable={true}
                onConfigurationUpdate={handleConfigurationUpdate}
                hiddenItems={hiddenItems}
                onToggleVisibility={handleToggleVisibility}
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button 
                variant="outline"
                onClick={handleGoogleSheetsExport}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Exportar para Google Planilhas
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

