import React, { FormEvent, useEffect, useState } from 'react';
import { CheckCircle2, Download, FileUp, LoaderCircle, RefreshCw } from 'lucide-react';
import { flowService, type Documento, type Destino } from '../../services/flowService';
import { ApiError } from '../../services/apiClient';
import type { Cliente } from '../../mock/mockData';

type FlowViewProps = { view: string; cliente: Cliente };
const statusLabel: Record<string, string> = { pendente_aprovacao: 'Pendente de aprovação', aprovado: 'Aprovado' };

export const FlowView: React.FC<FlowViewProps> = ({ view, cliente }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [notificacoes, setNotificacoes] = useState<{ id: number; mensagem: string; lida: boolean }[]>([]);
  const [regras, setRegras] = useState<{ id: number; etapa: number; valor_minimo: string; valor_maximo: string; tipo_aprovacao: string; aprovadores_necessarios: number }[]>([]);

  async function carregar() {
    setLoading(true); setError('');
    try { setDocumentos(await flowService.documentos(cliente.id)); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar os documentos.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); flowService.notificacoes().then(setNotificacoes).catch(() => undefined); flowService.regras(cliente.id).then(setRegras).catch(() => undefined); }, [cliente.id]);

  async function criar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget); form.set('cliente_id', String(cliente.id));
    try { await flowService.criarDocumento(form); event.currentTarget.reset(); setMessage('Documento enviado para aprovação.'); await carregar(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível enviar o documento.'); }
    finally { setSaving(false); }
  }

  async function marcarNotificacao(id: number) { try { await flowService.marcarLida(id); setNotificacoes(items => items.map(item => item.id === id ? { ...item, lida: true } : item)); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível atualizar a notificação.'); } }

  async function aprovar(id: number) {
    setError(''); setMessage('');
    try { await flowService.aprovar(cliente.id, id); setMessage('Documento aprovado.'); await carregar(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível aprovar o documento.'); }
  }

  async function importar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const arquivo = form.get('arquivo');
    const destino = form.get('destino') as Destino;
    const mapeamento = { codigo: String(form.get('col_codigo')), descricao: String(form.get('col_descricao')), tipo: String(form.get('col_tipo') || ''), codigo_pai: String(form.get('col_pai') || '') };
    if (!(arquivo instanceof File) || arquivo.size === 0) { setError('Selecione um arquivo CSV ou XLSX.'); setSaving(false); return; }
    try {
      await flowService.importarArquivo(cliente.id, destino, arquivo, mapeamento);
      event.currentTarget.reset(); setMessage('Importação concluída com sucesso.');
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível importar o arquivo.'); }
    finally { setSaving(false); }
  }

  const pendentes = notificacoes.filter(item => !item.lida);
  const painelAlcadas = regras.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="font-semibold text-slate-900">Alçadas de aprovação</h3><div className="mt-2 flex flex-wrap gap-2">{regras.map(regra => <span key={regra.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">Etapa {regra.etapa}: R$ {regra.valor_minimo} a R$ {regra.valor_maximo} · {regra.aprovadores_necessarios} aprovador(es)</span>)}</div></section>;
  const avisoNotificacoes = pendentes.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-900">Notificações pendentes</p><div className="mt-2 space-y-2">{pendentes.map(item => <button key={item.id} onClick={() => marcarNotificacao(item.id)} className="block w-full rounded-lg bg-white/70 p-2 text-left text-sm text-amber-900 hover:bg-white">{item.mensagem}</button>)}</div></div>;
  const aviso = (error || message) && <p role={error ? 'alert' : 'status'} className={error ? 'rounded-lg bg-red-50 p-3 text-sm text-red-700' : 'rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'}>{error || message}</p>;
  const cabecalho = <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{view === 'entrada_docs' ? 'Cockpit de Entrada' : view === 'fila_pagamentos' ? 'Fila de Pagamentos' : 'Plano de Contas'}</h2><p className="text-sm text-slate-500">Cliente: {cliente.nomeFantasia}</p></div><button onClick={carregar} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Atualizar</button></div>;

  if (view === 'plano_contas') return <div className="space-y-6">{cabecalho}{painelAlcadas}{avisoNotificacoes}{aviso}<form onSubmit={importar} className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="font-semibold text-slate-900">Importar estrutura</h3><p className="mt-1 text-sm text-slate-500">O arquivo deve conter as colunas codigo, descricao, tipo e codigo_pai. O backend valida duplicidades, ciclos e contas analíticas.</p></div><label className="block text-sm font-medium text-slate-700">Destino<select name="destino" defaultValue="plano_contas" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="plano_contas">Plano de contas</option><option value="centros_custo">Centros de custo</option></select></label><div className="grid gap-3 md:grid-cols-2"><label className="block text-sm font-medium text-slate-700">Coluna código<input required name="col_codigo" defaultValue="codigo" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Coluna descrição<input required name="col_descricao" defaultValue="descricao" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Coluna tipo<input name="col_tipo" defaultValue="tipo" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="block text-sm font-medium text-slate-700">Coluna conta-pai<input name="col_pai" defaultValue="codigo_pai" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div><label className="block text-sm font-medium text-slate-700">Arquivo CSV ou XLSX<input required name="arquivo" type="file" accept=".csv,.xlsx" className="mt-1.5 block w-full text-sm" /></label><button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <FileUp size={17} />} Importar estrutura</button></form></div>;

  if (view === 'entrada_docs') return <div className="space-y-6">{cabecalho}{avisoNotificacoes}{aviso}<form onSubmit={criar} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2"><label className="text-sm font-medium text-slate-700">Descrição<input required name="descricao" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Ex.: NF fornecedor" /></label><label className="text-sm font-medium text-slate-700">Valor<input required name="valor" inputMode="decimal" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="0,00" /></label><label className="text-sm font-medium text-slate-700">Vencimento<input required name="vencimento" type="date" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><label className="text-sm font-medium text-slate-700">Anexo até 10 MB<input required name="anexo" type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="mt-1.5 block w-full text-sm" /></label><label className="text-sm font-medium text-slate-700 md:col-span-2">Linha digitável ou chave Pix<input name="linha_digitavel" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white disabled:opacity-60 md:w-fit">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <FileUp size={17} />} Enviar para aprovação</button></form><Documentos documentos={documentos} loading={loading} onApprove={aprovar} clienteId={cliente.id} /></div>;

  return <div className="space-y-6">{cabecalho}{avisoNotificacoes}{aviso}<Documentos documentos={documentos.filter(doc => doc.status !== 'aprovado')} loading={loading} onApprove={aprovar} clienteId={cliente.id} /></div>;
};

function Documentos({ documentos, loading, onApprove, clienteId }: { documentos: Documento[]; loading: boolean; onApprove: (id: number) => void; clienteId: number }) {
  const [downloading, setDownloading] = useState<number | null>(null);
  async function baixar(id: number, descricao: string) { setDownloading(id); try { const blob = await flowService.anexo(clienteId, id); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = descricao.replace(/[^a-z0-9]+/gi, '_') + '.bin'; link.click(); URL.revokeObjectURL(url); } finally { setDownloading(null); } }
  return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold text-slate-900">Documentos</h3></div>{loading ? <div className="flex items-center gap-2 p-5 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Carregando...</div> : documentos.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhum documento encontrado.</p> : <div className="divide-y divide-slate-100">{documentos.map(doc => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-medium text-slate-900">{doc.descricao}</p><p className="mt-1 text-sm text-slate-500">Vencimento: {doc.vencimento} · R$ {doc.valor}</p></div><div className="flex items-center gap-3"><button onClick={() => baixar(doc.id, doc.descricao)} className="inline-flex items-center gap-1 text-xs text-slate-600"><Download size={14} /> {downloading === doc.id ? 'Baixando' : 'Anexo'}</button><span className={doc.status === 'aprovado' ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'}>{statusLabel[doc.status] || doc.status}</span>{doc.status === 'pendente_aprovacao' && <button onClick={() => onApprove(doc.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"><CheckCircle2 size={15} /> Aprovar</button>}</div></div>)}</div>}</section>;
}
