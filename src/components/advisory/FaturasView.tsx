import React, { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { Cliente } from '../../types/domain';

type Fatura = { id: number; periodo_inicio: string; periodo_fim: string; minutos: number; total_centavos: number; status?: string };
export const FaturasView: React.FC<{ cliente: Cliente }> = ({ cliente }) => {
  const [items, setItems] = useState<Fatura[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  async function carregar() { setLoading(true); try { setItems(await apiClient<Fatura[]>(`advisory/faturamento.php?cliente_id=${cliente.id}`)); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as faturas.'); } finally { setLoading(false); } }
  useEffect(() => { carregar(); }, [cliente.id]);
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Fechamento & Faturas</h2><p className="text-sm text-slate-500">{cliente.nomeFantasia}</p></div><button onClick={carregar} className="rounded-lg border border-slate-300 bg-white p-2"><RefreshCw size={16} /></button></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{loading ? <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Carregando...</div> : <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{items.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhuma fatura encontrada.</p> : items.map(item => <div key={item.id} className="flex justify-between gap-3 border-b border-slate-100 p-4 text-sm"><span>{item.periodo_inicio} a {item.periodo_fim} · {item.minutos} min</span><strong>R$ {(item.total_centavos / 100).toFixed(2).replace('.', ',')}</strong></div>)}</section>}</div>;
};
