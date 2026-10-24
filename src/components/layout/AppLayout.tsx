import React, { useState } from 'react';
import { 
  ChevronDown, 
  Menu, 
  X, 
  Briefcase, 
  FileSpreadsheet, 
  Clock, 
  Kanban, 
  FileText, 
  SlidersHorizontal,
  LogOut
} from 'lucide-react';
import { Cliente } from '../../mock/mockData';
import { authService } from '../../services/authService';

interface AppLayoutProps {
  children: React.ReactNode;
  activeModule: 'advisory' | 'flow';
  setActiveModule: (module: 'advisory' | 'flow') => void;
  activeView: string;
  setActiveView: (view: string) => void;
  clientes: Cliente[];
  clienteSelecionado: Cliente;
  setClienteSelecionado: (cliente: Cliente) => void;
  avisoClientesMock?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeModule,
  setActiveModule,
  activeView,
  setActiveView,
  clientes,
  clienteSelecionado,
  setClienteSelecionado,
  avisoClientesMock,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuAdvisory = [
    { id: 'dashboard', label: 'Dashboard de Horas', icon: Clock },
    { id: 'kanban', label: 'Quadro de Projetos', icon: Kanban },
    { id: 'faturas', label: 'Fechamento & Faturas', icon: FileText },
  ];

  const menuFlow = [
    { id: 'entrada_docs', label: 'Cockpit de Entrada', icon: FileSpreadsheet },
    { id: 'fila_pagamentos', label: 'Fila de Pagamentos', icon: Briefcase },
    { id: 'plano_contas', label: 'Plano de Contas', icon: SlidersHorizontal },
  ];

  const currentMenu = activeModule === 'advisory' ? menuAdvisory : menuFlow;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 z-30 shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              T
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-lg tracking-tight truncate">
                Thera <span className="text-slate-400 font-normal">Workspace</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="p-3 border-b border-slate-800">
          {sidebarOpen ? (
            <div className="bg-slate-950 p-1 rounded-lg flex space-x-1 border border-slate-800/80">
              <button
                onClick={() => {
                  setActiveModule('flow');
                  setActiveView('entrada_docs');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1.5 ${
                  activeModule === 'flow'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Flow (BPO)
              </button>
              <button
                onClick={() => {
                  setActiveModule('advisory');
                  setActiveView('kanban');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1.5 ${
                  activeModule === 'advisory'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                Advisory
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveModule(activeModule === 'flow' ? 'advisory' : 'flow')}
              className={`w-full py-2 flex items-center justify-center rounded-lg ${
                activeModule === 'flow' ? 'bg-emerald-600' : 'bg-blue-600'
              }`}
              title="Alternar Módulo"
            >
              <span className="font-bold text-xs">{activeModule === 'flow' ? 'BPO' : 'ADV'}</span>
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-slate-800/60">
            <label className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase block mb-1">
              Cliente em Foco
            </label>
            <div className="relative">
              <select
                value={clienteSelecionado.id}
                onChange={(e) => {
                  const c = clientes.find(item => item.id === Number(e.target.value));
                  if (c) setClienteSelecionado(c);
                }}
                className="w-full bg-slate-800 border border-slate-700 text-xs rounded-md py-1.5 pl-2 pr-7 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none truncate"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? activeModule === 'flow'
                      ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className={isActive ? (activeModule === 'flow' ? 'text-emerald-400' : 'text-blue-400') : ''} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
              EF
            </div>
            {sidebarOpen && (
              <div className="truncate text-xs">
                <p className="font-medium text-slate-200 leading-none truncate">Evandro Felicio</p>
                <span className="text-[10px] text-slate-500">Administrador Full</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => { void authService.logout().finally(() => { window.location.href = activeModule === 'flow' ? '/workspace' : '/advisory'; }); }} className="text-slate-500 hover:text-red-400 transition" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {activeModule === 'advisory' ? 'Thera Advisory · Consultoria' : 'Thera Flow · BPO Financeiro'}
            </h1>
            <p className="text-xs text-slate-500">
              A operar para: <span className="font-semibold text-slate-700">{clienteSelecionado.razaoSocial}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {avisoClientesMock && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Não foi possível carregar os clientes reais da API; exibindo dados de exemplo.">
                Clientes de exemplo
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              activeModule === 'advisory' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {activeModule === 'advisory' ? 'Modo Consultoria' : 'Modo BPO Financeiro'}
            </span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </section>
      </main>
    </div>
  );
};
