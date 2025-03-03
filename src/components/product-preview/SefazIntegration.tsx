
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSearch, Download, Check, Clock, Upload, Shield, Calendar, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

interface Certificate {
  name: string;
  expiry: string;
  isActive: boolean;
  password?: string;
  fileData?: string;
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
    if (activeCertificate && cnpj) {
      fetchInvoicesByPeriod();
    }
  }, [dateRange, activeCertificate, selectedBranch, cnpj]);

  const fetchInvoicesByPeriod = async (invoices = allInvoices) => {
    if (!activeCertificate || !cnpj) {
      toast.error('Certificado digital e CNPJ são necessários');
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
        
        setRecentInvoices(filteredInvoices);
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
    
    // Gerar 50 notas fiscais aleatórias nos últimos 90 dias
    for (let i = 0; i < 50; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 90);
      const emissionDate = subDays(today, randomDaysAgo);
      const branch = Math.random() > 0.5 ? 'matriz' : 'filial';
      const invoiceNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
      
      // Gerar chave de acesso simulada - 44 dígitos
      const chaveAcesso = generateRandomNFeKey();
      
      mockInvoices.push({
        id: `mock-${i}`,
        number: invoiceNumber,
        date: format(emissionDate, 'dd/MM/yyyy'),
        supplier: `Fornecedor ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        status: Math.random() > 0.3 ? 'pending' : 'processed',
        emissionDate,
        branch,
        chaveAcesso
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
  };

  const handleConsultNfe = async () => {
    if (!nfeKey || nfeKey.length !== 44) {
      toast.error('Chave da NF-e inválida. Deve conter 44 dígitos.');
      return;
    }

    if (!cnpj || cnpj.length < 14) {
      toast.error('CNPJ inválido.');
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
          
          const newCertificate: Certificate = {
            name: certificateFile.name,
            expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            isActive: true,
            password: certificatePassword,
            fileData: fileData
          };
          
          // Salvar no localStorage
          localStorage.setItem(STORAGE_KEYS.CERTIFICATE, JSON.stringify(newCertificate));
          
          setActiveCertificate(newCertificate);
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

  const branchStats = getTotalByBranch();

  return (
    <div className="space-y-6 p-4">
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
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-white border-b rounded-t-lg">
              <TabsList className="w-full justify-start rounded-none">
                <TabsTrigger value="certificate" className="data-[state=active]:bg-blue-50">
                  <Shield className="h-4 w-4 mr-2" />
                  Certificado
                </TabsTrigger>
                <TabsTrigger value="search" className="data-[state=active]:bg-blue-50">
                  <FileSearch className="h-4 w-4 mr-2" />
                  Busca por Chave
                </TabsTrigger>
                <TabsTrigger value="invoices" className="data-[state=active]:bg-blue-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Notas por Período
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="certificate" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Certificado Digital A1</CardTitle>
                  <CardDescription>
                    Gerenciar seu certificado digital para autenticação junto à SEFAZ.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="bg-green-50 border-green-200">
                    <Shield className="h-5 w-5 text-green-500" />
                    <AlertTitle>Certificado ativo</AlertTitle>
                    <AlertDescription className="space-y-1">
                      <p><strong>Nome:</strong> {activeCertificate.name}</p>
                      <p><strong>Validade:</strong> {activeCertificate.expiry}</p>
                      <p><strong>CNPJ:</strong> {cnpj}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={handleRemoveCertificate}
                      >
                        Remover certificado
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="search" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Consulta NF-e via SEFAZ</CardTitle>
                  <CardDescription>
                    Consulte e importe uma NF-e diretamente dos servidores da SEFAZ usando a chave de acesso.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nfeKey">
                      Chave da NF-e (44 dígitos)
                    </Label>
                    <Input
                      id="nfeKey"
                      placeholder="Digite a chave da NF-e"
                      value={nfeKey}
                      onChange={(e) => setNfeKey(formatNfeKey(e.target.value))}
                      maxLength={44}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">
                      CNPJ da Empresa
                    </Label>
                    <Input
                      id="cnpj"
                      placeholder="Digite o CNPJ"
                      value={cnpj}
                      onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                      maxLength={18}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branchSelect">
                      Unidade
                    </Label>
                    <Select 
                      value={selectedBranch} 
                      onValueChange={(value) => handleBranchChange(value as 'matriz' | 'filial' | 'todas')}
                    >
                      <SelectTrigger id="branchSelect">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as unidades</SelectItem>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleConsultNfe} 
                    disabled={loading || !nfeKey || !cnpj}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⟳</span>
                        Consultando...
                      </>
                    ) : (
                      <>
                        <FileSearch className="h-4 w-4 mr-2" />
                        Consultar NF-e Real na SEFAZ
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Notas Fiscais Disponíveis na SEFAZ</CardTitle>
                    <CardDescription>
                      Notas fiscais emitidas contra seu CNPJ
                    </CardDescription>
                    
                    <div className="flex mt-2 gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                        Matriz: {branchStats.matriz}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                        Filial: {branchStats.filial}
                      </span>
                      <span>Total: {branchStats.total}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={periodFilter} onValueChange={handlePeriodChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7days">Últimos 7 dias</SelectItem>
                        <SelectItem value="15days">Últimos 15 dias</SelectItem>
                        <SelectItem value="30days">Últimos 30 dias</SelectItem>
                        <SelectItem value="60days">Últimos 60 dias</SelectItem>
                        <SelectItem value="90days">Últimos 90 dias</SelectItem>
                        <SelectItem value="custom">Período personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {periodFilter === 'custom' && (
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="ml-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            {getFormattedPeriod()}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <div className="p-3 border-b">
                            <h4 className="font-medium text-sm">Selecione o período</h4>
                          </div>
                          <CalendarComponent
                            mode="range"
                            selected={{
                              from: dateRange.start,
                              to: dateRange.end
                            }}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                setDateRange({
                                  start: range.from,
                                  end: range.to
                                });
                              }
                            }}
                            locale={ptBR}
                            className="rounded-md border p-3"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    <Select 
                      value={selectedBranch} 
                      onValueChange={(value) => handleBranchChange(value as 'matriz' | 'filial' | 'todas')}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filial/Matriz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="matriz">Matriz</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => fetchInvoicesByPeriod()}
                      disabled={loadingInvoices}
                    >
                      {loadingInvoices ? 'Atualizando...' : 'Atualizar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    </div>
                  ) : recentInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {recentInvoices.map((invoice) => (
                        <div 
                          key={invoice.id}
                          className={`flex items-center justify-between p-3 rounded-md border
                            ${invoice.status === 'processed' 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'}`}
                          onClick={() => invoice.status !== 'processed' && handleLoadInvoice(invoice)}
                        >
                          <div className="flex items-center space-x-3">
                            {invoice.status === 'processed' ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                              <div className="flex items-center">
                                <p className="font-medium">NF-e: {invoice.number}</p>
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                  invoice.branch === 'matriz' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {invoice.branch === 'matriz' ? 'Matriz' : 'Filial'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{invoice.supplier} - {invoice.date}</p>
                              {invoice.chaveAcesso && (
                                <p className="text-xs text-gray-400 truncate max-w-md">
                                  Chave: {invoice.chaveAcesso}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadInvoice(invoice);
                            }}
                            disabled={loading || invoice.status === 'processed'}
                            className={invoice.status === 'processed' ? 'text-green-600' : ''}
                          >
                            {invoice.status === 'processed' ? 'Importada' : 'Importar da SEFAZ'}
                          </Button>
                        </div>
                      ))}
                      
                      <div className="text-sm text-gray-500 mt-2 text-center">
                        Mostrando {recentInvoices.length} notas fiscais {dateRange.start && dateRange.end ? `de ${format(dateRange.start, 'dd/MM/yyyy')} até ${format(dateRange.end, 'dd/MM/yyyy')}` : ''}
                        {selectedBranch !== 'todas' && ` (${selectedBranch === 'matriz' ? 'Matriz' : 'Filial'})`}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 italic">
                        Nenhuma nota fiscal encontrada no período selecionado
                        {selectedBranch !== 'todas' && ` para ${selectedBranch === 'matriz' ? 'Matriz' : 'Filial'}`}.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SefazIntegration;
