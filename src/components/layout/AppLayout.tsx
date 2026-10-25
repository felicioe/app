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
  LogOut,
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
  isAdmin?: boolean;
  nomeUsuario?: string;
  perfilLabel?: string;
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
  isAdmin,
  nomeUsuario,
  perfilLabel,
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
  const iniciais = (nomeUsuario || 'U').trim().split(/\s+/).map((parte) => parte[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex h-screen bg-brand-cream-light text-brand-navy overflow-hidden font-sans">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-brand-navy text-slate-100 flex flex-col transition-all duration-300 z-30 shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <img src="/brand/logo-mark.png" alt="Thera Financial" className="h-8 w-8 shrink-0 object-contain" />
            {sidebarOpen && (
              <span className="font-semibold text-base tracking-tight truncate">
                Thera <span className="text-brand-cream font-normal">Financial</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="p-3 border-b border-white/10">
          {sidebarOpen ? (
            <div className="bg-black/20 p-1 rounded-lg flex space-x-1 border border-white/10">
              <button
                onClick={() => {
                  setActiveModule('flow');
                  setActiveView('entrada_docs');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1.5 ${
                  activeModule === 'flow'
                    ? 'bg-brand-gold text-brand-navy shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Flow (BPO)
              </button>
              <button
                onClick={() => {
                  setActiveModule('advisory');
                  setActiveView('kanban');
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1.5 ${
                  activeModule === 'advisory'
                    ? 'bg-brand-gold text-brand-navy shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Advisory
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveModule(activeModule === 'flow' ? 'advisory' : 'flow')}
              className="w-full py-2 flex items-center justify-center rounded-lg bg-brand-gold text-brand-navy"
              title="Alternar Módulo"
            >
              <span className="font-bold text-xs">{activeModule === 'flow' ? 'BPO' : 'ADV'}</span>
            </button>
          )}
        </div>

        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-white/10">
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
                className="w-full bg-white/5 border border-white/15 text-xs rounded-md py-1.5 pl-2 pr-7 text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-gold appearance-none truncate"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id} className="text-slate-900">
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
                    ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className={isActive ? 'text-brand-gold' : ''} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {isAdmin && sidebarOpen && (
          <div className="px-3 pb-2">
            <a href="/admin/site" className="block w-full rounded-lg border border-white/15 px-3 py-2 text-center text-[11px] font-semibold text-slate-300 hover:bg-white/5">
              Editar site institucional
            </a>
          </div>
        )}
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-brand-navy">
              {iniciais}
            </div>
            {sidebarOpen && (
              <div className="truncate text-xs">
                <p className="font-medium text-slate-100 leading-none truncate">{nomeUsuario || 'Usuário'}</p>
                <span className="text-[10px] text-slate-400">{perfilLabel || ''}</span>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button onClick={() => { void authService.logout().finally(() => { window.location.href = activeModule === 'flow' ? '/workspace' : '/advisory'; }); }} className="text-slate-400 hover:text-red-400 transition" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-brand-navy/10 px-6 flex items-center justify-between z-10">
          <div>
            <h1 className="text-lg font-bold text-brand-navy leading-tight">
              {activeModule === 'advisory' ? 'Thera Advisory · Consultoria' : 'Thera Flow · BPO Financeiro'}
            </h1>
            <p className="text-xs text-brand-slate">
              A operar para: <span className="font-semibold text-brand-navy">{clienteSelecionado.razaoSocial}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {avisoClientesMock && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Não foi possível carregar os clientes reais da API; exibindo dados de exemplo.">
                Clientes de exemplo
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-navy/5 text-brand-navy border border-brand-navy/10">
              {activeModule === 'advisory' ? 'Modo Consultoria' : 'Modo BPO Financeiro'}
            </span>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 bg-brand-cream-light">
          {children}
        </section>
      </main>
    </div>
  );
};
