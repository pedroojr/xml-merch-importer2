
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, Search, AlertCircle, CheckCircle, Calendar, Shield, Loader2, XCircle, RefreshCw } from "lucide-react";
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import axios from 'axios';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  // Load saved certificate from localStorage on component mount
  React.useEffect(() => {
    const savedCertificateInfo = localStorage.getItem('certificateInfo');
    if (savedCertificateInfo) {
      try {
        setCertificateInfo(JSON.parse(savedCertificateInfo));
      } catch (e) {
        console.error('Erro ao carregar informações do certificado salvo:', e);
      }
    }
  }, []);

  const handleAccessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
    if (value.length <= 44) { // Limita a 44 dígitos
      setAccessKey(value);
    }
  };

  const handleCertificateSelect = (file: File) => {
    setCertificate(file);
    setCertificateInfo(null);
    setErrorDetails('');
  };

  const validateAccessKey = () => {
    // Validação básica da chave - 44 dígitos
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
      // Criando FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('certificate', certificate);
      formData.append('password', certificatePassword);

      // Fazendo a requisição para validar o certificado
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
        
        // Salvar as informações do certificado no localStorage
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
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      'Erro ao validar o certificado. Verifique as credenciais e tente novamente.';
      
      setCertificateInfo({
        valid: false,
        errorMessage: errorMsg
      });
      
      setErrorDetails(`Erro técnico: ${errorMsg}`);
      toast.error('Falha na validação do certificado');
      return false;
    } finally {
      setValidationLoading(false);
    }
  };

  const fetchInvoiceFromSefaz = async () => {
    if (!validateAccessKey()) return;
    
    // Se o certificado já foi validado anteriormente, não precisamos validar novamente
    if (!certificateInfo?.valid && !await validateCertificate()) return;

    setFetchingNfe(true);
    setIsLoading(true);
    setErrorDetails('');
    
    try {
      // Criando FormData para enviar os dados
      const formData = new FormData();
      if (certificate) formData.append('certificate', certificate);
      formData.append('password', certificatePassword);
      formData.append('accessKey', accessKey);

      // Feedback visual para o usuário
      toast.loading('Consultando NF-e na SEFAZ...', {
        id: 'sefaz-query',
      });

      // Fazendo a requisição para consultar a NF-e
      const response = await axios.post('/api/consultar-notas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('NF-e encontrada! Baixando XML...', {
          id: 'sefaz-query',
        });
        
        // Se a consulta for bem-sucedida, baixar o XML
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
      const errorMsg = error.response?.data?.message || error.message;
      toast.error(`Erro ao consultar a NF-e: ${errorMsg}`, {
        id: 'sefaz-query',
      });
      setErrorDetails(`Erro técnico: ${errorMsg}`);
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
              disabled={!accessKey || fetchingNfe}
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
              disabled={!certificate || !certificatePassword || validationLoading}
              className="flex-1 flex items-center gap-2"
            >
              {validationLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              {validationLoading ? 'Validando...' : 'Validar Certificado'}
            </Button>
          </div>
        )}

        {errorDetails && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold">Detalhes do erro:</p>
              <p className="text-sm mt-1">{errorDetails}</p>
              <p className="text-xs mt-2 text-gray-800">
                Verifique se a senha do certificado está correta e se o certificado é válido.
                Em caso de problemas, consulte os logs do sistema para mais informações.
              </p>
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
