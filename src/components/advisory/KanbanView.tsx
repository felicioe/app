import React, { useEffect, useMemo, useState } from 'react';
import { LoaderCircle, Play, Square } from 'lucide-react';
import type { Cliente, TarefaKanban } from '../../mock/mockData';
import { advisoryService } from '../../services/advisoryService';

interface KanbanViewProps { cliente: Cliente }
type ApiStatus = 'pendente' | 'em_andamento' | 'concluida';
const columns = [
  { id: 'backlog', label: 'Diagnóstico / Backlog' },
  { id: 'planejado', label: 'Planeado' },
  { id: 'execucao', label: 'Em Execução' },
  { id: 'validacao', label: 'Em Validação' },
  { id: 'concluido', label: 'Concluído' },
] as const;

function mapTask(task: { id: number; titulo: string; status: ApiStatus }): TarefaKanban {
  return { id: task.id, clienteId: 0, titulo: task.titulo, status: task.status === 'concluida' ? 'concluido' : task.status === 'em_andamento' ? 'execucao' : 'backlog', horasEstimadas: 0, horasRealizadas: 0, prazo: '—' };
}

export const KanbanView: React.FC<KanbanViewProps> = ({ cliente }) => {
  const [tarefas, setTarefas] = useState<TarefaKanban[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTimerId, setActiveTimerId] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    advisoryService.kanban(cliente.id).then(({ tarefas: rows }) => { if (active) setTarefas(rows.map(mapTask)); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as tarefas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cliente.id]);
  useEffect(() => {
    if (activeTimerId === null) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [activeTimerId]);
  const formatTimer = (value: number) => `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const toggleTimer = async (task: TarefaKanban) => {
    if (activeTimerId === task.id && startedAt) {
      const end = new Date();
      try {
        await advisoryService.apontar({ cliente_id: cliente.id, tarefa_id: task.id, data: startedAt.toISOString().slice(0, 10), hora_inicio: startedAt.toTimeString().slice(0, 8), hora_fim: end.toTimeString().slice(0, 8) });
        setActiveTimerId(null); setStartedAt(null); setSeconds(0);
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o apontamento.'); }
    } else { setActiveTimerId(task.id); setStartedAt(new Date()); setSeconds(0); }
  };
  const grouped = useMemo(() => columns.map((column) => ({ ...column, tasks: tarefas.filter((task) => task.status === column.id) })), [tarefas]);
  if (loading) return <div className="flex min-h-[300px] items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;
  return <div className="space-y-4">
    <div><h2 className="text-xl font-bold text-slate-900">Quadro de Demandas & Entregáveis</h2><p className="text-xs text-slate-500">Dados carregados do Thera Advisory para {cliente.nomeFantasia}.</p></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-5">
      {grouped.map((column) => <div key={column.id} className="min-h-[300px] rounded-xl border border-slate-300/60 bg-slate-200/60 p-3"><div className="mb-2 flex justify-between border-b border-slate-300 pb-2"><span className="text-xs font-bold uppercase tracking-wider text-slate-700">{column.label}</span><span className="rounded-full bg-slate-300/80 px-2 py-0.5 text-xs font-bold text-slate-700">{column.tasks.length}</span></div><div className="space-y-2.5">{column.tasks.map((task) => { const running = activeTimerId === task.id; return <div key={task.id} className="rounded-lg border border-slate-200/90 bg-white p-3.5 shadow-sm"><p className="mb-3 text-sm font-semibold leading-snug text-slate-800">{task.titulo}</p><div className="flex items-center justify-between text-xs text-slate-500"><span>{running ? <span className="font-mono font-bold text-red-600">{formatTimer(seconds)}</span> : 'Registrar horas'}</span><button onClick={() => void toggleTimer(task)} className={`rounded-md p-1.5 ${running ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`} title={running ? 'Finalizar e guardar tempo' : 'Iniciar cronômetro'}>{running ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button></div></div>; })}</div></div>)}
    </div>
  </div>;
};
