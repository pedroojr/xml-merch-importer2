import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, AlertCircle, Loader2, Search } from "lucide-react";
import { toast } from '@/hooks/use-toast';
import axios from 'axios';

interface DataSystemIntegrationProps {
  xmlContent?: string | null;
}

interface ProductVerification {
  codigo: string;
  descricao: string;
  exists: boolean;
}

const DataSystemIntegration: React.FC<DataSystemIntegrationProps> = ({ xmlContent }) => {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [verifiedProducts, setVerifiedProducts] = useState<ProductVerification[]>([]);

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

  const analyzeProducts = async () => {
    if (!xmlContent || !token) {
      toast({
        title: "Erro",
        description: "XML ou token não disponível",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setErrorDetails('');
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const ns = "http://www.portalfiscal.inf.br/nfe";
      const items = xmlDoc.getElementsByTagNameNS(ns, "det");
      
      const productsToVerify: ProductVerification[] = [];
      
      for (let i = 0; i < items.length; i++) {
        const prod = items[i].getElementsByTagNameNS(ns, "prod")[0];
        const codigo = prod.getElementsByTagNameNS(ns, "cProd")[0]?.textContent || "";
        const descricao = prod.getElementsByTagNameNS(ns, "xProd")[0]?.textContent || "";
        
        try {
          const response = await axios.get(
            `https://integracaodshomologacao.useserver.com.br/api/v1/produtos/${codigo}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          productsToVerify.push({
            codigo,
            descricao,
            exists: response.status === 200
          });
        } catch (error) {
          productsToVerify.push({
            codigo,
            descricao,
            exists: false
          });
        }
      }
      
      setVerifiedProducts(productsToVerify);
      toast({
        title: "Análise concluída",
        description: `${productsToVerify.length} produtos analisados`,
      });
    } catch (error: any) {
      console.error('Erro ao analisar produtos:', error);
      const errorMsg = error.response?.data?.message || 'Erro ao analisar produtos no DataSystem';
      setErrorDetails(errorMsg);
      toast({
        title: "Erro na análise",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
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

  useEffect(() => {
    if (xmlContent && token) {
      analyzeProducts();
    }
  }, [xmlContent, token]);

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
              disabled={isLoading || isAnalyzing}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Autenticar no DataSystem
            </Button>
            
            <Button
              onClick={analyzeProducts}
              disabled={!token || isLoading || isAnalyzing || !xmlContent}
              variant="outline"
              className="flex-1"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Analisar Produtos
            </Button>
            
            <Button
              onClick={handleSendToDataSystem}
              disabled={!token || isLoading || isAnalyzing || !xmlContent}
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

        {verifiedProducts.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium mb-2">Resultado da Análise:</h3>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {verifiedProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.codigo}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{product.descricao}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.exists ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.exists ? 'Existente' : 'Novo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
