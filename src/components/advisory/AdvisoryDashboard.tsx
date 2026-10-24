import React, { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { advisoryService, type Apontamento } from '../../services/advisoryService';
import type { Cliente } from '../../mock/mockData';
import { ApiError } from '../../services/apiClient';

export const AdvisoryDashboard: React.FC<{ cliente: Cliente }> = ({ cliente }) => {
  const [items, setItems] = useState<Apontamento[]>([]);
  const [total, setTotal] = useState(0);
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function carregar() { setLoading(true); setError(''); const [ano, m] = mes.split('-'); try { const r = await advisoryService.timesheet(cliente.id, `${ano}-${m}-01`, `${ano}-${m}-${new Date(Number(ano), Number(m), 0).getDate()}`); setItems(r.apontamentos); setTotal(r.total_minutos); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as horas.'); } finally { setLoading(false); } }
  useEffect(() => { carregar(); }, [cliente.id, mes]);
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Dashboard de Horas</h2><p className="text-sm text-slate-500">{cliente.nomeFantasia}</p></div><div className="flex items-center gap-2"><input type="month" value={mes} onChange={e => setMes(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={carregar} className="rounded-lg border border-slate-300 bg-white p-2"><RefreshCw size={16} /></button></div></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="rounded-xl border border-blue-200 bg-blue-50 p-5"><p className="text-sm text-blue-700">Total apontado no período</p><p className="mt-1 text-3xl font-bold text-blue-900">{Math.floor(total / 60)}h {total % 60}min</p></div><section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Apontamentos recentes</h3></div>{loading ? <div className="flex items-center gap-2 p-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Carregando...</div> : items.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhum apontamento no período.</p> : <div className="divide-y divide-slate-100">{items.map(item => <div key={item.id} className="flex justify-between gap-3 p-4 text-sm"><span>{item.data} · {item.hora_inicio}–{item.hora_fim}</span><span className="font-semibold">{item.duracao_minutos} min</span></div>)}</div>}</section></div>;
};
