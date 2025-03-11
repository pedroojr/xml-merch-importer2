
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Database, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-slate-900">
          Sistema de Importação de NF-e
        </h1>
        <p className="text-xl text-slate-600">
          Escolha uma das opções abaixo para começar
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/importacao">
          <Button
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50"
          >
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-lg font-medium">Importar XML</span>
          </Button>
        </Link>

        <Link to="/produtos">
          <Button
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:border-green-500 hover:bg-green-50"
          >
            <Database className="h-8 w-8 text-green-600" />
            <span className="text-lg font-medium">Produtos</span>
          </Button>
        </Link>

        <Link to="/configuracoes">
          <Button
            variant="outline"
            className="w-full h-32 flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-50"
          >
            <Settings className="h-8 w-8 text-purple-600" />
            <span className="text-lg font-medium">Configurações</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
