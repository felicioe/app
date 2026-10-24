import React, { useEffect, useState } from 'react';
import { LoaderCircle, RefreshCw, Users } from 'lucide-react';
import { adminService, type UsuarioAdmin } from '../../services/adminService';
import type { Cliente } from '../../mock/mockData';
import { ApiError } from '../../services/apiClient';

export const AdminView: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function carregar() {
    setLoading(true); setError('');
    try { const [cs, us] = await Promise.all([adminService.clientes(), adminService.usuarios()]); setClientes(cs); setUsuarios(us); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar a administração.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Administração</h2><p className="text-sm text-slate-500">Usuários e clientes autorizados do Workspace</p></div><button onClick={carregar} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={16} /> Atualizar</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={16} /> Carregando...</div> : <div className="grid gap-6 xl:grid-cols-2">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><Users size={18} /><h3 className="font-semibold">Usuários ({usuarios.length})</h3></div><div className="divide-y divide-slate-100">{usuarios.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhum usuário encontrado.</p> : usuarios.map(u => <div key={u.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium text-slate-900">{u.nome}</p><p className="text-xs text-slate-500">{u.email} · {u.perfil}</p></div><span className={u.ativo ? 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700' : 'rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500'}>{u.ativo ? 'Ativo' : 'Inativo'}</span></div>)}</div></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Clientes ({clientes.length})</h3></div><div className="divide-y divide-slate-100">{clientes.length === 0 ? <p className="p-5 text-sm text-slate-500">Nenhum cliente encontrado.</p> : clientes.map(c => <div key={c.id} className="flex items-center justify-between gap-3 p-4"><div><p className="font-medium text-slate-900">{c.nomeFantasia}</p><p className="text-xs text-slate-500">Cobrança: {c.tipoCobranca}</p></div><span className="text-xs font-semibold text-slate-500">#{c.id}</span></div>)}</div></section>
    </div>}
  </div>;
};
