
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, X, FileSpreadsheet, Calendar, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subDays, parse } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

interface SefazIntegrationProps {
  onNfeLoaded: (xmlContent: string) => void;
}

interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  emissionDate: Date;
  chaveAcesso: string;
  tipo: string;
  serie: string;
  cnpjEmitente: string;
  ieEmitente: string;
  emitente: string;
  uf: string;
  valor: string;
  selected?: boolean;
}

interface Company {
  cnpj: string;
  name: string;
  type: 'matriz' | 'filial';
}

interface DateRangeFilter {
  start: Date | undefined;
  end: Date | undefined;
}

// Lista de empresas pré-configuradas
const COMPANIES: Company[] = [
  {
    cnpj: "12.345.678/0001-99",
    name: "Empresa Matriz LTDA",
    type: "matriz"
  },
  {
    cnpj: "12.345.678/0002-70",
    name: "Filial São Paulo",
    type: "filial"
  },
  {
    cnpj: "12.345.678/0003-51",
    name: "Filial Rio de Janeiro",
    type: "filial"
  },
  {
    cnpj: "12.345.678/0004-32",
    name: "Filial Belo Horizonte",
    type: "filial"
  }
];

// Dados de exemplo para demonstração
const EXAMPLE_INVOICES: InvoiceItem[] = [
  {
    id: "inv1",
    number: "11684170",
    date: "03/03/2023",
    emissionDate: new Date(2023, 2, 3),
    chaveAcesso: "37552375651710037019336598741256987451254",
    tipo: "Saída",
    serie: "001",
    cnpjEmitente: "32019424/0001-83",
    ieEmitente: "217286220",
    emitente: "Fornecedor B",
    uf: "BA",
    valor: "R$ 544.16"
  },
  {
    id: "inv2",
    number: "94663562",
    date: "02/03/2023",
    emissionDate: new Date(2023, 2, 2),
    chaveAcesso: "70635933187451360015879651236547896541245",
    tipo: "Saída",
    serie: "001",
    cnpjEmitente: "80194494/0001-62",
    ieEmitente: "706475137",
    emitente: "Fornecedor H",
    uf: "SP",
    valor: "R$ 8696.19"
  },
  {
    id: "inv3",
    number: "60763282",
    date: "23/02/2023",
    emissionDate: new Date(2023, 1, 23),
    chaveAcesso: "82391362598531723396589745612358974512369",
    tipo: "Entrada",
    serie: "001",
    cnpjEmitente: "50726434/0001-43",
    ieEmitente: "944169268",
    emitente: "Fornecedor B",
    uf: "GO",
    valor: "R$ 6596.05"
  },
  {
    id: "inv4",
    number: "85334407",
    date: "20/02/2023",
    emissionDate: new Date(2023, 1, 20),
    chaveAcesso: "02958301940339751613254789654128569687452",
    tipo: "Saída",
    serie: "006",
    cnpjEmitente: "66095880/0001-43",
    ieEmitente: "896485841",
    emitente: "Fornecedor O",
    uf: "RS",
    valor: "R$ 4870.77"
  },
  {
    id: "inv5",
    number: "44334940",
    date: "18/02/2023",
    emissionDate: new Date(2023, 1, 18),
    chaveAcesso: "04590777576044966712658974563214598741256",
    tipo: "Entrada",
    serie: "006",
    cnpjEmitente: "28090907/0001-98",
    ieEmitente: "890714054",
    emitente: "Fornecedor U",
    uf: "BA",
    valor: "R$ 2191.63"
  },
  {
    id: "inv6",
    number: "98631890",
    date: "13/02/2023",
    emissionDate: new Date(2023, 1, 13),
    chaveAcesso: "50823002097349198904698741256987456321459",
    tipo: "Entrada",
    serie: "006",
    cnpjEmitente: "46950871/0001-84",
    ieEmitente: "108029112",
    emitente: "Fornecedor Y",
    uf: "BA",
    valor: "R$ 3927.95"
  },
  {
    id: "inv7",
    number: "43648369",
    date: "07/02/2023",
    emissionDate: new Date(2023, 1, 7),
    chaveAcesso: "73979238580201779465987563214598745632145",
    tipo: "Entrada",
    serie: "004",
    cnpjEmitente: "16795534/0001-25",
    ieEmitente: "793763766",
    emitente: "Fornecedor K",
    uf: "GO",
    valor: "R$ 2324.12"
  }
];

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [searchType, setSearchType] = useState<string>("NFe");
  const [searchBy, setSearchBy] = useState<string>("Chave");
  const [searchUF, setSearchUF] = useState<string>("Todos");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [formattedDateRange, setFormattedDateRange] = useState<string>(() => {
    const today = new Date();
    const start = subDays(today, 30);
    return `${format(start, 'dd/MM/yyyy')} a ${format(today, 'dd/MM/yyyy')}`;
  });
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [invoices, setInvoices] = useState<InvoiceItem[]>(EXAMPLE_INVOICES);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceItem[]>(EXAMPLE_INVOICES);
  const [loading, setLoading] = useState<boolean>(false);

  // Simular carregamento de dados ao iniciar
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Simular atualização quando a empresa selecionada muda
  useEffect(() => {
    fetchInvoices();
  }, [selectedCompany, dateRange]);

  const fetchInvoices = () => {
    setLoadingInvoices(true);
    
    // Simulação de busca no backend (seria substituído por chamada real API)
    setTimeout(() => {
      // Filtrar por empresa se não for "todas"
      let filtered = [...EXAMPLE_INVOICES];
      
      if (selectedCompany !== "all") {
        const company = COMPANIES.find(c => c.cnpj === selectedCompany);
        if (company) {
          // Simulando filtragem por empresa
          filtered = filtered.filter((_, index) => 
            company.type === 'matriz' ? index % 3 === 0 : index % 3 !== 0
          );
        }
      }
      
      // Filtrar por período
      if (dateRange.start && dateRange.end) {
        filtered = filtered.filter(invoice => 
          invoice.emissionDate >= dateRange.start! && 
          invoice.emissionDate <= dateRange.end!
        );
      }
      
      setInvoices(filtered);
      setFilteredInvoices(filtered);
      setLoadingInvoices(false);
    }, 1000);
  };

  const handleSearch = () => {
    setLoadingInvoices(true);
    
    // Simulação de filtro adicional
    setTimeout(() => {
      // Aqui pode-se implementar lógicas adicionais de filtragem baseadas nos outros critérios
      // Por enquanto, apenas simula o sucesso da operação
      setLoadingInvoices(false);
      toast.success("Pesquisa realizada com sucesso");
    }, 800);
  };
  
  const handleClear = () => {
    setSearchUF("Todos");
    setSearchBy("Chave");
    setFilteredInvoices(invoices);
    toast.success("Filtros limpos");
  };

  const handleDateRangeChange = (rangeStr: string) => {
    setFormattedDateRange(rangeStr);
    
    try {
      const [startStr, endStr] = rangeStr.split(' a ');
      const start = parse(startStr, 'dd/MM/yyyy', new Date());
      const end = parse(endStr, 'dd/MM/yyyy', new Date());
      
      setDateRange({
        start,
        end
      });
    } catch (error) {
      console.error('Erro ao converter datas:', error);
    }
  };

  const handleSelectInvoice = (id: string) => {
    const newSelected = new Set(selectedInvoices);
    
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    
    setSelectedInvoices(newSelected);
  };
  
  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) {
      const allIds = filteredInvoices.map(invoice => invoice.id);
      setSelectedInvoices(new Set(allIds));
    } else {
      setSelectedInvoices(new Set());
    }
  };
  
  const handleExportSelected = () => {
    if (selectedInvoices.size === 0) {
      toast.error("Selecione pelo menos uma nota fiscal para exportar");
      return;
    }
    
    toast.success(`${selectedInvoices.size} notas fiscais exportadas`);
  };
  
  const handleClearSelected = () => {
    if (selectedInvoices.size === 0) {
      toast.error("Não há notas fiscais selecionadas");
      return;
    }
    
    setSelectedInvoices(new Set());
    toast.success("Seleção limpa");
  };

  const handleLoadInvoice = async (invoice: InvoiceItem) => {
    setLoading(true);
    
    try {
      // Simulação temporária para demonstração
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockXmlResponse = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <infNFe versao="4.00">
              <ide>
                <nNF>${invoice.number}</nNF>
              </ide>
              <emit>
                <CNPJ>${invoice.cnpjEmitente.replace(/\D/g, '')}</CNPJ>
                <xNome>${invoice.emitente}</xNome>
              </emit>
              <det nItem="1">
                <prod>
                  <cProd>001</cProd>
                  <cEAN>7891234567892</cEAN>
                  <xProd>PRODUTO ${invoice.emitente} VERMELHO</xProd>
                  <NCM>12345678</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>UN</uCom>
                  <qCom>8</qCom>
                  <vUnCom>60.00</vUnCom>
                  <vProd>480.00</vProd>
                </prod>
              </det>
              <det nItem="2">
                <prod>
                  <cProd>002</cProd>
                  <cEAN>7891234567893</cEAN>
                  <xProd>PRODUTO ${invoice.emitente} AZUL</xProd>
                  <NCM>12345678</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>UN</uCom>
                  <qCom>5</qCom>
                  <vUnCom>75.00</vUnCom>
                  <vProd>375.00</vProd>
                </prod>
              </det>
            </infNFe>
          </NFe>
        </nfeProc>
      `;
      
      // Enviar o XML para o componente pai
      onNfeLoaded(mockXmlResponse);
      
      toast.success(`Nota ${invoice.number} carregada com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar nota fiscal:', error);
      toast.error('Ocorreu um erro ao carregar a nota fiscal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col space-y-4 p-4">
          {/* Linha 1: Destinatário e Tipos de Documento */}
          <div className="flex justify-between items-center gap-4">
            <div className="w-1/3">
              <Label htmlFor="empresaDestinataria" className="mb-1 block font-medium">
                Empresa Destinatária
              </Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger id="empresaDestinataria" className="w-full">
                  <SelectValue placeholder="Todas as Empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {COMPANIES.map((company) => (
                    <SelectItem key={company.cnpj} value={company.cnpj}>
                      {company.name} ({company.type === 'matriz' ? 'Matriz' : 'Filial'}) - {company.cnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={searchType === "NFe" ? "default" : "outline"}
                className={`px-4 ${searchType === "NFe" ? "bg-green-500 hover:bg-green-600" : ""}`}
                onClick={() => setSearchType("NFe")}
              >
                NFe
              </Button>
              <Button
                variant={searchType === "CTe" ? "default" : "outline"}
                className={`px-4 ${searchType === "CTe" ? "bg-green-500 hover:bg-green-600" : ""}`}
                onClick={() => setSearchType("CTe")}
              >
                CTe
              </Button>
              <Button
                variant="outline"
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Selecionar várias chaves
              </Button>
            </div>
          </div>
          
          {/* Linha 2: Período, UF e Busca */}
          <div className="flex justify-between items-center gap-4">
            <div className="w-1/3">
              <Label htmlFor="periodo" className="mb-1 block font-medium">
                Período
              </Label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <Calendar size={16} />
                </div>
                <Input
                  id="periodo"
                  value={formattedDateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className="pl-8"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
            
            <div className="w-1/4">
              <Label htmlFor="uf" className="mb-1 block font-medium">
                UF
              </Label>
              <Select value={searchUF} onValueChange={setSearchUF}>
                <SelectTrigger id="uf">
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-1/4">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="buscarPor" className="font-medium">
                  Buscar Por
                </Label>
              </div>
              <Select value={searchBy} onValueChange={setSearchBy}>
                <SelectTrigger id="buscarPor">
                  <SelectValue placeholder="Buscar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Chave">Chave</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="Numero">Número</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-5">
              <div className="flex space-x-2">
                <Button onClick={handleSearch} className="bg-green-500 hover:bg-green-600">
                  <Search size={16} className="mr-1" />
                  <span className="uppercase">Filtrar</span>
                </Button>
                <Button onClick={handleClear} variant="outline" className="flex items-center">
                  <X size={16} className="mr-1" />
                  <span className="uppercase">Clear</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabela de resultados */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">
              Resultados: {filteredInvoices.length} notas fiscais
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={handleExportSelected}
              >
                <FileSpreadsheet size={18} className="mr-2" />
                Exportar Selecionadas
              </Button>
              <Button 
                variant="outline"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleClearSelected}
              >
                Limpar Selecionadas
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-[40px] p-2">
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={selectedInvoices.size > 0 && selectedInvoices.size === filteredInvoices.length}
                    />
                  </th>
                  <th className="text-left p-2 text-xs font-medium">CNPJ/CPF Destinatário</th>
                  <th className="text-left p-2 text-xs font-medium">Emissão</th>
                  <th className="text-left p-2 text-xs font-medium">Chave</th>
                  <th className="text-left p-2 text-xs font-medium">Tipo</th>
                  <th className="text-left p-2 text-xs font-medium">Série</th>
                  <th className="text-left p-2 text-xs font-medium">Número</th>
                  <th className="text-left p-2 text-xs font-medium">CNPJ Emitente</th>
                  <th className="text-left p-2 text-xs font-medium">IE Emitente</th>
                  <th className="text-left p-2 text-xs font-medium">Emitente</th>
                  <th className="text-left p-2 text-xs font-medium">UF</th>
                  <th className="text-left p-2 text-xs font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={12} className="text-center py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        <span>Carregando...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id}
                      className="hover:bg-gray-50 cursor-pointer border-t border-gray-200"
                      onClick={() => handleLoadInvoice(invoice)}
                    >
                      <td className="p-2">
                        <Checkbox 
                          checked={selectedInvoices.has(invoice.id)}
                          onCheckedChange={() => handleSelectInvoice(invoice.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-2 text-sm">
                        {selectedCompany !== "all" ? 
                          COMPANIES.find(c => c.cnpj === selectedCompany)?.cnpj : 
                          "12.345.678/0001-99"
                        }
                      </td>
                      <td className="p-2 text-sm">{invoice.date}</td>
                      <td className="p-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" 
                          title={invoice.chaveAcesso}>
                        {invoice.chaveAcesso}
                      </td>
                      <td className="p-2 text-sm">{invoice.tipo}</td>
                      <td className="p-2 text-sm">{invoice.serie}</td>
                      <td className="p-2 text-sm">{invoice.number}</td>
                      <td className="p-2 text-sm">{invoice.cnpjEmitente}</td>
                      <td className="p-2 text-sm">{invoice.ieEmitente}</td>
                      <td className="p-2 text-sm">{invoice.emitente}</td>
                      <td className="p-2 text-sm">{invoice.uf}</td>
                      <td className="p-2 text-sm">{invoice.valor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="text-center py-4 text-gray-500">
                      Nenhuma nota fiscal encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SefazIntegration;
