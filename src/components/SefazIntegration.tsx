import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, Search, AlertCircle, CheckCircle, Calendar, Shield, Loader2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SefazIntegrationProps {
  onXmlReceived: (xmlContent: string) => void;
}

interface CertificateInfo {
  valid: boolean;
  expirationDate?: string;
  filename?: string;
  errorMessage?: string;
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onXmlReceived }) => {
  const [accessKey, setAccessKey] = useState<string>('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationLoading, setValidationLoading] = useState<boolean>(false);
  const [certificateInfo, setCertificateInfo] = useState<CertificateInfo | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [fetchingNfe, setFetchingNfe] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<'available' | 'unavailable' | 'unknown'>('unknown');
  
  React.useEffect(() => {
    const savedCertificateInfo = localStorage.getItem('certificateInfo');
    if (savedCertificateInfo) {
      try {
        setCertificateInfo(JSON.parse(savedCertificateInfo));
      } catch (e) {
        console.error('Erro ao carregar informações do certificado salvo:', e);
      }
    }
    
    checkApiAvailability();
  }, []);
  
  const checkApiAvailability = async () => {
    try {
      await axios.head('/api/health-check');
      setApiStatus('available');
    } catch (error) {
      console.error('API não disponível:', error);
      setApiStatus('unavailable');
    }
  };

  const handleAccessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 44) {
      setAccessKey(value);
    }
  };

  const handleCertificateSelect = (file: File) => {
    setCertificate(file);
    setCertificateInfo(null);
    setErrorDetails('');
  };

  const validateAccessKey = () => {
    if (accessKey.length !== 44) {
      toast.error('A chave de acesso deve ter 44 dígitos');
      return false;
    }
    return true;
  };

  const validateCertificate = async () => {
    if (!certificate) {
      toast.error('Por favor, selecione um certificado digital A1');
      return false;
    }

    if (!certificatePassword) {
      toast.error('Por favor, insira a senha do certificado');
      return false;
    }

    setValidationLoading(true);
    setErrorDetails('');
    
    try {
      const formData = new FormData();
      formData.append('certificate', certificate);
      formData.append('password', certificatePassword);

      if (apiStatus === 'unavailable') {
        throw new Error('O serviço de validação de certificados não está disponível no momento.');
      }

      const response = await axios.post('/api/validate-certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.valid) {
        const certificateData: CertificateInfo = {
          valid: true,
          expirationDate: response.data.expirationDate || 'Data não disponível',
          filename: certificate.name
        };
        
        setCertificateInfo(certificateData);
        
        localStorage.setItem('certificateInfo', JSON.stringify(certificateData));
        
        toast.success(`Certificado digital válido até ${response.data.expirationDate || 'data não disponível'}!`);
        return true;
      } else {
        setCertificateInfo({
          valid: false,
          errorMessage: response.data.message || 'Certificado inválido ou senha incorreta'
        });
        setErrorDetails(response.data.message || 'Certificado inválido ou senha incorreta');
        toast.error(response.data.message || 'Certificado inválido ou senha incorreta');
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao validar certificado:', error);
      
      let errorMsg = 'Erro ao validar o certificado. Verifique as credenciais e tente novamente.';
      let technicalDetails = '';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMsg = 'Serviço de validação de certificado não encontrado (404).';
          technicalDetails = 'O endpoint da API para validação de certificados não está disponível. Verifique se o serviço backend está configurado corretamente.';
          setApiStatus('unavailable');
        } else {
          errorMsg = error.response.data?.message || 'Erro do servidor ao validar o certificado.';
          technicalDetails = `Status: ${error.response.status}, Detalhes: ${JSON.stringify(error.response.data || {})}`;
        }
      } else if (error.request) {
        errorMsg = 'Servidor não respondeu à solicitação.';
        technicalDetails = 'Verifique sua conexão de internet ou se o servidor backend está ativo.';
        setApiStatus('unavailable');
      } else {
        errorMsg = error.message || 'Erro ao configurar a requisição.';
        technicalDetails = 'Problema na configuração da solicitação.';
      }
      
      setCertificateInfo({
        valid: false,
        errorMessage: errorMsg
      });
      
      setErrorDetails(`${errorMsg}\n\nDetalhes técnicos: ${technicalDetails}`);
      toast.error(errorMsg);
      return false;
    } finally {
      setValidationLoading(false);
    }
  };

  const fetchInvoiceFromSefaz = async () => {
    if (!validateAccessKey()) return;
    
    if (!certificateInfo?.valid && !await validateCertificate()) return;

    if (apiStatus === 'unavailable') {
      toast.error('O serviço de consulta SEFAZ não está disponível no momento.');
      setErrorDetails('O endpoint da API para consulta à SEFAZ não está disponível. Verifique se o serviço backend está configurado corretamente.');
      return;
    }

    setFetchingNfe(true);
    setIsLoading(true);
    setErrorDetails('');
    
    try {
      const formData = new FormData();
      if (certificate) formData.append('certificate', certificate);
      formData.append('password', certificatePassword);
      formData.append('accessKey', accessKey);

      toast.loading('Consultando NF-e na SEFAZ...', {
        id: 'sefaz-query',
      });

      const response = await axios.post('/api/consultar-notas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('NF-e encontrada! Baixando XML...', {
          id: 'sefaz-query',
        });
        
        const downloadResponse = await axios.post('/api/download-notas', {
          accessKey: accessKey
        }, {
          responseType: 'text'
        });

        if (downloadResponse.data) {
          toast.success('NF-e encontrada e baixada com sucesso!', {
            id: 'sefaz-query',
          });
          onXmlReceived(downloadResponse.data);
        } else {
          toast.error('Erro ao baixar o XML da NF-e', {
            id: 'sefaz-query',
          });
          setErrorDetails('O servidor retornou uma resposta vazia ao tentar baixar o XML da NF-e');
        }
      } else {
        toast.error(response.data.message || 'Erro ao consultar a NF-e', {
          id: 'sefaz-query',
        });
        setErrorDetails(response.data.technicalDetails || response.data.message || 'Erro desconhecido ao consultar a NF-e');
      }
    } catch (error: any) {
      console.error('Erro ao consultar NF-e:', error);
      
      let errorMsg = 'Erro ao consultar a NF-e.';
      let technicalDetails = '';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMsg = 'Serviço de consulta SEFAZ não encontrado (404).';
          technicalDetails = 'O endpoint da API para consulta SEFAZ não está disponível. Verifique se o serviço backend está configurado corretamente.';
          setApiStatus('unavailable');
        } else {
          errorMsg = error.response.data?.message || 'Erro do servidor ao consultar a NF-e.';
          technicalDetails = `Status: ${error.response.status}, Detalhes: ${JSON.stringify(error.response.data || {})}`;
        }
      } else if (error.request) {
        errorMsg = 'Servidor não respondeu à solicitação.';
        technicalDetails = 'Verifique sua conexão de internet ou se o servidor backend está ativo.';
        setApiStatus('unavailable');
      } else {
        errorMsg = error.message || 'Erro ao configurar a requisição.';
        technicalDetails = 'Problema na configuração da solicitação.';
      }
      
      toast.error(errorMsg, {
        id: 'sefaz-query',
      });
      setErrorDetails(`${errorMsg}\n\nDetalhes técnicos: ${technicalDetails}`);
    } finally {
      setIsLoading(false);
      setFetchingNfe(false);
    }
  };

  const clearCertificateInfo = () => {
    setCertificateInfo(null);
    setCertificate(null);
    setCertificatePassword('');
    localStorage.removeItem('certificateInfo');
    setErrorDetails('');
    toast.success('Informações do certificado removidas');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Consulta NF-e na SEFAZ</CardTitle>
        <CardDescription>
          Insira a chave de acesso e o certificado digital A1 para buscar a NF-e diretamente da SEFAZ
        </CardDescription>
        {apiStatus === 'unavailable' && (
          <Alert variant="destructive" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Serviço indisponível</AlertTitle>
            <AlertDescription>
              O serviço de integração com a SEFAZ não está disponível no momento. 
              Verifique se o backend está configurado corretamente.
            </AlertDescription>
          </Alert>
        )}
        {certificateInfo?.valid && (
          <div className="mt-2 flex items-center gap-2 text-sm bg-green-50 text-green-700 p-2 rounded-md border border-green-200">
            <Shield size={16} className="text-green-600" />
            <span className="font-semibold">Certificado válido</span>
            <span className="mx-1">•</span>
            <Calendar size={16} className="text-green-600" />
            <span>Expira em: {certificateInfo.expirationDate}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearCertificateInfo}
              className="ml-auto text-gray-500 hover:text-red-500"
            >
              <XCircle size={16} />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="accessKey">Chave de Acesso da NF-e (44 dígitos)</Label>
          <Input
            id="accessKey"
            placeholder="Digite a chave de acesso da NF-e"
            value={accessKey}
            onChange={handleAccessKeyChange}
            maxLength={44}
            className="font-mono"
          />
          <p className="text-xs text-gray-500">
            {accessKey.length}/44 dígitos
          </p>
        </div>

        {!certificateInfo?.valid && (
          <>
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificado Digital A1 (.pfx ou .p12)</Label>
              <FileUpload 
                onFileSelect={handleCertificateSelect} 
                accept={{
                  'application/x-pkcs12': ['.pfx', '.p12']
                }}
                acceptedFileTypes={['.pfx', '.p12']}
                fileTypeDescription="Certificados Digitais A1 (PFX, P12)"
              />
              {certificate && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={16} className="text-blue-500" />
                  <span>{certificate.name}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha do Certificado</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha do certificado digital"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
              />
            </div>
          </>
        )}
        
        {certificateInfo?.valid ? (
          <div className="flex flex-col gap-3">
            <Button
              onClick={fetchInvoiceFromSefaz}
              disabled={!accessKey || fetchingNfe || apiStatus === 'unavailable'}
              className="w-full flex items-center gap-2"
            >
              {fetchingNfe ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              {fetchingNfe ? 'Buscando na SEFAZ...' : 'Buscar NF-e na SEFAZ'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              onClick={validateCertificate}
              variant="outline"
              disabled={!certificate || !certificatePassword || validationLoading || apiStatus === 'unavailable'}
              className="flex-1 flex items-center gap-2"
            >
              {validationLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {validationLoading ? 'Validando...' : 'Validar Certificado'}
            </Button>
            <Button
              onClick={checkApiAvailability}
              variant="outline"
              className="flex items-center gap-2"
              size="icon"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        )}

        {errorDetails && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold">Detalhes do erro:</p>
              <p className="text-sm mt-1 whitespace-pre-line">{errorDetails}</p>
              <p className="text-xs mt-2 text-gray-800">
                Se estiver enfrentando problemas com a conexão à SEFAZ:
              </p>
              <ul className="text-xs mt-1 text-gray-800 list-disc pl-5">
                <li>Verifique se o certificado está válido</li>
                <li>Confira se a URL do endpoint da SEFAZ está correta</li>
                <li>Certifique-se de que o CNPJ do certificado tem permissão para consultar a nota</li>
                <li>Verifique se o ambiente (produção/homologação) está configurado corretamente</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="text-center py-4 border border-blue-100 rounded-md bg-blue-50">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-sm text-slate-600">Processando solicitação...</p>
            <p className="text-xs text-slate-500">Aguarde enquanto nos conectamos à SEFAZ...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SefazIntegration;
