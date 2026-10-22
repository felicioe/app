import React, { useState, useEffect } from 'react';
import { Play, Square, Plus } from 'lucide-react';
import { TAREFAS_KANBAN_MOCK, TarefaKanban, Cliente } from '../../mock/mockData';

interface KanbanViewProps {
  cliente: Cliente;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ cliente }) => {
  const [tarefas, setTarefas] = useState<TarefaKanban[]>(
    TAREFAS_KANBAN_MOCK.filter(t => t.clienteId === cliente.id)
  );

  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    setTarefas(TAREFAS_KANBAN_MOCK.filter(t => t.clienteId === cliente.id));
  }, [cliente]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimerId !== null) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimerId]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = (tarefaId: number) => {
    if (activeTimerId === tarefaId) {
      const horasGastas = Number((secondsElapsed / 3600).toFixed(2));
      setTarefas(prev => prev.map(t => {
        if (t.id === tarefaId) {
          return { ...t, horasRealizadas: t.horasRealizadas + horasGastas };
        }
        return t;
      }));
      setActiveTimerId(null);
      setSecondsElapsed(0);
    } else {
      setActiveTimerId(tarefaId);
      setSecondsElapsed(0);
    }
  };

  const colunas = [
    { id: 'backlog', label: 'Diagnóstico / Backlog' },
    { id: 'planejado', label: 'Planeado' },
    { id: 'execucao', label: 'Em Execução' },
    { id: 'validacao', label: 'Em Validação' },
    { id: 'concluido', label: 'Concluído' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quadro de Demandas & Entregáveis</h2>
          <p className="text-xs text-slate-500">Acompanhamento de escopo e horas dedicadas por atividade</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition">
          <Plus size={16} /> Nova Demanda
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {colunas.map((col) => {
          const tarefasDaColuna = tarefas.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-slate-200/60 rounded-xl p-3 border border-slate-300/60 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-300">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{col.label}</span>
                <span className="text-xs bg-slate-300/80 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {tarefasDaColuna.length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {tarefasDaColuna.map((tarefa) => {
                  const isRunning = activeTimerId === tarefa.id;
                  return (
                    <div key={tarefa.id} className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-sm hover:shadow transition">
                      <p className="text-sm font-semibold text-slate-800 leading-snug mb-2">{tarefa.titulo}</p>
                      
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pt-1 border-t border-slate-100">
                        <span>Prazo: {tarefa.prazo}</span>
                        <span className="font-mono">{tarefa.horasRealizadas.toFixed(1)}h / {tarefa.horasEstimadas}h</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {isRunning ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="font-mono text-xs font-bold text-red-600">{formatTimer(secondsElapsed)}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Registar horas</span>
                        )}

                        <button
                          onClick={() => handleToggleTimer(tarefa.id)}
                          className={`p-1.5 rounded-md flex items-center justify-center transition ${
                            isRunning 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title={isRunning ? "Finalizar e Guardar Tempo" : "Iniciar Cronómetro"}
                        >
                          {isRunning ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};