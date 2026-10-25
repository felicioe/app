import React, { useEffect, useState } from 'react';
import { LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { cadastrosService, type ClienteCompleto, type ClienteForm, type Fornecedor, type TipoDocumentoCadastro } from '../../services/cadastrosService';

const CLIENTE_FORM_INICIAL: ClienteForm = {
  razaoSocial: '', nomeFantasia: '', cnpjCpf: '', emailContato: '', telefone: '',
  tipoCobranca: 'hora', valorHora: '0', valorMensalidade: '0', franquiaHoras: '0',
  permiteReembolsoDespesas: true, ativo: true,
};

function ClientesTab() {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<ClienteForm>(CLIENTE_FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    cadastrosService.clientes.listar(true).then(setClientes).catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os clientes.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const editar = (cliente: ClienteCompleto) => {
    setEditandoId(cliente.id);
    setForm({
      razaoSocial: cliente.razaoSocial, nomeFantasia: cliente.nomeFantasia === cliente.razaoSocial ? '' : cliente.nomeFantasia,
      cnpjCpf: cliente.cnpjCpf || '', emailContato: cliente.emailContato || '', telefone: cliente.telefone || '',
      tipoCobranca: cliente.tipoCobranca, valorHora: String(cliente.valorHora), valorMensalidade: String(cliente.valorMensalidade),
      franquiaHoras: String(cliente.franquiaHoras), permiteReembolsoDespesas: cliente.permiteReembolsoDespesas, ativo: cliente.ativo,
    });
    setMostrarForm(true);
  };

  const novo = () => { setEditandoId(null); setForm(CLIENTE_FORM_INICIAL); setMostrarForm(true); };

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    setSalvando(true);
    setError('');
    try {
      if (editandoId) await cadastrosService.clientes.editar(editandoId, form);
      else await cadastrosService.clientes.criar(form);
      setMostrarForm(false);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (cliente: ClienteCompleto) => {
    setError('');
    try {
      await cadastrosService.clientes.editar(cliente.id, {
        razaoSocial: cliente.razaoSocial, nomeFantasia: cliente.nomeFantasia === cliente.razaoSocial ? '' : cliente.nomeFantasia,
        cnpjCpf: cliente.cnpjCpf || '', emailContato: cliente.emailContato || '', telefone: cliente.telefone || '',
        tipoCobranca: cliente.tipoCobranca, valorHora: String(cliente.valorHora), valorMensalidade: String(cliente.valorMensalidade),
        franquiaHoras: String(cliente.franquiaHoras), permiteReembolsoDespesas: cliente.permiteReembolsoDespesas, ativo: !cliente.ativo,
      });
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o status.');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex justify-end">
        <button onClick={novo} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-light">
          <Plus size={16} /> Novo cliente
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvar} className="grid gap-3 rounded-xl border border-brand-navy/10 bg-white p-5 shadow-sm md:grid-cols-3">
          <label className="text-xs font-medium text-brand-navy md:col-span-2">Razão social
            <input required value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">Nome fantasia
            <input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">CNPJ/CPF
            <input required value={form.cnpjCpf} onChange={(e) => setForm({ ...form, cnpjCpf: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">E-mail
            <input type="email" value={form.emailContato} onChange={(e) => setForm({ ...form, emailContato: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">Telefone
            <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">Tipo de cobrança
            <select value={form.tipoCobranca} onChange={(e) => setForm({ ...form, tipoCobranca: e.target.value as ClienteForm['tipoCobranca'] })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="hora">Por hora</option>
              <option value="fechado">Fechado (mensalidade)</option>
              <option value="misto">Misto</option>
            </select>
          </label>
          <label className="text-xs font-medium text-brand-navy">Valor da hora contratada (R$)
            <input type="number" min="0" step="0.01" value={form.valorHora} onChange={(e) => setForm({ ...form, valorHora: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">Mensalidade fixa (R$)
            <input type="number" min="0" step="0.01" value={form.valorMensalidade} onChange={(e) => setForm({ ...form, valorMensalidade: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-medium text-brand-navy">Franquia de horas (misto)
            <input type="number" min="0" value={form.franquiaHoras} onChange={(e) => setForm({ ...form, franquiaHoras: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-brand-navy">
            <input type="checkbox" checked={form.permiteReembolsoDespesas} onChange={(e) => setForm({ ...form, permiteReembolsoDespesas: e.target.checked })} /> Permite reembolso de despesas
          </label>
          <div className="flex items-end gap-2 md:col-span-3">
            <button disabled={salvando} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} {editandoId ? 'Salvar alterações' : 'Criar cliente'}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-brand-navy">Cancelar</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[140px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum cliente cadastrado.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream-light text-xs uppercase text-brand-slate">
              <tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Cobrança</th><th className="px-5 py-3">Valor hora</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ações</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="px-5 py-4 font-medium text-brand-navy">{cliente.razaoSocial}</td>
                  <td className="px-5 py-4 text-brand-slate">{cliente.tipoCobranca}</td>
                  <td className="px-5 py-4 font-mono text-brand-slate">R$ {cliente.valorHora.toFixed(2)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cliente.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{cliente.ativo ? 'Ativo' : 'Inativo'}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => editar(cliente)} className="mr-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-cream-light"><Pencil size={13} /> Editar</button>
                    <button onClick={() => void alternarAtivo(cliente)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-cream-light">{cliente.ativo ? 'Desativar' : 'Ativar'}</button>
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

function SeletorCliente({ clienteId, setClienteId }: { clienteId: number | null; setClienteId: (id: number) => void }) {
  const [clientes, setClientes] = useState<ClienteCompleto[]>([]);
  useEffect(() => { cadastrosService.clientes.listar().then((lista) => { setClientes(lista); if (!clienteId && lista[0]) setClienteId(lista[0].id); }).catch(() => {}); }, []);
  return (
    <label className="block text-xs font-medium text-brand-navy">
      Cliente
      <select value={clienteId ?? ''} onChange={(e) => setClienteId(Number(e.target.value))} className="mt-1 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="" disabled>Selecione</option>
        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
      </select>
    </label>
  );
}

function FornecedoresTab() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ razao_social: '', cnpj_cpf: '', dados_bancarios: '', chave_pix: '' });
  const [salvando, setSalvando] = useState(false);

  const load = () => {
    if (!clienteId) return;
    setLoading(true);
    setError('');
    cadastrosService.fornecedores.listar(clienteId).then(setFornecedores).catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar.')).finally(() => setLoading(false));
  };
  useEffect(load, [clienteId]);

  const editar = (f: Fornecedor) => { setEditandoId(f.id); setForm({ razao_social: f.razao_social, cnpj_cpf: f.cnpj_cpf || '', dados_bancarios: f.dados_bancarios || '', chave_pix: f.chave_pix || '' }); };
  const limpar = () => { setEditandoId(null); setForm({ razao_social: '', cnpj_cpf: '', dados_bancarios: '', chave_pix: '' }); };

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clienteId) return;
    setSalvando(true);
    setError('');
    try {
      if (editandoId) await cadastrosService.fornecedores.editar(editandoId, clienteId, form);
      else await cadastrosService.fornecedores.criar(clienteId, form);
      limpar();
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (f: Fornecedor) => {
    if (!clienteId) return;
    setError('');
    try {
      await cadastrosService.fornecedores.excluir(f.id, clienteId);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir.');
    }
  };

  return (
    <div className="space-y-4">
      <SeletorCliente clienteId={clienteId} setClienteId={setClienteId} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={salvar} className="grid gap-3 rounded-xl border border-brand-navy/10 bg-white p-5 shadow-sm md:grid-cols-4">
        <label className="text-xs font-medium text-brand-navy md:col-span-2">Razão social
          <input required value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-brand-navy">CNPJ/CPF
          <input value={form.cnpj_cpf} onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-brand-navy">Chave PIX
          <input value={form.chave_pix} onChange={(e) => setForm({ ...form, chave_pix: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-brand-navy md:col-span-3">Dados bancários
          <input value={form.dados_bancarios} onChange={(e) => setForm({ ...form, dados_bancarios: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <div className="flex items-end gap-2">
          <button disabled={salvando || !clienteId} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} {editandoId ? 'Salvar' : 'Criar'}
          </button>
          {editandoId && <button type="button" onClick={limpar} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-brand-navy">Cancelar</button>}
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : fornecedores.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum fornecedor cadastrado para este cliente.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream-light text-xs uppercase text-brand-slate"><tr><th className="px-5 py-3">Razão social</th><th className="px-5 py-3">CNPJ/CPF</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {fornecedores.map((f) => (
                <tr key={f.id}>
                  <td className="px-5 py-4 font-medium text-brand-navy">{f.razao_social}</td>
                  <td className="px-5 py-4 text-brand-slate">{f.cnpj_cpf || '—'}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => editar(f)} className="mr-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-cream-light"><Pencil size={13} /> Editar</button>
                    <button onClick={() => void excluir(f)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={13} /> Excluir</button>
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

function TiposDocumentoTab() {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [tipos, setTipos] = useState<TipoDocumentoCadastro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const load = () => {
    if (!clienteId) return;
    setLoading(true);
    setError('');
    cadastrosService.tiposDocumento.listar(clienteId).then(setTipos).catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível carregar.')).finally(() => setLoading(false));
  };
  useEffect(load, [clienteId]);

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!clienteId) return;
    setSalvando(true);
    setError('');
    try {
      if (editandoId) await cadastrosService.tiposDocumento.editar(editandoId, clienteId, nome);
      else await cadastrosService.tiposDocumento.criar(clienteId, nome);
      setEditandoId(null); setNome('');
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (tipo: TipoDocumentoCadastro) => {
    if (!clienteId) return;
    setError('');
    try {
      await cadastrosService.tiposDocumento.excluir(tipo.id, clienteId);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir.');
    }
  };

  return (
    <div className="space-y-4">
      <SeletorCliente clienteId={clienteId} setClienteId={setClienteId} />
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={salvar} className="flex flex-wrap items-end gap-3 rounded-xl border border-brand-navy/10 bg-white p-5 shadow-sm">
        <label className="flex-1 text-xs font-medium text-brand-navy">Nome do tipo de documento
          <input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Boleto, Nota Fiscal, Fatura" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button disabled={salvando || !clienteId} className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {salvando ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />} {editandoId ? 'Salvar' : 'Criar'}
        </button>
        {editandoId && <button type="button" onClick={() => { setEditandoId(null); setNome(''); }} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-brand-navy">Cancelar</button>}
      </form>

      <div className="overflow-hidden rounded-xl border border-brand-navy/10 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-[120px] items-center justify-center"><LoaderCircle className="animate-spin text-slate-400" /></div>
        ) : tipos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhum tipo de documento cadastrado para este cliente.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-cream-light text-xs uppercase text-brand-slate"><tr><th className="px-5 py-3">Nome</th><th className="px-5 py-3 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td className="px-5 py-4 font-medium text-brand-navy">{tipo.nome}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => { setEditandoId(tipo.id); setNome(tipo.nome); }} className="mr-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-brand-navy hover:bg-brand-cream-light"><Pencil size={13} /> Editar</button>
                    <button onClick={() => void excluir(tipo)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"><Trash2 size={13} /> Excluir</button>
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

const ABAS = [
  { id: 'clientes', label: 'Clientes' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'tipos_documento', label: 'Tipos de Documento' },
] as const;

export function AdminCadastrosView() {
  const [aba, setAba] = useState<(typeof ABAS)[number]['id']>('clientes');

  return (
    <main className="min-h-screen bg-brand-cream-light px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <a href="/" className="text-sm font-semibold text-brand-gold-dark">← Thera Financial</a>
          <h1 className="mt-2 text-2xl font-bold text-brand-navy">Cadastros</h1>
          <p className="mt-1 text-sm text-brand-slate">Clientes, fornecedores e tipos de documento usados em todo o sistema.</p>
        </div>

        <div className="flex gap-2">
          {ABAS.map((item) => (
            <button
              key={item.id}
              onClick={() => setAba(item.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${aba === item.id ? 'bg-brand-navy text-white' : 'border border-brand-navy/15 bg-white text-brand-navy'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {aba === 'clientes' && <ClientesTab />}
        {aba === 'fornecedores' && <FornecedoresTab />}
        {aba === 'tipos_documento' && <TiposDocumentoTab />}
      </div>
    </main>
  );
}
