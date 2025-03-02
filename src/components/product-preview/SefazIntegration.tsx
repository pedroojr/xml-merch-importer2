
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSearch, Download, Check, Clock, Upload, Shield, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
}

interface Certificate {
  name: string;
  expiry: string;
  isActive: boolean;
}

interface DateRangeFilter {
  start: Date | undefined;
  end: Date | undefined;
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [nfeKey, setNfeKey] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
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

  // Carregar notas fiscais com base no filtro de período
  useEffect(() => {
    if (activeCertificate) {
      fetchInvoicesByPeriod();
    }
  }, [dateRange, activeCertificate]);

  // Simular carregamento de notas fiscais quando o certificado é ativado
  useEffect(() => {
    if (activeCertificate) {
      generateRandomInvoices();
    }
  }, [activeCertificate]);

  // Gerar notas fiscais simuladas para demonstração
  const generateRandomInvoices = () => {
    const mockInvoices: InvoiceItem[] = [];
    const today = new Date();
    
    // Gerar 50 notas fiscais aleatórias nos últimos 90 dias
    for (let i = 0; i < 50; i++) {
      const randomDaysAgo = Math.floor(Math.random() * 90);
      const emissionDate = subDays(today, randomDaysAgo);
      
      mockInvoices.push({
        id: `mock-${i}`,
        number: Math.floor(10000000 + Math.random() * 90000000).toString(),
        date: format(emissionDate, 'dd/MM/yyyy'),
        supplier: `Fornecedor ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
        status: Math.random() > 0.3 ? 'pending' : 'processed',
        emissionDate
      });
    }
    
    // Ordenar por data de emissão (mais recente primeiro)
    mockInvoices.sort((a, b) => b.emissionDate.getTime() - a.emissionDate.getTime());
    
    setAllInvoices(mockInvoices);
    fetchInvoicesByPeriod(mockInvoices);
  };

  const fetchInvoicesByPeriod = (invoices = allInvoices) => {
    if (dateRange.start && dateRange.end) {
      setLoadingInvoices(true);
      
      setTimeout(() => {
        const filteredInvoices = invoices.filter(invoice => {
          return invoice.emissionDate >= dateRange.start! && invoice.emissionDate <= dateRange.end!;
        });
        
        setRecentInvoices(filteredInvoices);
        setLoadingInvoices(false);
      }, 800);
    }
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockXmlResponse = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <infNFe versao="4.00">
              <ide>
                <nNF>123456</nNF>
              </ide>
              <det nItem="1">
                <prod>
                  <cProd>001</cProd>
                  <cEAN>7891234567890</cEAN>
                  <xProd>PRODUTO TESTE SEFAZ AZUL</xProd>
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
                  <xProd>PRODUTO TESTE SEFAZ VERMELHO</xProd>
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
      
      const newInvoice: InvoiceItem = {
        id: new Date().getTime().toString(),
        number: '123456',
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: 'Fornecedor via SEFAZ',
        status: 'processed',
        emissionDate: new Date()
      };
      
      setRecentInvoices([newInvoice, ...recentInvoices]);
      
      onNfeLoaded(mockXmlResponse);
      
      toast.success('NF-e carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao consultar NF-e:', error);
      toast.error('Ocorreu um erro ao consultar a NF-e.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadInvoice = (invoice: InvoiceItem) => {
    if (invoice.status === 'processed') {
      toast.info(`A nota ${invoice.number} já foi processada anteriormente.`);
      return;
    }
    
    setLoading(true);
    
    setTimeout(() => {
      const mockXmlResponse = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
            <infNFe versao="4.00">
              <ide>
                <nNF>${invoice.number}</nNF>
              </ide>
              <det nItem="1">
                <prod>
                  <cProd>003</cProd>
                  <cEAN>7891234567892</cEAN>
                  <xProd>PRODUTO ${invoice.supplier} VERDE</xProd>
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
      
      onNfeLoaded(mockXmlResponse);
      
      toast.success(`Nota ${invoice.number} carregada com sucesso!`);
      setLoading(false);
    }, 1500);
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

    setTimeout(() => {
      const newCertificate: Certificate = {
        name: certificateFile.name,
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        isActive: true
      };
      
      setActiveCertificate(newCertificate);
      setCertificateFile(null);
      setCertificatePassword('');
      
      toast.success('Certificado A1 instalado com sucesso!');
      setLoading(false);
    }, 1500);
  };

  const getFormattedPeriod = () => {
    if (!dateRange.start || !dateRange.end) {
      return "Selecione um período";
    }
    
    const formatDate = (date: Date) => format(date, 'dd/MM/yyyy');
    return `${formatDate(dateRange.start)} até ${formatDate(dateRange.end)}`;
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Certificado Digital A1</CardTitle>
          <CardDescription>
            Configure seu certificado digital A1 para autenticação junto à SEFAZ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeCertificate ? (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-5 w-5 text-green-500" />
              <AlertTitle>Certificado ativo</AlertTitle>
              <AlertDescription className="space-y-1">
                <p><strong>Nome:</strong> {activeCertificate.name}</p>
                <p><strong>Validade:</strong> {activeCertificate.expiry}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => setActiveCertificate(null)}
                >
                  Remover certificado
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificateFile">
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
                <Label htmlFor="certificatePassword">
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
                disabled={loading || !certificateFile || !certificatePassword}
                className="w-full"
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
          )}
        </CardContent>
      </Card>

      {activeCertificate && (
        <>
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
                />
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
                    Consultar NF-e
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Notas Fiscais Disponíveis</CardTitle>
                <CardDescription>
                  Filtrar notas fiscais emitidas contra seu CNPJ
                </CardDescription>
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
                          : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        {invoice.status === 'processed' ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">NF-e: {invoice.number}</p>
                          <p className="text-sm text-gray-500">{invoice.supplier} - {invoice.date}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadInvoice(invoice)}
                        disabled={loading}
                        className={invoice.status === 'processed' ? 'text-green-600' : ''}
                      >
                        {invoice.status === 'processed' ? 'Importada' : 'Importar'}
                      </Button>
                    </div>
                  ))}
                  
                  <div className="text-sm text-gray-500 mt-2 text-center">
                    Mostrando {recentInvoices.length} notas fiscais {dateRange.start && dateRange.end ? `de ${format(dateRange.start, 'dd/MM/yyyy')} até ${format(dateRange.end, 'dd/MM/yyyy')}` : ''}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 italic">
                    Nenhuma nota fiscal encontrada no período selecionado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SefazIntegration;
