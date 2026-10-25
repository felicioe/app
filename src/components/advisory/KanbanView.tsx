import React, { useEffect, useMemo, useState } from 'react';
import { History, LoaderCircle, Play, Plus, Square } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { advisoryService, type Projeto, type Tarefa } from '../../services/advisoryService';
import { TarefaAnexosModal } from './TarefaAnexosModal';

interface KanbanViewProps { cliente: Cliente }

const COLUNAS = [
  { id: 'pendente', label: 'Backlog / A Fazer' },
  { id: 'em_andamento', label: 'Em Execução' },
  { id: 'concluida', label: 'Concluído' },
] as const;

const FORM_TAREFA_INICIAL = { projeto_id: '', titulo: '', descricao: '', prazo: '' };
const CHAVE_CRONOMETRO = 'thera_cronometro_ativo';

interface CronometroAtivo { tarefaId: number; inicioMs: number }

function lerCronometroSalvo(): CronometroAtivo | null {
  try {
    const bruto = localStorage.getItem(CHAVE_CRONOMETRO);
    if (!bruto) return null;
    const valor = JSON.parse(bruto);
    if (typeof valor?.tarefaId === 'number' && typeof valor?.inicioMs === 'number') return valor;
  } catch { /* ignora armazenamento indisponível ou corrompido */ }
  return null;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ cliente }) => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTimerId, setActiveTimerId] = useState<number | null>(() => lerCronometroSalvo()?.tarefaId ?? null);
  const [inicioMs, setInicioMs] = useState<number | null>(() => lerCronometroSalvo()?.inicioMs ?? null);
  const [seconds, setSeconds] = useState(() => {
    const salvo = lerCronometroSalvo();
    return salvo ? Math.floor((Date.now() - salvo.inicioMs) / 1000) : 0;
  });
  const [formTarefa, setFormTarefa] = useState(FORM_TAREFA_INICIAL);
  const [enviandoTarefa, setEnviandoTarefa] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState('');
  const [enviandoProjeto, setEnviandoProjeto] = useState(false);
  const [tarefaHistorico, setTarefaHistorico] = useState<Tarefa | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    advisoryService.kanban(cliente.id)
      .then(({ tarefas: linhasTarefas, projetos: linhasProjetos }) => {
        setTarefas(linhasTarefas);
        setProjetos(linhasProjetos);
        setFormTarefa((atual) => ({ ...atual, projeto_id: atual.projeto_id || String(linhasProjetos[0]?.id || '') }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as tarefas.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  useEffect(() => {
    if (activeTimerId === null || inicioMs === null) return;
    const atualizar = () => setSeconds(Math.floor((Date.now() - inicioMs) / 1000));
    atualizar();
    const timer = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(timer);
  }, [activeTimerId, inicioMs]);

  const formatTimer = (value: number) => `${String(Math.floor(value / 3600)).padStart(2, '0')}:${String(Math.floor((value % 3600) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const formatHoraMinuto = (data: Date) => `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;

  const toggleTimer = async (task: Tarefa) => {
    if (activeTimerId === task.id && inicioMs !== null) {
      const inicio = new Date(inicioMs);
      const fim = new Date();
      try {
        await advisoryService.apontar({ cliente_id: cliente.id, tarefa_id: task.id, data: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}-${String(inicio.getDate()).padStart(2, '0')}`, hora_inicio: formatHoraMinuto(inicio), hora_fim: formatHoraMinuto(fim) });
        localStorage.removeItem(CHAVE_CRONOMETRO);
        setActiveTimerId(null); setInicioMs(null); setSeconds(0);
        load();
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o apontamento. O cronômetro continua rodando — tente finalizar novamente.'); }
    } else {
      const agora = Date.now();
      try { localStorage.setItem(CHAVE_CRONOMETRO, JSON.stringify({ tarefaId: task.id, inicioMs: agora })); } catch { /* armazenamento indisponível, segue só em memória */ }
      setActiveTimerId(task.id); setInicioMs(agora); setSeconds(0);
    }
  };

  const criarProjeto = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!novoProjeto.trim()) return;
    setEnviandoProjeto(true);
    setError('');
    try {
      await advisoryService.criarProjeto(cliente.id, novoProjeto.trim());
      setNovoProjeto('');
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar o projeto.');
    } finally {
      setEnviandoProjeto(false);
    }
  };

  const criarTarefa = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviandoTarefa(true);
    setError('');
    try {
      await advisoryService.criarTarefa({
        cliente_id: cliente.id,
        projeto_id: Number(formTarefa.projeto_id),
        titulo: formTarefa.titulo,
        descricao: formTarefa.descricao || undefined,
        prazo: formTarefa.prazo || undefined,
      });
      setFormTarefa((atual) => ({ ...FORM_TAREFA_INICIAL, projeto_id: atual.projeto_id }));
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a tarefa.');
    } finally {
      setEnviandoTarefa(false);
    }
  };

  const grouped = useMemo(() => COLUNAS.map((coluna) => ({ ...coluna, tasks: tarefas.filter((task) => task.status === coluna.id) })), [tarefas]);

  if (loading) return <div className="flex min-h-[300px] items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-brand-navy">Quadro de Demandas & Entregáveis</h2>
        <p className="text-xs text-brand-slate">Dados carregados do Thera Advisory para {cliente.nomeFantasia}.</p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {projetos.length === 0 ? (
        <form onSubmit={criarProjeto} className="flex flex-wrap items-end gap-3 rounded-xl border border-brand-navy/10 bg-white p-5 shadow-sm">
          <label className="flex-1 text-xs font-medium text-brand-navy">
            Nenhum projeto cadastrado ainda. Crie o primeiro para começar a lançar tarefas.
            <input required value={novoProjeto} onChange={(e) => setNovoProjeto(e.target.value)} placeholder="Nome do projeto" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" />
          </label>
          <button disabled={enviandoProjeto} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {enviandoProjeto ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Criar projeto
          </button>
        </form>
      ) : (
        <form onSubmit={criarTarefa} className="grid gap-3 rounded-xl border border-brand-navy/10 bg-white p-5 shadow-sm md:grid-cols-5">
          <label className="text-xs font-medium text-brand-navy">
            Projeto
            <select required value={formTarefa.projeto_id} onChange={(e) => setFormTarefa({ ...formTarefa, projeto_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {projetos.map((projeto) => <option key={projeto.id} value={projeto.id}>{projeto.nome}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-brand-navy md:col-span-2">
            Título da tarefa
            <input required value={formTarefa.titulo} onChange={(e) => setFormTarefa({ ...formTarefa, titulo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">
            Prazo (opcional)
            <input type="date" value={formTarefa.prazo} onChange={(e) => setFormTarefa({ ...formTarefa, prazo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="flex items-end">
            <button disabled={enviandoTarefa} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {enviandoTarefa ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Nova tarefa
            </button>
          </div>
          <label className="text-xs font-medium text-brand-navy md:col-span-5">
            Descrição (opcional)
            <input value={formTarefa.descricao} onChange={(e) => setFormTarefa({ ...formTarefa, descricao: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
        </form>
      )}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {grouped.map((coluna) => (
          <div key={coluna.id} className="min-h-[300px] rounded-xl border border-brand-navy/10 bg-brand-cream-light p-3">
            <div className="mb-2 flex justify-between border-b border-brand-navy/10 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">{coluna.label}</span>
              <span className="rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-bold text-brand-navy">{coluna.tasks.length}</span>
            </div>
            <div className="space-y-2.5">
              {coluna.tasks.map((task) => {
                const running = activeTimerId === task.id;
                return (
                  <div key={task.id} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm">
                    <p className="mb-1 text-sm font-semibold leading-snug text-brand-navy">{task.titulo}</p>
                    {task.descricao && <p className="mb-2 text-xs text-brand-slate">{task.descricao}</p>}
                    {task.prazo && <p className="mb-2 text-[11px] text-brand-slate">Prazo: {task.prazo}</p>}
                    <div className="flex items-center justify-between text-xs text-brand-slate">
                      <button onClick={() => setTarefaHistorico(task)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-brand-navy hover:bg-brand-cream-light" title="Histórico e anexos">
                        <History size={14} /> Histórico
                      </button>
                      <div className="flex items-center gap-2">
                        {running && <span className="font-mono font-bold text-red-600">{formatTimer(seconds)}</span>}
                        <button onClick={() => void toggleTimer(task)} className={`rounded-md p-1.5 ${running ? 'bg-red-100 text-red-600' : 'bg-brand-navy/5 text-brand-navy'}`} title={running ? 'Finalizar e guardar tempo' : 'Iniciar cronômetro'}>
                          {running ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {tarefaHistorico && (
        <TarefaAnexosModal
          clienteId={cliente.id}
          tarefaId={tarefaHistorico.id}
          titulo={tarefaHistorico.titulo}
          onClose={() => setTarefaHistorico(null)}
        />
      )}
    </div>
  );
};
