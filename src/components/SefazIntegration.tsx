
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, Search, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import axios from 'axios';

interface SefazIntegrationProps {
  onXmlReceived: (xmlContent: string) => void;
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onXmlReceived }) => {
  const [accessKey, setAccessKey] = useState<string>('');
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const handleAccessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
    if (value.length <= 44) { // Limita a 44 dígitos
      setAccessKey(value);
    }
  };

  const handleCertificateSelect = (file: File) => {
    setCertificate(file);
    setIsVerified(false);
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

    setIsLoading(true);
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
        setIsVerified(true);
        toast.success('Certificado digital válido!');
        return true;
      } else {
        toast.error(response.data.message || 'Certificado inválido ou senha incorreta');
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      toast.error('Erro ao validar o certificado. Verifique os logs para mais detalhes.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvoiceFromSefaz = async () => {
    if (!validateAccessKey()) return;
    if (!isVerified && !await validateCertificate()) return;

    setIsLoading(true);
    try {
      // Criando FormData para enviar os dados
      const formData = new FormData();
      if (certificate) formData.append('certificate', certificate);
      formData.append('password', certificatePassword);
      formData.append('accessKey', accessKey);

      // Fazendo a requisição para consultar a NF-e
      const response = await axios.post('/api/consultar-notas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Se a consulta for bem-sucedida, baixar o XML
        const downloadResponse = await axios.post('/api/download-notas', {
          accessKey: accessKey
        }, {
          responseType: 'text'
        });

        if (downloadResponse.data) {
          toast.success('NF-e encontrada e baixada com sucesso!');
          onXmlReceived(downloadResponse.data);
        } else {
          toast.error('Erro ao baixar o XML da NF-e');
        }
      } else {
        toast.error(response.data.message || 'Erro ao consultar a NF-e');
      }
    } catch (error: any) {
      console.error('Erro ao consultar NF-e:', error);
      toast.error(`Erro ao consultar a NF-e: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Consulta NF-e na SEFAZ</CardTitle>
        <CardDescription>
          Insira a chave de acesso e o certificado digital A1 para buscar a NF-e diretamente da SEFAZ
        </CardDescription>
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
              {isVerified && <CheckCircle size={16} className="text-green-500" />}
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

        <div className="flex gap-3">
          <Button
            onClick={validateCertificate}
            variant="outline"
            disabled={!certificate || isLoading}
            className="flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Validar Certificado
          </Button>
          
          <Button
            onClick={fetchInvoiceFromSefaz}
            disabled={!accessKey || isLoading}
            className="flex items-center gap-2"
          >
            <Search size={16} />
            Buscar NF-e na SEFAZ
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-sm text-slate-600">Processando solicitação...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SefazIntegration;
