
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
  const [activeTab, setActiveTab] = useState("busca");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [hasCertificate, setHasCertificate] = useState(false);
  
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [uf, setUf] = useState("AC");
  const [tipoDocumento, setTipoDocumento] = useState("compra");
  
  const handleCertificateUpload = (file: File) => {
    setCertificate(file);
    toast.success(`Certificado "${file.name}" carregado com sucesso`);
  };

  const handleSaveCertificate = () => {
    if (!certificate) {
      toast.error("Por favor, selecione um certificado digital");
      return;
    }

    if (!certificatePassword) {
      toast.error("Por favor, informe a senha do certificado");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasCertificate(true);
      toast.success("Certificado digital configurado com sucesso!");
    }, 1500);
  };

  const handleSearch = () => {
    if (!hasCertificate) {
      toast.error("Configure seu certificado digital antes de realizar a busca");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      const results = generateSampleInvoices(tipoDocumento);
      setSearchResults(results);
      setIsLoading(false);
      toast.success(`${results.length} notas fiscais encontradas`);
    }, 2000);
  };

  const generateSampleInvoices = (tipo: string) => {
    const results = [];
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth();
    
    const emitentes = [
      { nome: "Distribuidora ABC LTDA", cnpj: "12.345.678/0001-90" },
      { nome: "Atacadão Produtos EIRELI", cnpj: "98.765.432/0001-21" },
      { nome: "Importadora Nacional S/A", cnpj: "45.678.901/0001-56" },
      { nome: "Indústria de Confecções Ltda", cnpj: "78.901.234/0001-67" },
      { nome: "Fornecedora de Calçados ME", cnpj: "23.456.789/0001-10" }
    ];
    
    const count = tipo === 'compra' ? 12 : 8;
    
    for (let i = 0; i < count; i++) {
      const randomDay = Math.floor(Math.random() * 28) + 1;
      const randomMonth = Math.floor(Math.random() * 3);
      const emissaoDate = new Date(currentYear, currentMonth - randomMonth, randomDay);
      
      const emitenteIndex = Math.floor(Math.random() * emitentes.length);
      const emitente = tipo === 'compra' ? emitentes[emitenteIndex] : { nome: "Sua Empresa", cnpj: "11.222.333/0001-44" };
      const destinatario = tipo === 'compra' ? { nome: "Sua Empresa", cnpj: "11.222.333/0001-44" } : emitentes[emitenteIndex];
      
      const valorTotal = (Math.random() * 10000 + 1000).toFixed(2);
      const numeroNF = Math.floor(Math.random() * 900000) + 100000;
      const chaveAcesso = generateRandomChaveAcesso();
      const quantidadeItens = Math.floor(Math.random() * 20) + 1;
      
      results.push({
        chave: chaveAcesso,
        numero: numeroNF.toString(),
        emissao: emissaoDate.toLocaleDateString('pt-BR'),
        emitente: tipo === 'compra' ? emitente.nome : destinatario.nome,
        cnpjEmitente: tipo === 'compra' ? emitente.cnpj : destinatario.cnpj,
        valor: `R$ ${valorTotal}`,
        status: "Autorizada",
        tipo: tipo === 'compra' ? 'Entrada' : 'Saída',
        quantidadeItens: quantidadeItens
      });
    }
    
    return results.sort((a, b) => {
      const dateA = new Date(a.emissao.split('/').reverse().join('-'));
      const dateB = new Date(b.emissao.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  };

  const generateRandomChaveAcesso = () => {
    let chave = '';
    for (let i = 0; i < 44; i++) {
      chave += Math.floor(Math.random() * 10);
    }
    return chave;
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

  const downloadSelectedNotes = () => {
    if (selectedNotes.size === 0) {
      toast.error("Selecione pelo menos uma nota para baixar");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);

      const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
      <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
          <infNFe Id="NFe${Array.from(selectedNotes)[0]}" versao="4.00">
            <ide>
              <cUF>12</cUF>
              <cNF>12345678</cNF>
              <natOp>VENDA</natOp>
              <mod>55</mod>
              <serie>1</serie>
              <nNF>123456</nNF>
              <dhEmi>2023-05-15T14:30:00-03:00</dhEmi>
              <tpNF>1</tpNF>
              <idDest>1</idDest>
              <cMunFG>1200401</cMunFG>
              <tpImp>1</tpImp>
              <tpEmis>1</tpEmis>
              <cDV>1</cDV>
              <tpAmb>2</tpAmb>
              <finNFe>1</finNFe>
              <indFinal>0</indFinal>
              <indPres>9</indPres>
              <procEmi>0</procEmi>
              <verProc>1.0</verProc>
            </ide>
            <emit>
              <CNPJ>12345678901234</CNPJ>
              <xNome>EMPRESA TESTE LTDA</xNome>
              <enderEmit>
                <xLgr>RUA TESTE</xLgr>
                <nro>123</nro>
                <xBairro>CENTRO</xBairro>
                <cMun>1200401</cMun>
                <xMun>RIO BRANCO</xMun>
                <UF>AC</UF>
                <CEP>69900000</CEP>
              </enderEmit>
              <IE>1234567890</IE>
              <CRT>3</CRT>
            </emit>
            <det nItem="1">
              <prod>
                <cProd>001</cProd>
                <cEAN>7891234567890</cEAN>
                <xProd>CALCA JEANS MASCULINA AZUL</xProd>
                <NCM>62034200</NCM>
                <CFOP>5102</CFOP>
                <uCom>UN</uCom>
                <qCom>10.0000</qCom>
                <vUnCom>59.9000</vUnCom>
                <vProd>599.00</vProd>
              </prod>
              <imposto>
                <ICMS>
                  <ICMS00>
                    <orig>0</orig>
                    <CST>00</CST>
                    <modBC>0</modBC>
                    <vBC>599.00</vBC>
                    <pICMS>17.00</pICMS>
                    <vICMS>101.83</vICMS>
                  </ICMS00>
                </ICMS>
              </imposto>
            </det>
            <det nItem="2">
              <prod>
                <cProd>002</cProd>
                <cEAN>7891234567891</cEAN>
                <xProd>CAMISA SOCIAL BRANCA</xProd>
                <NCM>62052000</NCM>
                <CFOP>5102</CFOP>
                <uCom>UN</uCom>
                <qCom>5.0000</qCom>
                <vUnCom>79.9000</vUnCom>
                <vProd>399.50</vProd>
              </prod>
              <imposto>
                <ICMS>
                  <ICMS00>
                    <orig>0</orig>
                    <CST>00</CST>
                    <modBC>0</modBC>
                    <vBC>399.50</vBC>
                    <pICMS>17.00</pICMS>
                    <vICMS>67.92</vICMS>
                  </ICMS00>
                </ICMS>
              </imposto>
            </det>
            <total>
              <ICMSTot>
                <vBC>998.50</vBC>
                <vICMS>169.75</vICMS>
                <vProd>998.50</vProd>
                <vNF>998.50</vNF>
              </ICMSTot>
            </total>
          </infNFe>
        </NFe>
      </nfeProc>`;

      onNfeLoaded(sampleXml);
      
      toast.success(`${selectedNotes.size} nota(s) baixada(s) com sucesso!`);
    }, 2000);
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
                        Configurando...
                      </>
                    ) : (
                      "Salvar Certificado"
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
                          Certificado configurado com sucesso
                        </p>
                        <p className="mt-2 text-sm text-green-700">
                          {certificate?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setCertificate(null);
                      setCertificatePassword("");
                      setHasCertificate(false);
                    }}
                    className="w-full"
                  >
                    Alterar Certificado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Empresas Vinculadas ao Certificado</CardTitle>
              <CardDescription>
                CNPJs de matriz e filiais associados a este certificado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Matriz - Rio Branco</p>
                      <p className="text-sm text-gray-600">11.222.333/0001-44</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium py-1 px-2 rounded">
                      Principal
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Filial - Epitaciolândia</p>
                      <p className="text-sm text-gray-600">11.222.333/0002-25</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium py-1 px-2 rounded">
                      Filial
                    </div>
                  </div>
                </div>
              </div>
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="periodo_fim">Data Final</Label>
                  <Input 
                    id="periodo_fim" 
                    type="date" 
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
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
                
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select defaultValue="todas">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="matriz">Matriz - Rio Branco</SelectItem>
                      <SelectItem value="filial">Filial - Epitaciolândia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleSearch} 
                disabled={isLoading}
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
                        <th className="p-2">Ações</th>
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
                          <td className="p-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                toast.info(`Detalhes da Nota ${note.numero}`);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </td>
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
