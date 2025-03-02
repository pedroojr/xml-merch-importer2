
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSearch, Download, Check, Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Product } from '@/types/nfe';
import { parseNFeXML } from '@/utils/nfeParser';

interface SefazIntegrationProps {
  onNfeLoaded: (products: Product[]) => void;
}

interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  supplier: string;
  status: 'processed' | 'pending';
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [nfeKey, setNfeKey] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceItem[]>([
    { id: '1', number: '12345678', date: '15/05/2023', supplier: 'Fornecedor ABC', status: 'processed' },
    { id: '2', number: '87654321', date: '10/05/2023', supplier: 'Distribuidora XYZ', status: 'pending' },
    { id: '3', number: '45678123', date: '05/05/2023', supplier: 'Indústria 123', status: 'pending' }
  ]);

  const handleConsultNfe = async () => {
    if (!nfeKey || nfeKey.length !== 44) {
      toast.error('Chave da NF-e inválida. Deve conter 44 dígitos.');
      return;
    }

    if (!cnpj || cnpj.length < 14) {
      toast.error('CNPJ inválido.');
      return;
    }

    setLoading(true);
    try {
      // Simulação - em produção, isso seria uma chamada de API real
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulando uma resposta XML mock para fins de demonstração
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
      
      const parsedProducts = parseNFeXML(mockXmlResponse);
      
      // Atualiza a lista de invoices recentes
      const newInvoice: InvoiceItem = {
        id: new Date().getTime().toString(),
        number: '123456', // Em produção, extrair do XML
        date: new Date().toLocaleDateString('pt-BR'),
        supplier: 'Fornecedor via SEFAZ',
        status: 'processed'
      };
      
      setRecentInvoices([newInvoice, ...recentInvoices]);
      
      // Passa os produtos para o componente pai
      onNfeLoaded(parsedProducts);
      
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
    
    // Simulação de carregamento
    setTimeout(() => {
      // Simulação de uma consulta bem sucedida
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
      
      const parsedProducts = parseNFeXML(mockXmlResponse);
      
      // Atualiza o status da invoice
      const updatedInvoices = recentInvoices.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'processed' as const } : inv
      );
      setRecentInvoices(updatedInvoices);
      
      // Passa os produtos para o componente pai
      onNfeLoaded(parsedProducts);
      
      toast.success(`Nota ${invoice.number} carregada com sucesso!`);
      setLoading(false);
    }, 1500);
  };

  // Formata o CNPJ enquanto o usuário digita
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

  // Formata a chave da NF-e enquanto o usuário digita
  const formatNfeKey = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.substring(0, 44);
  };

  return (
    <div className="space-y-6">
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
        <CardHeader>
          <CardTitle>Notas Fiscais Disponíveis</CardTitle>
          <CardDescription>
            Notas fiscais emitidas contra seu CNPJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentInvoices.length > 0 ? (
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
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Nenhuma nota fiscal disponível.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SefazIntegration;
