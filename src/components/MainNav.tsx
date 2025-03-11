
import { Home, FileText, Database, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const MainNav = () => {
  return (
    <nav className="bg-white border-b mb-6">
      <div className="max-w-[2000px] mx-auto px-4">
        <div className="flex h-16 items-center space-x-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            <Home size={20} />
            <span>Início</span>
          </NavLink>
          
          <NavLink
            to="/importacao"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            <FileText size={20} />
            <span>Importação XML</span>
          </NavLink>
          
          <NavLink
            to="/produtos"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            <Database size={20} />
            <span>Produtos</span>
          </NavLink>
          
          <NavLink
            to="/configuracoes"
            className={({ isActive }) =>
              `flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            <Settings size={20} />
            <span>Configurações</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
