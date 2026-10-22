import React, { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { KanbanView } from './components/advisory/KanbanView';
import { CLIENTES_MOCK, Cliente } from './mock/mockData';

export function App() {
  const [activeModule, setActiveModule] = useState<'advisory' | 'flow'>('advisory');
  const [activeView, setActiveView] = useState('kanban');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente>(CLIENTES_MOCK[0]);

  return (
    <AppLayout
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      activeView={activeView}
      setActiveView={setActiveView}
      clienteSelecionado={clienteSelecionado}
      setClienteSelecionado={setClienteSelecionado}
    >
      {activeModule === 'advisory' && activeView === 'kanban' && (
        <KanbanView cliente={clienteSelecionado} />
      )}

      {activeView !== 'kanban' && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 text-center shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">Módulo em Desenvolvimento</h3>
          <p className="text-xs text-slate-500 mt-1">
            Visualização selecionada: <strong>{activeView}</strong> para a empresa <strong>{clienteSelecionado.nomeFantasia}</strong>.
          </p>
        </div>
      )}
    </AppLayout>
  );
}

export default App;
