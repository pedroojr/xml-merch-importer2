
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertCircle, Loader2 } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

interface DataSystemIntegrationProps {
  xmlContent?: string;
}

const DataSystemIntegration: React.FC<DataSystemIntegrationProps> = ({ xmlContent }) => {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  const handleAuthentication = async () => {
    setIsLoading(true);
    setErrorDetails('');
    
    try {
      const response = await axios.post('https://integracaodshomologacao.useserver.com.br/api/v1/autenticar', {
        cnpj: '21.037.192/0002-61',
        hash: '2c400cdd1c745780cc69b63f9e357f3485157f8f',
        loja: '6739'
      });
      
      if (response.data?.token) {
        setToken(response.data.token);
        toast({
          title: "Autenticação realizada",
          description: "Token obtido com sucesso!",
        });
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao obter token de autenticação';
      setErrorDetails(errorMsg);
      toast({
        title: "Erro na autenticação",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToDataSystem = async () => {
    if (!xmlContent) {
      toast({
        title: "Erro",
        description: "Nenhum XML disponível para envio",
        variant: "destructive"
      });
      return;
    }

    if (!token) {
      toast({
        title: "Token necessário",
        description: "Por favor, autentique-se primeiro",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setErrorDetails('');

    try {
      const response = await axios.put(
        'https://integracaodshomologacao.useserver.com.br/api/v1/inclusao-xml-pedido-distribuido',
        xmlContent,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/xml'
          }
        }
      );

      if (response.status === 200) {
        toast({
          title: "Sucesso!",
          description: "XML enviado com sucesso para o DataSystem",
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar XML:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao enviar XML para o DataSystem';
      setErrorDetails(errorMsg);
      toast({
        title: "Erro no envio",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integração DataSystem USE ERP</CardTitle>
        <CardDescription>
          Envie o XML da NF-e para inclusão automática de produtos no DataSystem
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleAuthentication}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Autenticar no DataSystem
            </Button>
            
            <Button
              onClick={handleSendToDataSystem}
              disabled={!token || isLoading || !xmlContent}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar para DataSystem
            </Button>
          </div>

          {token && (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
              ✓ Autenticado no DataSystem
            </div>
          )}
        </div>

        {errorDetails && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorDetails}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-500">
          <p className="font-medium mb-2">Informações importantes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>O XML será enviado para o ambiente de homologação do DataSystem</li>
            <li>CNPJ: 21.037.192/0002-61</li>
            <li>Loja: 6739</li>
            <li>Os produtos serão incluídos automaticamente no estoque</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataSystemIntegration;
