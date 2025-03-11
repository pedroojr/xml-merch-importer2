
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUpload from '../components/FileUpload';
import SefazIntegration from '../components/SefazIntegration';
import DataSystemIntegration from '../components/DataSystemIntegration';

const ImportPage = () => {
  const [xmlContent, setXmlContent] = React.useState<string | null>(null);
  const [currentTab, setCurrentTab] = React.useState("upload");

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      setXmlContent(text);
      setCurrentTab("datasystem");
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleXmlFromSefaz = (xmlContent: string) => {
    setXmlContent(xmlContent);
    setCurrentTab("datasystem");
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Importação de XML
          </h1>
          <p className="text-slate-600">
            Faça upload do arquivo XML da NF-e ou consulte diretamente na SEFAZ
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="upload">Upload de XML</TabsTrigger>
              <TabsTrigger value="sefaz">Consulta SEFAZ</TabsTrigger>
              <TabsTrigger value="datasystem">DataSystem</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <FileUpload onFileSelect={handleFileSelect} />
            </TabsContent>
            
            <TabsContent value="sefaz">
              <SefazIntegration onXmlReceived={handleXmlFromSefaz} />
            </TabsContent>
            
            <TabsContent value="datasystem">
              <DataSystemIntegration xmlContent={xmlContent} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
