import React, { useEffect, useState } from 'react';
import { CircleDollarSign, LoaderCircle, Plus, RefreshCw, ReceiptText } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { advisoryService, type Despesa, type Fatura } from '../../services/advisoryService';

function formatarReal(valor: string): string {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function FaturamentoView({ cliente }: { cliente: Cliente }) {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechando, setFechando] = useState(false);
  const [enviandoDespesa, setEnviandoDespesa] = useState(false);
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
  const [despesaForm, setDespesaForm] = useState({ tipo: '', data: new Date().toISOString().slice(0, 10), descricao: '', valor: '', reembolsavel: false });

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([advisoryService.faturas(cliente.id), advisoryService.despesas(cliente.id)])
      .then(([listaFaturas, listaDespesas]) => { setFaturas(listaFaturas); setDespesas(listaDespesas); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar faturamento e despesas.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  const fechar = async (event: React.FormEvent) => {
    event.preventDefault();
    setFechando(true);
    setError('');
    try {
      await advisoryService.fechar(cliente.id, periodo.inicio, periodo.fim);
      setPeriodo({ inicio: '', fim: '' });
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível fechar o período.');
    } finally {
      setFechando(false);
    }
  };

  const registrarDespesa = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviandoDespesa(true);
    setError('');
    try {
      await advisoryService.registrarDespesa({ cliente_id: cliente.id, ...despesaForm });
      setDespesaForm({ tipo: '', data: new Date().toISOString().slice(0, 10), descricao: '', valor: '', reembolsavel: false });
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a despesa.');
    } finally {
      setEnviandoDespesa(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fechamento & Faturas</h2>
          <p className="text-xs text-slate-500">Encerramento de ciclos e despesas reembolsáveis de {cliente.nomeFantasia}.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={fechar} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-xs font-medium text-slate-700">
          Período de
          <input required type="date" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          até
          <input required type="date" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button disabled={fechando} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {fechando ? <LoaderCircle size={16} className="animate-spin" /> : <CircleDollarSign size={16} />} Fechar período
        </button>
        <p className="w-full text-xs text-slate-400">Disponível apenas para o perfil de administrador BPO. Horas e despesas de períodos já fechados ficam bloqueadas.</p>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : faturas.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhuma fatura emitida ainda.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Período</th>
                <th className="px-5 py-3">Minutos</th>
                <th className="px-5 py-3">Honorários</th>
                <th className="px-5 py-3">Despesas</th>
                <th className="px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {faturas.map((fatura) => (
                <tr key={fatura.id}>
                  <td className="px-5 py-4">{fatura.periodo_inicio} – {fatura.periodo_fim}</td>
                  <td className="px-5 py-4">{fatura.total_horas_minutos} min</td>
                  <td className="px-5 py-4 font-mono">R$ {formatarReal(fatura.valor_servicos)}</td>
                  <td className="px-5 py-4 font-mono">R$ {formatarReal(fatura.valor_despesas_reembolsadas)}</td>
                  <td className="px-5 py-4 font-mono font-semibold">R$ {formatarReal(fatura.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={registrarDespesa} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <label className="text-xs font-medium text-slate-700">
          Tipo
          <input required list="tipos-despesa" value={despesaForm.tipo} onChange={(e) => setDespesaForm({ ...despesaForm, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <datalist id="tipos-despesa">
            <option value="deslocamento" />
            <option value="hospedagem" />
            <option value="alimentacao" />
          </datalist>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Data
          <input required type="date" value={despesaForm.data} onChange={(e) => setDespesaForm({ ...despesaForm, data: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700 md:col-span-2">
          Descrição
          <input required value={despesaForm.descricao} onChange={(e) => setDespesaForm({ ...despesaForm, descricao: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Valor
          <input required type="number" min="0" step="0.01" value={despesaForm.valor} onChange={(e) => setDespesaForm({ ...despesaForm, valor: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 md:col-span-2">
          <input type="checkbox" checked={despesaForm.reembolsavel} onChange={(e) => setDespesaForm({ ...despesaForm, reembolsavel: e.target.checked })} />
          Reembolsável ao cliente
        </label>
        <div className="flex items-end md:col-span-1">
          <button disabled={enviandoDespesa} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {enviandoDespesa ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} Registrar
          </button>
        </div>
        <p className="text-xs text-slate-400 md:col-span-4">Informe o tipo exatamente como cadastrado no sistema (ex.: deslocamento, hospedagem, alimentacao). Lista sujeita a confirmação — se o tipo não existir, a API retorna erro.</p>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : despesas.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhuma despesa registrada ainda.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Reembolsável</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {despesas.map((despesa) => (
                <tr key={despesa.id}>
                  <td className="px-5 py-4">{despesa.data}</td>
                  <td className="px-5 py-4 capitalize">{despesa.tipo}</td>
                  <td className="px-5 py-4 flex items-center gap-2"><ReceiptText size={14} className="text-slate-400" /> {despesa.descricao}</td>
                  <td className="px-5 py-4 font-mono">R$ {Number(despesa.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-4">{Number(despesa.reembolsavel) === 1 ? 'Sim' : 'Não'}</td>
                  <td className="px-5 py-4">{despesa.fatura_id ? 'Faturada' : 'Em aberto'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
