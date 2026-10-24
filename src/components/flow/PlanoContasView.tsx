import React, { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw, Upload } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { flowService, type CadastroCodigo, type Destino } from '../../services/flowService';

const MAPEAMENTO_INICIAL = { codigo: 'Código', descricao: 'Descrição', tipo: 'Tipo', codigo_pai: 'Pai' };

export function PlanoContasView({ cliente }: { cliente: Cliente }) {
  const [destino, setDestino] = useState<Destino>('plano_contas');
  const [planoContas, setPlanoContas] = useState<CadastroCodigo[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CadastroCodigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [mapeamento, setMapeamento] = useState(MAPEAMENTO_INICIAL);

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([flowService.planoContasCompleto(cliente.id), flowService.centrosCusto(cliente.id)])
      .then(([conta, custo]) => { setPlanoContas(conta); setCentrosCusto(custo); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o plano de contas.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  const importar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!arquivo) { setError('Selecione um arquivo CSV ou XLSX.'); return; }
    setEnviando(true);
    setError('');
    setResultado('');
    try {
      const mapa: Record<string, string> = { codigo: mapeamento.codigo, descricao: mapeamento.descricao };
      if (destino === 'plano_contas') mapa.tipo = mapeamento.tipo;
      if (mapeamento.codigo_pai.trim()) mapa.codigo_pai = mapeamento.codigo_pai;
      const { inseridos } = await flowService.importarArquivo(cliente.id, destino, arquivo, mapa);
      setResultado(`${inseridos} ${inseridos === 1 ? 'registro importado' : 'registros importados'} com sucesso.`);
      setArquivo(null);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível importar o arquivo.');
    } finally {
      setEnviando(false);
    }
  };

  const lista = destino === 'plano_contas' ? planoContas : centrosCusto;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Plano de Contas & Centros de Custo</h2>
          <p className="text-xs text-slate-500">Cadastros financeiros de {cliente.nomeFantasia}.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {resultado && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{resultado}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setDestino('plano_contas')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${destino === 'plano_contas' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
        >
          Plano de Contas
        </button>
        <button
          onClick={() => setDestino('centros_custo')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${destino === 'centros_custo' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
        >
          Centros de Custo
        </button>
      </div>

      <form onSubmit={importar} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <p className="text-xs text-slate-500 md:col-span-4">
          Importa {destino === 'plano_contas' ? 'contas' : 'centros de custo'} de um arquivo CSV ou XLSX. Informe o nome exato das colunas do arquivo abaixo (De-Para).
        </p>
        <label className="text-xs font-medium text-slate-700 md:col-span-2">
          Arquivo (CSV ou XLSX)
          <input required type="file" accept=".csv,.xlsx" onChange={(e) => setArquivo(e.target.files?.[0] || null)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Coluna do código
          <input required value={mapeamento.codigo} onChange={(e) => setMapeamento({ ...mapeamento, codigo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Coluna da descrição
          <input required value={mapeamento.descricao} onChange={(e) => setMapeamento({ ...mapeamento, descricao: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        {destino === 'plano_contas' && (
          <label className="text-xs font-medium text-slate-700">
            Coluna do tipo (sintética/analítica)
            <input required value={mapeamento.tipo} onChange={(e) => setMapeamento({ ...mapeamento, tipo: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
        )}
        <label className="text-xs font-medium text-slate-700">
          Coluna da conta pai (opcional)
          <input value={mapeamento.codigo_pai} onChange={(e) => setMapeamento({ ...mapeamento, codigo_pai: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex items-end">
          <button disabled={enviando} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {enviando ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />} Importar
          </button>
        </div>
        <p className="text-xs text-slate-400 md:col-span-4">Disponível apenas para o perfil de operação BPO.</p>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : lista.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum registro cadastrado ainda.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Descrição</th>
                {destino === 'plano_contas' && <th className="px-5 py-3">Tipo</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lista.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-mono">{item.codigo}</td>
                  <td className="px-5 py-4">{item.descricao}</td>
                  {destino === 'plano_contas' && <td className="px-5 py-4 capitalize">{item.tipo}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
