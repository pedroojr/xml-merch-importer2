
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FileUpload from '../FileUpload';
import { Upload, RefreshCw, Search, FileText, Download } from 'lucide-react';

interface SefazIntegrationProps {
  onNfeLoaded: (xmlContent: string) => void;
}

const SefazIntegration: React.FC<SefazIntegrationProps> = ({ onNfeLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("certificado");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [hasCertificate, setHasCertificate] = useState(false);
  
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [uf, setUf] = useState("AC");
  const [tipoDocumento, setTipoDocumento] = useState("compra");
  const [cnpj, setCnpj] = useState("");
  
  const handleCertificateUpload = (file: File) => {
    setCertificate(file);
    toast.success(`Certificado "${file.name}" carregado com sucesso`);
  };

  const handleSaveCertificate = async () => {
    if (!certificate) {
      toast.error("Por favor, selecione um certificado digital");
      return;
    }

    if (!certificatePassword) {
      toast.error("Por favor, informe a senha do certificado");
      return;
    }

    setIsLoading(true);
    
    try {
      // Criando um FormData para enviar o certificado para o backend
      const formData = new FormData();
      formData.append('certificate', certificate);
      formData.append('password', certificatePassword);
      
      // Substituir pelo endpoint real de validação do certificado
      const response = await fetch('/api/validate-certificate', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao validar certificado');
      }
      
      const data = await response.json();
      setCnpj(data.cnpj); // Obter CNPJ do certificado
      
      setHasCertificate(true);
      toast.success("Certificado digital validado com sucesso!");
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      toast.error(`Erro ao validar certificado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!hasCertificate) {
      toast.error("Configure seu certificado digital antes de realizar a busca");
      return;
    }

    if (!periodoInicio || !periodoFim) {
      toast.error("Por favor, selecione um período de consulta");
      return;
    }

    setIsLoading(true);
    
    try {
      // Parâmetros de consulta
      const params = new URLSearchParams({
        tipo: tipoDocumento,
        dataInicio: periodoInicio,
        dataFim: periodoFim,
        uf: uf,
        cnpj: cnpj
      });
      
      // Realizar a consulta real na SEFAZ através do backend
      const response = await fetch(`/api/consultar-notas?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('certificateToken')}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao consultar notas fiscais');
      }
      
      const data = await response.json();
      setSearchResults(data.notas || []);
      
      if (data.notas && data.notas.length > 0) {
        toast.success(`${data.notas.length} notas fiscais encontradas`);
      } else {
        toast.info("Nenhuma nota fiscal encontrada para o período informado");
      }
    } catch (error) {
      console.error('Erro ao consultar notas fiscais:', error);
      toast.error(`Erro na consulta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatChaveAcesso = (chave: string) => {
    if (chave.length !== 44) return chave;
    return `${chave.slice(0, 4)} ${chave.slice(4, 8)} ${chave.slice(8, 12)} ${chave.slice(12, 16)} ${chave.slice(16, 20)} ${chave.slice(20, 24)} ${chave.slice(24, 28)} ${chave.slice(28, 32)} ${chave.slice(32, 36)} ${chave.slice(36, 40)} ${chave.slice(40, 44)}`;
  };

  const toggleNoteSelection = (chave: string) => {
    const newSelection = new Set(selectedNotes);
    if (newSelection.has(chave)) {
      newSelection.delete(chave);
    } else {
      newSelection.add(chave);
    }
    setSelectedNotes(newSelection);
  };

  const selectAllNotes = () => {
    if (selectedNotes.size === searchResults.length) {
      setSelectedNotes(new Set());
    } else {
      const allChaves = searchResults.map(note => note.chave);
      setSelectedNotes(new Set(allChaves));
    }
  };

  const downloadSelectedNotes = async () => {
    if (selectedNotes.size === 0) {
      toast.error("Selecione pelo menos uma nota para baixar");
      return;
    }

    setIsLoading(true);
    
    try {
      // Enviar as chaves selecionadas para download
      const response = await fetch('/api/download-notas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('certificateToken')}`,
        },
        body: JSON.stringify({
          chaves: Array.from(selectedNotes)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao baixar notas fiscais');
      }
      
      // Se for um único XML, processar diretamente
      if (selectedNotes.size === 1) {
        const xmlContent = await response.text();
        onNfeLoaded(xmlContent);
        toast.success("Nota fiscal baixada com sucesso!");
      } else {
        // Se forem múltiplos XMLs, baixar como arquivo ZIP
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notas_fiscais.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`${selectedNotes.size} notas fiscais baixadas com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao baixar notas fiscais:', error);
      toast.error(`Erro ao baixar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="certificado" className="flex items-center gap-2">
            <Upload size={16} />
            Certificado Digital
          </TabsTrigger>
          <TabsTrigger value="busca" className="flex items-center gap-2">
            <Search size={16} />
            Busca de Notas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificado" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Certificado Digital</CardTitle>
              <CardDescription>
                Configure seu certificado digital A1 para consulta de notas fiscais diretamente na SEFAZ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasCertificate ? (
                <>
                  <div className="space-y-4">
                    <Label htmlFor="certificate">Arquivo do Certificado Digital (.pfx)</Label>
                    <div className="h-[120px]">
                      <FileUpload 
                        onFileSelect={handleCertificateUpload} 
                        acceptedFileTypes={{
                          'application/x-pkcs12': ['.pfx', '.p12'],
                          'application/octet-stream': ['.pfx', '.p12']
                        }}
                        fileTypeDescription="Suporta apenas arquivos de certificado digital (.pfx, .p12)"
                        icon={<Upload className="h-12 w-12 text-gray-400 mx-auto" />}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha do Certificado</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                      placeholder="Digite a senha do seu certificado"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveCertificate} 
                    disabled={isLoading || !certificate}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      "Validar Certificado"
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md bg-green-50 p-4 border border-green-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Certificado validado com sucesso
                        </p>
                        <p className="mt-2 text-sm text-green-700">
                          {certificate?.name}
                        </p>
                        {cnpj && (
                          <p className="mt-1 text-sm text-green-700">
                            CNPJ: {cnpj}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCertificate(null);
                      setCertificatePassword("");
                      setHasCertificate(false);
                      setCnpj("");
                      sessionStorage.removeItem('certificateToken');
                    }}
                    className="w-full"
                  >
                    Alterar Certificado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="busca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Busca de Notas Fiscais</CardTitle>
              <CardDescription>
                Consulte notas fiscais emitidas contra seu CNPJ ou emitidas por você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                  <Select value={tipoDocumento} onValueChange={setTipoDocumento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compra">Notas de Compra (Entrada)</SelectItem>
                      <SelectItem value="venda">Notas de Venda (Saída)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="periodo_inicio">Data Inicial</Label>
                  <Input 
                    id="periodo_inicio" 
                    type="date" 
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="periodo_fim">Data Final</Label>
                  <Input 
                    id="periodo_fim" 
                    type="date" 
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AC">Acre</SelectItem>
                      <SelectItem value="AL">Alagoas</SelectItem>
                      <SelectItem value="AP">Amapá</SelectItem>
                      <SelectItem value="AM">Amazonas</SelectItem>
                      <SelectItem value="BA">Bahia</SelectItem>
                      <SelectItem value="CE">Ceará</SelectItem>
                      <SelectItem value="DF">Distrito Federal</SelectItem>
                      <SelectItem value="ES">Espírito Santo</SelectItem>
                      <SelectItem value="GO">Goiás</SelectItem>
                      <SelectItem value="MA">Maranhão</SelectItem>
                      <SelectItem value="MT">Mato Grosso</SelectItem>
                      <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                      <SelectItem value="MG">Minas Gerais</SelectItem>
                      <SelectItem value="PA">Pará</SelectItem>
                      <SelectItem value="PB">Paraíba</SelectItem>
                      <SelectItem value="PR">Paraná</SelectItem>
                      <SelectItem value="PE">Pernambuco</SelectItem>
                      <SelectItem value="PI">Piauí</SelectItem>
                      <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                      <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                      <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                      <SelectItem value="RO">Rondônia</SelectItem>
                      <SelectItem value="RR">Roraima</SelectItem>
                      <SelectItem value="SC">Santa Catarina</SelectItem>
                      <SelectItem value="SP">São Paulo</SelectItem>
                      <SelectItem value="SE">Sergipe</SelectItem>
                      <SelectItem value="TO">Tocantins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || !hasCertificate}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Consultar Notas Fiscais
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {searchResults.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Resultados da Busca</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={selectAllNotes}
                  >
                    {selectedNotes.size === searchResults.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={downloadSelectedNotes}
                    disabled={selectedNotes.size === 0 || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Importar Selecionadas
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="p-2">
                          <span className="sr-only">Selecionar</span>
                        </th>
                        <th className="p-2">Número</th>
                        <th className="p-2">Emissão</th>
                        <th className="p-2">{tipoDocumento === "compra" ? "Fornecedor" : "Destinatário"}</th>
                        <th className="p-2">Valor</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Itens</th>
                        <th className="p-2">Tipo</th>
                        <th className="p-2">Chave</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {searchResults.map((note) => (
                        <tr key={note.chave} className="hover:bg-gray-50">
                          <td className="p-2">
                            <Checkbox
                              checked={selectedNotes.has(note.chave)}
                              onCheckedChange={() => toggleNoteSelection(note.chave)}
                            />
                          </td>
                          <td className="p-2 font-medium">{note.numero}</td>
                          <td className="p-2">{note.emissao}</td>
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{note.emitente}</div>
                              <div className="text-sm text-gray-500">{note.cnpjEmitente}</div>
                            </div>
                          </td>
                          <td className="p-2 font-medium">{note.valor}</td>
                          <td className="p-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {note.status}
                            </span>
                          </td>
                          <td className="p-2 text-center">{note.quantidadeItens}</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              note.tipo === 'Entrada' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {note.tipo}
                            </span>
                          </td>
                          <td className="p-2 text-xs text-gray-500">{formatChaveAcesso(note.chave)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SefazIntegration;
