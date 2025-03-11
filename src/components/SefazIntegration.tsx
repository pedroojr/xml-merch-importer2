import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, Search, AlertCircle, CheckCircle, Calendar, Shield, Loader2, XCircle, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
  const [certificateError, setCertificateError] = useState<string>('');
  
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await axios.head('/api/health-check', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
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
    setCertificateError('');
  };

  const validateAccessKey = () => {
    if (accessKey.length !== 44) {
      toast({
        title: "Erro na chave de acesso",
        description: "A chave de acesso deve ter 44 dígitos",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateCertificate = async () => {
    if (!certificate) {
      toast({
        title: "Certificado não selecionado",
        description: "Por favor, selecione um certificado digital A1",
        variant: "destructive"
      });
      return false;
    }

    if (!certificatePassword) {
      toast({
        title: "Senha não informada",
        description: "Por favor, insira a senha do certificado",
        variant: "destructive"
      });
      return false;
    }

    setValidationLoading(true);
    setErrorDetails('');
    setCertificateError('');
    
    try {
      if (apiStatus === 'unavailable') {
        const certificateData: CertificateInfo = {
          valid: true,
          expirationDate: 'Não verificado',
          filename: certificate.name
        };
        
        setCertificateInfo(certificateData);
        localStorage.setItem('certificateInfo', JSON.stringify(certificateData));
        
        toast({
          title: "Modo de demonstração",
          description: "Backend indisponível. Usando certificado sem validação para demonstração.",
          variant: "default"
        });
        
        setErrorDetails('O backend de validação não está disponível (erro 404). O aplicativo está em modo de demonstração, considerando o certificado como válido para permitir testes de interface.');
        
        return true;
      }

      const formData = new FormData();
      formData.append('certificate', certificate);
      formData.append('password', certificatePassword);

      const response = await axios.post('/api/validate-certificate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 45000
      });

      if (response.data.valid) {
        const certificateData: CertificateInfo = {
          valid: true,
          expirationDate: response.data.expirationDate || 'Data não disponível',
          filename: certificate.name
        };
        
        setCertificateInfo(certificateData);
        
        localStorage.setItem('certificateInfo', JSON.stringify(certificateData));
        
        toast({
          title: "Certificado válido",
          description: `Certificado digital válido até ${response.data.expirationDate || 'data não disponível'}!`,
          variant: "default"
        });
        return true;
      } else {
        setCertificateInfo({
          valid: false,
          errorMessage: response.data.message || 'Certificado inválido ou senha incorreta'
        });
        
        setCertificateError('Certificado inválido ou senha incorreta');
        setErrorDetails(response.data.message || 'Certificado inválido ou senha incorreta');
        
        toast({
          title: "Erro no certificado",
          description: response.data.message || 'Certificado inválido ou senha incorreta',
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao validar certificado:', error);
      
      let errorMsg = 'Erro ao validar o certificado. Verifique as credenciais e tente novamente.';
      let technicalDetails = '';
      
      if (error.response) {
        if (error.response.status === 404) {
          const certificateData: CertificateInfo = {
            valid: true,
            expirationDate: 'Não verificado (modo de demonstração)',
            filename: certificate.name
          };
          
          setCertificateInfo(certificateData);
          localStorage.setItem('certificateInfo', JSON.stringify(certificateData));
          
          setApiStatus('unavailable');
          
          toast({
            title: "Modo de demonstração ativado",
            description: "Validador indisponível. Certificado aceito para demonstração.",
          });
          
          setErrorDetails('O serviço de validação de certificados não está disponível (erro 404). O aplicativo está em modo de demonstração, aceitando seu certificado sem validação para permitir testes de interface.');
          
          return true;
        } else {
          errorMsg = error.response.data?.message || 'Erro do servidor ao validar o certificado.';
          technicalDetails = `Status: ${error.response.status}, Detalhes: ${JSON.stringify(error.response.data || {})}`;
        }
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          errorMsg = 'Tempo limite de conexão excedido.';
          technicalDetails = 'O servidor demorou muito para responder. Isso pode acontecer se o certificado for muito grande ou se o servidor estiver sobrecarregado. Tente novamente ou use um certificado menor.';
        } else {
          errorMsg = 'Servidor não respondeu à solicitação.';
          technicalDetails = 'Verifique sua conexão de internet ou se o servidor backend está ativo.';
        }
        setApiStatus('unavailable');
      } else {
        errorMsg = error.message || 'Erro ao configurar a requisição.';
        technicalDetails = 'Problema na configuração da solicitação.';
      }
      
      setCertificateInfo({
        valid: false,
        errorMessage: errorMsg
      });
      
      setCertificateError('Certificado inválido ou senha incorreta');
      setErrorDetails(`${errorMsg}\n\nDetalhes técnicos: ${technicalDetails}\n\nOs seguintes problemas podem estar ocorrendo:\n1. O backend pode não estar processando corretamente o certificado.\n2. O formato do certificado pode não ser suportado (verifique se é um PFX/P12 válido).\n3. A senha do certificado pode conter caracteres especiais não suportados.\n4. A conexão com o backend pode estar instável.`);
      
      toast({
        title: "Falha na validação",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    } finally {
      setValidationLoading(false);
    }
  };

  const fetchInvoiceFromSefaz = async () => {
    if (!validateAccessKey()) return;
    
    if (!certificateInfo?.valid && !await validateCertificate()) return;

    if (apiStatus === 'unavailable') {
      toast({
        title: "Modo de demonstração",
        description: "API indisponível. Em um ambiente de produção, aqui seria feita a consulta à SEFAZ.",
        variant: "default"
      });
      
      const demoXml = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${accessKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>12345678</cNF>
        <natOp>VENDA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>123456</nNF>
        <dhEmi>2025-03-11T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>1</cDV>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>9</indPres>
        <procEmi>0</procEmi>
        <verProc>1.0</verProc>
      </ide>
      <emit>
        <CNPJ>12345678901234</CNPJ>
        <xNome>EMPRESA DEMONSTRACAO LTDA</xNome>
        <xFant>DEMO</xFant>
        <enderEmit>
          <xLgr>RUA EXEMPLO</xLgr>
          <nro>123</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1123456789</fone>
        </enderEmit>
        <IE>123456789012</IE>
        <CRT>3</CRT>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>123456</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>PRODUTO DEMONSTRACAO 1</xProd>
          <NCM>12345678</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>100.00</vUnCom>
          <vProd>100.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>100.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>18.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>100.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>1.65</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>100.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>7.60</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>654321</cProd>
          <cEAN>7891234567891</cEAN>
          <xProd>PRODUTO DEMONSTRACAO 2</xProd>
          <NCM>87654321</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>50.00</vUnCom>
          <vProd>100.00</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>100.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>18.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>100.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>1.65</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>100.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>7.60</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>200.00</vBC>
          <vICMS>36.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCPUFDest>0.00</vFCPUFDest>
          <vICMSUFDest>0.00</vICMSUFDest>
          <vICMSUFRemet>0.00</vICMSUFRemet>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>200.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>0.00</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>3.30</vPIS>
          <vCOFINS>15.20</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>200.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
      
      setTimeout(() => {
        onXmlReceived(demoXml);
        toast({
          title: "Demonstração concluída",
          description: "XML de demonstraç��o gerado com sucesso! Usando dados fictícios para teste.",
        });
      }, 1500);
      
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

      toast({
        title: "Consultando SEFAZ",
        description: "Consultando NF-e na SEFAZ...",
      });

      const response = await axios.post('/api/consultar-notas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000
      });

      if (response.data.success) {
        toast({
          title: "NF-e encontrada",
          description: "NF-e encontrada! Baixando XML...",
        });
        
        const downloadResponse = await axios.post('/api/download-notas', {
          accessKey: accessKey
        }, {
          responseType: 'text',
          timeout: 30000
        });

        if (downloadResponse.data) {
          toast({
            title: "Sucesso!",
            description: "NF-e encontrada e baixada com sucesso!",
          });
          onXmlReceived(downloadResponse.data);
        } else {
          toast({
            title: "Erro no download",
            description: "Erro ao baixar o XML da NF-e",
            variant: "destructive"
          });
          setErrorDetails('O servidor retornou uma resposta vazia ao tentar baixar o XML da NF-e');
        }
      } else {
        toast({
          title: "Erro na consulta",
          description: response.data.message || 'Erro ao consultar a NF-e',
          variant: "destructive"
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
        if (error.code === 'ECONNABORTED') {
          errorMsg = 'Tempo limite de conexão excedido ao consultar a SEFAZ.';
          technicalDetails = 'A consulta SEFAZ demorou muito tempo para responder. Isso pode ocorrer por sobrecarga no servidor SEFAZ ou problemas na conexão.';
        } else {
          errorMsg = 'Servidor não respondeu à solicitação.';
          technicalDetails = 'Verifique sua conexão de internet ou se o servidor backend está ativo.';
        }
        setApiStatus('unavailable');
      } else {
        errorMsg = error.message || 'Erro ao configurar a requisição.';
        technicalDetails = 'Problema na configuração da solicitação.';
      }
      
      toast({
        title: "Erro na consulta",
        description: errorMsg,
        variant: "destructive"
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
    setCertificateError('');
    localStorage.removeItem('certificateInfo');
    setErrorDetails('');
    toast({
      description: 'Informações do certificado removidas',
    });
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
              O aplicativo funcionará em modo de demonstração para permitir testes.
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
        
        {apiStatus === 'unavailable' && certificateInfo?.valid && (
          <Alert className="mt-2 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">Modo de demonstração ativo</AlertTitle>
            <AlertDescription className="text-blue-600">
              O backend não está disponível, mas você pode prosseguir com o certificado em modo de demonstração.
              Dados fictícios serão usados para simulação.
            </AlertDescription>
          </Alert>
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
              <p className="text-xs text-red-500">
                {certificateError && "Use somente caracteres alfanuméricos na senha (evite caracteres especiais)"}
              </p>
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
              {fetchingNfe ? 'Buscando na SEFAZ...' : apiStatus === 'unavailable' ? 'Gerar NF-e de demonstração' : 'Buscar NF-e na SEFAZ'}
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
              {validationLoading ? 'Validando...' : apiStatus === 'unavailable' ? 'Aceitar Certificado' : 'Validar Certificado'}
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

        {certificateError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro no certificado</AlertTitle>
            <AlertDescription>
              {certificateError}
            </AlertDescription>
          </Alert>
        )}

        {errorDetails && (
          <Alert variant={apiStatus === 'unavailable' ? "default" : "destructive"} className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold">Detalhes do erro:</p>
              <p className="text-sm mt-1 whitespace-pre-line">{errorDetails}</p>
              {apiStatus !== 'unavailable' && (
                <>
                  <p className="text-xs mt-2 text-gray-800">
                    Se estiver enfrentando problemas com a conexão à SEFAZ:
                  </p>
                  <ul className="text-xs mt-1 text-gray-800 list-disc pl-5">
                    <li>Verifique se o certificado está no formato correto (PFX/P12)</li>
                    <li>Certifique-se de que a senha está correta (sem caracteres especiais não suportados)</li>
                    <li>O tamanho do certificado pode estar afetando o processamento</li>
                    <li>Verifique se o backend está configurado para lidar com arquivos de certificado</li>
                  </ul>
                </>
              )}
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
