import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, RefreshCw, Upload } from 'lucide-react';
import type { Cliente } from '../../mock/mockData';
import { flowService, type Documento } from '../../services/flowService';

const FORM_INICIAL = {
  descricao: '',
  valor: '',
  vencimento: '',
  fornecedor_id: '',
  tipo_documento_id: '',
  plano_contas_id: '',
  centro_custo_id: '',
};

export function WorkspaceView({ cliente }: { cliente: Cliente }) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [anexo, setAnexo] = useState<File | null>(null);

  const load = () => {
    setLoading(true);
    setError('');
    flowService
      .documentos(cliente.id)
      .then(setDocumentos)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os documentos.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [cliente.id]);

  const approve = async (documento: Documento) => {
    if (documento.status === 'aprovado') return;
    setApproving(documento.id);
    setError('');
    try {
      await flowService.aprovar(cliente.id, documento.id);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível aprovar o documento.');
    } finally {
      setApproving(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!anexo) {
      setError('Selecione o anexo do documento.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.set(key, value));
      data.set('cliente_id', String(cliente.id));
      data.set('anexo', anexo);
      await flowService.criarDocumento(data);
      setForm(FORM_INICIAL);
      setAnexo(null);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar o documento.');
    } finally {
      setSending(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <label className="space-y-1 text-xs font-medium text-slate-700">
      {label}
      <input
        required
        value={form[key]}
        onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal outline-none focus:border-emerald-500"
      />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cockpit de Entrada</h2>
          <p className="text-xs text-slate-500">Documentos a pagar e aprovações do cliente {cliente.nomeFantasia}.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <div className="md:col-span-2">{field('descricao', 'Descrição')}</div>
        {field('valor', 'Valor', 'number')}
        {field('vencimento', 'Vencimento', 'date')}
        {field('fornecedor_id', 'ID fornecedor', 'number')}
        {field('tipo_documento_id', 'ID tipo', 'number')}
        {field('plano_contas_id', 'ID plano de contas', 'number')}
        {field('centro_custo_id', 'ID centro de custo', 'number')}
        <label className="space-y-1 text-xs font-medium text-slate-700 md:col-span-3">
          Anexo (PDF, JPEG, PNG ou WebP)
          <input
            required
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(event) => setAnexo(event.target.files?.[0] || null)}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
          />
        </label>
        <div className="flex items-end">
          <button disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {sending ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />} Enviar documento
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-slate-500">
            <LoaderCircle className="animate-spin" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">Nenhum documento pendente para este cliente.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Vencimento</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map((documento) => {
                const aprovado = documento.status === 'aprovado';
                return (
                  <tr key={documento.id}>
                    <td className="px-5 py-4 font-medium text-slate-800">{documento.descricao}</td>
                    <td className="px-5 py-4 text-slate-600">{documento.vencimento}</td>
                    <td className="px-5 py-4 font-mono text-slate-700">R$ {documento.valor}</td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          aprovado
                            ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
                            : 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700'
                        }
                      >
                        {documento.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => void approve(documento)}
                        disabled={aprovado || approving === documento.id}
                        title={aprovado ? 'Documento já aprovado' : undefined}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {approving === documento.id ? (
                          <LoaderCircle size={14} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {aprovado ? 'Aprovado' : 'Aprovar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
