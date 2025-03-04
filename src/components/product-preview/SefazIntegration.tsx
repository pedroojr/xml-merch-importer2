
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSearch, Download, Check, Clock, Upload, Shield, Calendar, Building2, Search, Filter, X, FileSpreadsheet, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

interface SefazIntegrationProps {
  onNfeLoaded: (xmlContent: string) => void;
}

interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  supplier: string;
  status: 'processed' | 'pending';
  emissionDate: Date;
  branch: 'matriz' | 'filial';
  chaveAcesso?: string;
  tipo?: string;
  serie?: string;
  cnpjEmitente?: string;
  ieEmitente?: string;
  uf?: string;
  valor?: string;
  selected?: boolean;
}

interface Certificate {
  name: string;
  expiry: string;
  isActive: boolean;
  password?: string;
  fileData?: string;
  companies?: Company[];
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

interface SefazAPIResponse {
  success: boolean;
  message: string;
  invoices?: InvoiceItem[];
  xmlContent?: string;
}

const STORAGE_KEYS = {
  CERTIFICATE: 'sefaz_certificate',
  SELECTED_BRANCH: 'sefaz_selected_branch',
  CNPJ: 'sefaz_cnpj'
};

// URL base da API SEFAZ (precisará ser substituída pelo endpoint real)
const SEFAZ_API_BASE_URL = 'https://api-sefaz.gov.br';

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [nfeKey, setNfeKey] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CNPJ) || '';
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInvoices, setLoadingInvoices] = useState<boolean>(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState<string>('');
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    start: subDays(new Date(), 30), // Últimos 30 dias como padrão
    end: new Date()
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [periodFilter, setPeriodFilter] = useState<string>('30days');
  const [recentInvoices, setRecentInvoices] = useState<InvoiceItem[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<'matriz' | 'filial' | 'todas'>(() => {
    return (localStorage.getItem(STORAGE_KEYS.SELECTED_BRANCH) as 'matriz' | 'filial' | 'todas') || 'todas';
  });
  const [activeTab, setActiveTab] = useState<string>("invoices");
  const [formattedDateRange, setFormattedDateRange] = useState<string>("03/12/2024 a 03/03/2025");
  const [searchType, setSearchType] = useState<string>("NFe");
  const [searchUF, setSearchUF] = useState<string>("Todos");
  const [searchBy, setSearchBy] = useState<string>("Chave");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [recipientCompany, setRecipientCompany] = useState<string>("Todos os Destinatários");
  const [invoiceFiltered, setInvoiceFiltered] = useState<InvoiceItem[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  // Carregar certificado salvo e CNPJ ao iniciar
  useEffect(() => {
    const savedCertificate = localStorage.getItem(STORAGE_KEYS.CERTIFICATE);
    if (savedCertificate) {
      try {
        const parsedCertificate = JSON.parse(savedCertificate) as Certificate;
        setActiveCertificate(parsedCertificate);
        
        if (parsedCertificate.password) {
          setCertificatePassword(parsedCertificate.password);
        }
        
        // Carregar lista de empresas do certificado
        if (parsedCertificate.companies && parsedCertificate.companies.length > 0) {
          setCompanyList(parsedCertificate.companies);
        } else {
          // Se não houver empresas cadastradas, gerar empresas simuladas
          const mockCompanies = generateMockCompanies();
          setCompanyList(mockCompanies);
          
          // Atualizar o certificado para incluir as empresas
          const updatedCertificate = {
            ...parsedCertificate,
            companies: mockCompanies
          };
          setActiveCertificate(updatedCertificate);
          localStorage.setItem(STORAGE_KEYS.CERTIFICATE, JSON.stringify(updatedCertificate));
        }
        
        toast.success('Certificado digital carregado com sucesso');
        
        // Se tiver certificado válido, tentar buscar notas fiscais automaticamente
        if (cnpj) {
          fetchInvoicesByPeriod();
        }
      } catch (error) {
        console.error('Erro ao carregar certificado salvo:', error);
      }
    }
    
    const savedBranch = localStorage.getItem(STORAGE_KEYS.SELECTED_BRANCH);
    if (savedBranch) {
      setSelectedBranch(savedBranch as 'matriz' | 'filial' | 'todas');
    }
  }, []);

  // Salvar CNPJ no localStorage quando atualizado
  useEffect(() => {
    if (cnpj) {
      localStorage.setItem(STORAGE_KEYS.CNPJ, cnpj);
    }
  }, [cnpj]);

  // Carregar notas fiscais com base no filtro de período
  useEffect(() => {
    if (activeCertificate && (cnpj || selectedCompany !== "all")) {
      fetchInvoicesByPeriod();
    }
  }, [dateRange, activeCertificate, selectedBranch, cnpj, selectedCompany]);

  // Função para gerar empresas simuladas (matriz e filiais)
  const generateMockCompanies = (): Company[] => {
    return [
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
  };

  const fetchInvoicesByPeriod = async (invoices = allInvoices) => {
    if (!activeCertificate) {
      toast.error('Certificado digital é necessário');
      return;
    }
    
    // Verificar se temos um CNPJ selecionado
    const targetCnpj = selectedCompany !== "all" ? 
                      companyList.find(c => c.cnpj === selectedCompany)?.cnpj : 
                      cnpj;
    
    if (!targetCnpj) {
      toast.error('Selecione uma empresa ou digite um CNPJ');
      return;
    }
    
    if (dateRange.start && dateRange.end) {
      setLoadingInvoices(true);
      
      try {
        // Em um ambiente de produção, esta seria uma chamada real à API SEFAZ
        // Substituir pelo código real de integração com a SEFAZ quando disponível
        
        // Simulação temporária para demonstração
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Gerando dados simulados para testes
        const mockInvoices: InvoiceItem[] = generateMockInvoices();
        
        let filteredInvoices = mockInvoices.filter(invoice => {
          return invoice.emissionDate >= dateRange.start! && invoice.emissionDate <= dateRange.end!;
        });
        
        // Filtrar por matriz/filial se necessário
        if (selectedBranch !== 'todas') {
          filteredInvoices = filteredInvoices.filter(invoice => invoice.branch === selectedBranch);
        }
        
        // Se estiver filtrando por um CNPJ específico de empresa do certificado
        if (selectedCompany !== "all") {
          const company = companyList.find(c => c.cnpj === selectedCompany);
          if (company) {
            // Aqui filtramos para mostrar somente notas da empresa selecionada
            filteredInvoices = filteredInvoices.filter(invoice => 
              (company.type === 'matriz' && invoice.branch === 'matriz') ||
              (company.type === 'filial' && invoice.branch === 'filial')
            );
          }
        }
        
        setRecentInvoices(filteredInvoices);
        setInvoiceFiltered(filteredInvoices);
        setAllInvoices(mockInvoices);
        
        toast.success(`${filteredInvoices.length} notas fiscais encontradas`);
      } catch (error) {
        console.error('Erro ao buscar notas fiscais:', error);
        toast.error('Erro ao consultar notas fiscais na SEFAZ');
      } finally {
        setLoadingInvoices(false);
      }
    }
  };

  // Função para gerar dados simulados - será substituída pela integração real
  const generateMockInvoices = (): InvoiceItem[] => {
    const mockInvoices: InvoiceItem[] = [];
    const today = new Date();
    
    const ufs = ['BA', 'RS', 'SP', 'SC', 'CE', 'GO'];
    const tipos = ['Saída', 'Entrada'];
    const series = ['001', '003', '004', '005', '006'];
    
    // Gerar 50 notas fiscais aleatórias nos últimos 90 dias
    for (let i = 0; i < 50; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 90);
      const emissionDate = subDays(today, randomDaysAgo);
      const branch = Math.random() > 0.5 ? 'matriz' : 'filial';
      const invoiceNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Gerar chave de acesso simulada - 44 dígitos
      const chaveAcesso = generateRandomNFeKey();
      
      const uf = ufs[Math.floor(Math.random() * ufs.length)];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const serie = series[Math.floor(Math.random() * series.length)];
      const valor = `R$ ${(Math.random() * 10000).toFixed(2)}`;
      const cnpjEmitente = `${Math.floor(10000000 + Math.random() * 90000000)}/0001-${Math.floor(10 + Math.random() * 90)}`;
      const ieEmitente = Math.floor(100000000 + Math.random() * 900000000).toString();
      
      mockInvoices.push({
        id: `mock-${i}`,
        number: invoiceNumber,
        date: format(emissionDate, 'dd/MM/yyyy'),
        supplier: `Fornecedor ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        status: Math.random() > 0.3 ? 'pending' : 'processed',
        emissionDate,
        branch,
        chaveAcesso,
        tipo,
        serie,
        cnpjEmitente,
        ieEmitente,
        uf,
        valor,
        selected: false
      });
    }
    
    // Ordenar por data de emissão (mais recente primeiro)
    mockInvoices.sort((a, b) => b.emissionDate.getTime() - a.emissionDate.getTime());
    
    return mockInvoices;
  };

  const generateRandomNFeKey = (): string => {
    let key = '';
    for (let i = 0; i < 44; i++) {
      key += Math.floor(Math.random() * 10).toString();
    }
    return key;
  };

  const handleBranchChange = (value: 'matriz' | 'filial' | 'todas') => {
    setSelectedBranch(value);
    localStorage.setItem(STORAGE_KEYS.SELECTED_BRANCH, value);
  };

  const handlePeriodChange = (value: string) => {
    const today = new Date();
    let start: Date;
    
    setPeriodFilter(value);
    
    switch (value) {
      case '7days':
        start = subDays(today, 7);
        break;
      case '15days':
        start = subDays(today, 15);
        break;
      case '30days':
        start = subDays(today, 30);
        break;
      case '60days':
        start = subDays(today, 60);
        break;
      case '90days':
        start = subDays(today, 90);
        break;
      case 'custom':
        setIsCalendarOpen(true);
        return;
      default:
        start = subDays(today, 30);
    }
    
    setDateRange({
      start,
      end: today
    });
    
    setFormattedDateRange(`${format(start, 'dd/MM/yyyy')} a ${format(today, 'dd/MM/yyyy')}`);
  };

  const handleConsultNfe = async () => {
    if (!nfeKey || nfeKey.length !== 44) {
      toast.error('Chave da NF-e inválida. Deve conter 44 dígitos.');
      return;
    }

    if (!activeCertificate) {
      toast.error('Certificado A1 não configurado. Por favor, configure um certificado válido.');
      return;
    }

    setLoading(true);
    try {
      // Aqui seria feita a chamada real à API SEFAZ
      // Exemplo: const response = await fetch(`${SEFAZ_API_BASE_URL}/nfe/${nfeKey}`);
      
      // Simulação temporária para demonstração
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockXmlResponse = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <infNFe versao="4.00">
              <ide>
                <nNF>123456</nNF>
              </ide>
              <emit>
                <CNPJ>12345678000199</CNPJ>
                <xNome>EMPRESA FORNECEDORA REAL LTDA</xNome>
              </emit>
              <det nItem="1">
                <prod>
                  <cProd>001</cProd>
                  <cEAN>7891234567890</cEAN>
                  <xProd>PRODUTO REAL AZUL</xProd>
                  <NCM>12345678</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>UN</uCom>
                  <qCom>10</qCom>
                  <vUnCom>50.00</vUnCom>
                  <vProd>500.00</vProd>
                </prod>
              </det>
              <det nItem="2">
                <prod>
                  <cProd>002</cProd>
                  <cEAN>7891234567891</cEAN>
                  <xProd>PRODUTO REAL VERMELHO</xProd>
                  <NCM>12345678</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>UN</uCom>
                  <qCom>5</qCom>
                  <vUnCom>80.00</vUnCom>
                  <vProd>400.00</vProd>
                </prod>
              </det>
            </infNFe>
          </NFe>
        </nfeProc>
      `;
      
      // Atualizar lista de notas recentes
      const newInvoice: InvoiceItem = {
        id: new Date().getTime().toString(),
        number: '123456',
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: 'EMPRESA FORNECEDORA REAL LTDA',
        status: 'processed',
        emissionDate: new Date(),
        branch: selectedBranch === 'todas' ? 'matriz' : selectedBranch,
        chaveAcesso: nfeKey
      };
      
      setRecentInvoices([newInvoice, ...recentInvoices]);
      
      // Enviar o XML para o componente pai processar
      onNfeLoaded(mockXmlResponse);
      
      toast.success('NF-e carregada com sucesso da base SEFAZ!');
    } catch (error) {
      console.error('Erro ao consultar NF-e:', error);
      toast.error('Ocorreu um erro ao consultar a NF-e na SEFAZ.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInvoice = async (invoice: InvoiceItem) => {
    if (invoice.status === 'processed') {
      toast.info(`A nota ${invoice.number} já foi processada anteriormente.`);
      return;
    }
    
    if (!invoice.chaveAcesso) {
      toast.error('Chave de acesso da NF-e não disponível.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Aqui seria feita a chamada real à API SEFAZ
      // Exemplo: const response = await fetch(`${SEFAZ_API_BASE_URL}/nfe/${invoice.chaveAcesso}`);
      
      // Simulação temporária para demonstração
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockXmlResponse = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <infNFe versao="4.00">
              <ide>
                <nNF>${invoice.number}</nNF>
              </ide>
              <emit>
                <CNPJ>12345678000199</CNPJ>
                <xNome>${invoice.supplier}</xNome>
              </emit>
              <det nItem="1">
                <prod>
                  <cProd>003</cProd>
                  <cEAN>7891234567892</cEAN>
                  <xProd>PRODUTO ${invoice.supplier} ${invoice.branch === 'matriz' ? 'MATRIZ' : 'FILIAL'} VERDE</xProd>
                  <NCM>12345678</NCM>
                  <CFOP>5102</CFOP>
                  <uCom>UN</uCom>
                  <qCom>8</qCom>
                  <vUnCom>60.00</vUnCom>
                  <vProd>480.00</vProd>
                </prod>
              </det>
            </infNFe>
          </NFe>
        </nfeProc>
      `;
      
      const updatedInvoices = recentInvoices.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'processed' as const } : inv
      );
      setRecentInvoices(updatedInvoices);
      
      // Enviar o XML para o componente pai
      onNfeLoaded(mockXmlResponse);
      
      toast.success(`Nota ${invoice.number} carregada com sucesso da SEFAZ!`);
    } catch (error) {
      console.error('Erro ao carregar nota fiscal:', error);
      toast.error('Ocorreu um erro ao carregar a nota fiscal da SEFAZ.');
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = '';
    
    if (digits.length > 0) formatted += digits.substring(0, Math.min(2, digits.length));
    if (digits.length > 2) formatted += '.' + digits.substring(2, Math.min(5, digits.length));
    if (digits.length > 5) formatted += '.' + digits.substring(5, Math.min(8, digits.length));
    if (digits.length > 8) formatted += '/' + digits.substring(8, Math.min(12, digits.length));
    if (digits.length > 12) formatted += '-' + digits.substring(12, Math.min(14, digits.length));
    
    return formatted;
  };

  const formatNfeKey = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.substring(0, 44);
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCertificateFile(file);
      
      // Converter o arquivo para Base64 para poder salvá-lo
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const fileData = event.target.result.toString();
          // Armazenar temporariamente
          setCertificateFile(file);
        }
      };
      reader.readAsDataURL(file);
      
      toast.info(`Arquivo de certificado ${file.name} selecionado.`);
    }
  };

  const handleInstallCertificate = () => {
    if (!certificateFile) {
      toast.error('Selecione um arquivo de certificado A1.');
      return;
    }

    if (!certificatePassword) {
      toast.error('Digite a senha do certificado.');
      return;
    }

    setLoading(true);

    // Converter o arquivo para Base64 para armazenamento
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        setTimeout(() => {
          const fileData = event.target.result?.toString();
          // Gerar empresas simuladas para o certificado
          const companies = generateMockCompanies();
          
          const newCertificate: Certificate = {
            name: certificateFile.name,
            expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            isActive: true,
            password: certificatePassword,
            fileData: fileData,
            companies: companies
          };
          
          // Salvar no localStorage
          localStorage.setItem(STORAGE_KEYS.CERTIFICATE, JSON.stringify(newCertificate));
          
          setActiveCertificate(newCertificate);
          setCompanyList(companies);
          setCertificateFile(null);
          
          toast.success('Certificado A1 instalado com sucesso!');
          setLoading(false);
          
          // Após instalar o certificado, mudar para a tab de consulta de notas
          setActiveTab("invoices");
          
          // Buscar notas automaticamente se tiver CNPJ
          if (cnpj) {
            fetchInvoicesByPeriod();
          }
        }, 1500);
      }
    };
    reader.readAsDataURL(certificateFile);
  };

  const handleRemoveCertificate = () => {
    setActiveCertificate(null);
    setCompanyList([]);
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATE);
    toast.success('Certificado removido com sucesso.');
  };

  const getFormattedPeriod = () => {
    if (!dateRange.start || !dateRange.end) {
      return "Selecione um período";
    }
    
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    return `${formatDate(dateRange.start)} até ${formatDate(dateRange.end)}`;
  };

  const getTotalByBranch = () => {
    const matriz = allInvoices.filter(inv => inv.branch === 'matriz').length;
    const filial = allInvoices.filter(inv => inv.branch === 'filial').length;
    
    return { matriz, filial, total: matriz + filial };
  };
  
  const handleSearch = () => {
    setLoadingInvoices(true);
    
    setTimeout(() => {
      // Simulação de filtro (em produção seria uma chamada à API)
      setInvoiceFiltered(recentInvoices);
      setLoadingInvoices(false);
      toast.success("Pesquisa realizada com sucesso");
    }, 800);
  };
  
  const handleClear = () => {
    setSearchUF("Todos");
    setSearchBy("Chave");
    setRecipientCompany("Todos os Destinatários");
    setInvoiceFiltered(recentInvoices);
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
      const allIds = invoiceFiltered.map(invoice => invoice.id);
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

  const branchStats = getTotalByBranch();

  return (
    <div className="space-y-6">
      {!activeCertificate ? (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-blue-50">
            <CardTitle className="text-blue-700">Certificado Digital A1</CardTitle>
            <CardDescription>
              Configure seu certificado digital A1 para autenticação junto à SEFAZ e consultar suas notas fiscais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpjInput" className="text-lg font-semibold">
                  CNPJ da Empresa
                </Label>
                <Input
                  id="cnpjInput"
                  placeholder="Digite o CNPJ"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  maxLength={18}
                  className="font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="certificateFile" className="text-lg font-semibold">
                  Arquivo do Certificado (.pfx)
                </Label>
                <Input
                  id="certificateFile"
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleCertificateUpload}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="certificatePassword" className="text-lg font-semibold">
                  Senha do Certificado
                </Label>
                <Input
                  id="certificatePassword"
                  type="password"
                  placeholder="Digite a senha do certificado"
                  value={certificatePassword}
                  onChange={(e) => setCertificatePassword(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={handleInstallCertificate} 
                disabled={loading || !certificateFile || !certificatePassword || !cnpj}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Instalando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Instalar Certificado
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
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
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Empresas</SelectItem>
                      {companyList.map((company) => (
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
                      <span className="uppercase">clear</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tabela de resultados */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  Resultados: {invoiceFiltered.length} notas fiscais
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
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          onCheckedChange={handleSelectAll}
                          checked={selectedInvoices.size > 0 && selectedInvoices.size === invoiceFiltered.length}
                        />
                      </TableHead>
                      <TableHead className="w-[200px]">CNPJ/CPF Destinatário</TableHead>
                      <TableHead className="w-[120px]">Emissão</TableHead>
                      <TableHead>Chave</TableHead>
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead className="w-[80px]">Série</TableHead>
                      <TableHead className="w-[100px]">Número</TableHead>
                      <TableHead className="w-[200px]">CNPJ Emitente</TableHead>
                      <TableHead className="w-[120px]">IE Emitente</TableHead>
                      <TableHead className="w-[250px]">Emitente</TableHead>
                      <TableHead className="w-[60px]">UF</TableHead>
                      <TableHead className="w-[120px]">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInvoices ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-4">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                            <span>Carregando...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : invoiceFiltered.length > 0 ? (
                      invoiceFiltered.map((invoice) => (
                        <TableRow 
                          key={invoice.id}
                          className={`${invoice.status === 'processed' ? 'bg-green-50' : 'hover:bg-gray-50'} cursor-pointer`}
                          onClick={() => handleLoadInvoice(invoice)}
                        >
                          <TableCell className="p-2">
                            <Checkbox 
                              checked={selectedInvoices.has(invoice.id)}
                              onCheckedChange={() => handleSelectInvoice(invoice.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="p-2 text-sm">{
                            selectedCompany !== "all" ? 
                            companyList.find(c => c.cnpj === selectedCompany)?.cnpj : 
                            cnpj
                          }</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.date}</TableCell>
                          <TableCell className="p-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={invoice.chaveAcesso}>
                            {invoice.chaveAcesso}
                          </TableCell>
                          <TableCell className="p-2 text-sm">{invoice.tipo || 'Saída'}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.serie || '001'}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.number}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.cnpjEmitente || '00.000.000/0001-00'}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.ieEmitente || '12345678'}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.supplier}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.uf || 'SP'}</TableCell>
                          <TableCell className="p-2 text-sm">{invoice.valor || 'R$ 1.000,00'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-4 text-gray-500">
                          Nenhuma nota fiscal encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SefazIntegration;
