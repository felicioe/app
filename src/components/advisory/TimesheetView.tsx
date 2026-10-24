import React, { useEffect, useState } from 'react';
import { LoaderCircle, Plus, RefreshCw } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { advisoryService, type Apontamento } from '../../services/advisoryService';

const FORM_INICIAL = {
  tarefa_id: '',
  data: new Date().toISOString().slice(0, 10),
  hora_inicio: '09:00',
  hora_fim: '10:00',
  descricao: '',
};

export function TimesheetView({ cliente }: { cliente: Cliente }) {
  const [items, setItems] = useState<Apontamento[]>([]);
  const [tasks, setTasks] = useState<{ id: number; titulo: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(FORM_INICIAL);
  const [filtro, setFiltro] = useState({ inicio: '', fim: '' });

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      advisoryService.timesheet(cliente.id, filtro.inicio || undefined, filtro.fim || undefined),
      advisoryService.kanban(cliente.id),
    ])
      .then(([result, board]) => {
        setItems(result.apontamentos);
        setTotal(result.total_minutos);
        setTasks(board.tarefas);
        setForm((current) => ({ ...current, tarefa_id: current.tarefa_id || String(board.tarefas[0]?.id || '') }));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os dados.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await advisoryService.apontar({
        cliente_id: cliente.id,
        tarefa_id: Number(form.tarefa_id),
        data: form.data,
        hora_inicio: form.hora_inicio,
        hora_fim: form.hora_fim,
        descricao: form.descricao,
        faturavel: true,
      });
      setForm((current) => ({ ...current, descricao: '' }));
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o apontamento.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Dashboard de Horas</h2>
          <p className="text-xs text-slate-500">Apontamentos técnicos de {cliente.nomeFantasia}.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form
        onSubmit={(event) => { event.preventDefault(); load(); }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <label className="text-xs font-medium text-slate-700">
          Período de
          <input type="date" value={filtro.inicio} onChange={(e) => setFiltro({ ...filtro, inicio: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          até
          <input type="date" value={filtro.fim} onChange={(e) => setFiltro({ ...filtro, fim: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filtrar</button>
      </form>

      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5">
        <label className="text-xs font-medium text-slate-700">
          Tarefa
          <select required value={form.tarefa_id} onChange={(e) => setForm({ ...form, tarefa_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="" disabled>Selecione</option>
            {tasks.map((tarefa) => <option key={tarefa.id} value={tarefa.id}>{tarefa.titulo}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Data
          <input required type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Início
          <input required type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Fim
          <input required type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button disabled={sending || tasks.length === 0} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Registrar
        </button>
        <label className="text-xs font-medium text-slate-700 md:col-span-5">
          Descrição
          <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total no período</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{Math.floor(total / 60)}h {total % 60}min</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <LoaderCircle className="animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum apontamento encontrado.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Horário</th>
                <th className="px-5 py-3">Duração</th>
                <th className="px-5 py-3">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">{item.data}</td>
                  <td className="px-5 py-4">{item.hora_inicio} – {item.hora_fim}</td>
                  <td className="px-5 py-4">{item.duracao_minutos} min</td>
                  <td className="px-5 py-4">{item.status_faturamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
