import React, { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, FileUp, LoaderCircle, RefreshCw } from 'lucide-react';
import { flowService, type Documento } from '../../services/flowService';
import { ApiError } from '../../services/apiClient';
import type { Cliente } from '../../mock/mockData';

type FlowViewProps = { view: string; cliente: Cliente };

const statusLabel: Record<string, string> = {
  pendente_aprovacao: 'Pendente de aprovação',
  aprovado: 'Aprovado',
};

export const FlowView: React.FC<FlowViewProps> = ({ view, cliente }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function carregar() {
    setLoading(true); setError('');
    try { setDocumentos(await flowService.documentos(cliente.id)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os documentos.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [cliente.id]);

  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    form.set('cliente_id', String(cliente.id));
    try {
      await flowService.criarDocumento(form);
      event.currentTarget.reset(); setMessage('Documento enviado para aprovação.'); await carregar();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível enviar o documento.'); }
    finally { setSaving(false); }
  }

  async function aprovar(id: number) {
    setError(''); setMessage('');
    try { await flowService.aprovar(cliente.id, id); setMessage('Documento aprovado.'); await carregar(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível aprovar o documento.'); }
  }

  if (view !== 'entrada_docs') {
    return <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm"><h2 className="text-xl font-bold text-slate-900">{view === 'fila_pagamentos' ? 'Fila de Pagamentos' : 'Plano de Contas'}</h2><p className="mt-2 text-sm text-slate-500">Esta etapa será conectada aos endpoints de produção na próxima iteração.</p></section>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-slate-900">Cockpit de Entrada</h2><p className="text-sm text-slate-500">Documentos de {cliente.nomeFantasia}</p></div>
      <button onClick={carregar} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Atualizar</button>
    </div>
    {(error || message) && <p role={error ? 'alert' : 'status'} className={error ? 'rounded-lg bg-red-50 p-3 text-sm text-red-700' : 'rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'}>{error || message}</p>}
    <form onSubmit={criar} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Descrição<input required name="descricao" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ex.: NF fornecedor" /></label>
      <label className="text-sm font-medium text-slate-700">Valor<input required name="valor" inputMode="decimal" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0,00" /></label>
      <label className="text-sm font-medium text-slate-700">Vencimento<input required name="vencimento" type="date" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <label className="text-sm font-medium text-slate-700">Anexo (PDF, imagem até 10 MB)<input required name="anexo" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm" /></label>
      <label className="text-sm font-medium text-slate-700 md:col-span-2">Linha digitável ou chave Pix<input name="linha_digitavel" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 md:w-fit">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <FileUp size={17} />} Enviar para aprovação</button>
    </form>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold text-slate-900">Documentos recentes</h3></div>
      {loading ? <div className="flex items-center gap-2 p-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Carregando...</div> : documentos.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhum documento encontrado.</p> : <div className="divide-y divide-slate-100">{documentos.map(doc => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-medium text-slate-900">{doc.descricao}</p><p className="mt-1 text-sm text-slate-500">Vencimento: {doc.vencimento} · R$ {doc.valor}</p></div><div className="flex items-center gap-3"><span className={doc.status === 'aprovado' ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'}>{statusLabel[doc.status] || doc.status}</span>{doc.status === 'pendente_aprovacao' && <button onClick={() => aprovar(doc.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"><CheckCircle2 size={15} /> Aprovar</button>}</div></div>)}</div>}
    </section>
  </div>;
};
