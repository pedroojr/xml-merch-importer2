
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileSearch, Download } from "lucide-react";

interface SefazIntegrationProps {
  onNfeLoaded: (xmlContent: string) => void;
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [nfeKey, setNfeKey] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
      // Normalmente, isso seria feito através de um backend devido a restrições de CORS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulando erro de autorização para fins de demonstração
      toast.error('Não foi possível obter a NF-e. Verifique suas credenciais e tente novamente.');
      
      // Em caso de sucesso, o código abaixo seria executado
      // const response = await fetch(`/api/sefaz/consulta?chave=${nfeKey}&cnpj=${cnpj}`);
      // if (!response.ok) throw new Error('Falha ao consultar NF-e');
      // const data = await response.text();
      // onNfeLoaded(data);
      // toast.success('NF-e carregada com sucesso!');
    } catch (error) {
      console.error('Erro ao consultar NF-e:', error);
      toast.error('Ocorreu um erro ao consultar a NF-e.');
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Consulta NF-e via SEFAZ</CardTitle>
          <CardDescription>
            Consulte e importe uma NF-e diretamente dos servidores da SEFAZ usando a chave de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="nfeKey" className="text-sm font-medium">
              Chave da NF-e (44 dígitos)
            </label>
            <Input
              id="nfeKey"
              placeholder="Digite a chave da NF-e"
              value={nfeKey}
              onChange={(e) => setNfeKey(formatNfeKey(e.target.value))}
              maxLength={44}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="cnpj" className="text-sm font-medium">
              CNPJ da Empresa
            </label>
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
          <CardTitle>Últimas Consultas</CardTitle>
          <CardDescription>
            Notas consultadas recentemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 italic">Nenhuma consulta recente.</p>
        </CardContent>
      </Card>
      
      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h3 className="font-medium text-blue-800 flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Saiba mais sobre a integração com SEFAZ
        </h3>
        <p className="mt-2 text-sm text-blue-700">
          Para utilizar a integração completa com a SEFAZ, é necessário configurar o certificado digital
          A1 da empresa e as credenciais de acesso no módulo Odoo. Entre em contato com o suporte para mais informações.
        </p>
      </div>
    </div>
  );
};

export default SefazIntegration;
