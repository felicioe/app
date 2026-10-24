import React, { useEffect, useState } from 'react';
import { Download, LoaderCircle, RefreshCw } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { flowService, type Documento } from '../../services/flowService';

export function FilaPagamentosView({ cliente }: { cliente: Cliente }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [baixando, setBaixando] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    flowService
      .documentos(cliente.id, { status: 'aprovado' })
      .then(setDocumentos)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a fila de pagamentos.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  const baixarAnexo = async (documento: Documento) => {
    setBaixando(documento.id);
    setError('');
    try {
      const blob = await flowService.anexo(cliente.id, documento.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `documento-${documento.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível baixar o anexo.');
    } finally {
      setBaixando(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Fila de Pagamentos</h2>
          <p className="text-xs text-slate-500">Documentos já aprovados, prontos para pagamento de {cliente.nomeFantasia}.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>
        ) : documentos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Nenhum documento aprovado aguardando pagamento.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3 text-right">Anexo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map((documento) => (
                <tr key={documento.id}>
                  <td className="px-5 py-4 font-medium text-slate-800">{documento.descricao}</td>
                  <td className="px-5 py-4 text-slate-600">{documento.vencimento}</td>
                  <td className="px-5 py-4 font-mono text-slate-700">R$ {documento.valor}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => void baixarAnexo(documento)}
                      disabled={baixando === documento.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
                    >
                      {baixando === documento.id ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
