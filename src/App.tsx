import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { FaturamentoView } from './components/advisory/FaturamentoView';
import { KanbanView } from './components/advisory/KanbanView';
import { TimesheetView } from './components/advisory/TimesheetView';
import { WorkspaceView } from './components/flow/WorkspaceView';
import { CLIENTES_MOCK, Cliente } from './mock/mockData';
import { authService } from './services/authService';
import { clienteService } from './services/clienteService';
import { ApiError, type Usuario } from './services/apiClient';

type Module = 'workspace' | 'advisory';

function LandingPage() {
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8"><header className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">T</span><span className="text-lg font-semibold">Thera <span className="font-normal text-slate-400">Workspace</span></span></div><span className="text-xs text-slate-400">Thera Financial</span></header><section className="flex flex-1 flex-col justify-center py-20"><p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Gestão financeira e estratégica</p><h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Um espaço seguro para operar, acompanhar e decidir.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Acesse o ambiente certo para o seu trabalho na Thera Financial.</p><div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2"><a href="/workspace" className="group rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 transition hover:border-emerald-300 hover:bg-emerald-500/20"><BriefcaseBusiness className="mb-8 text-emerald-300" /><span className="block text-xl font-semibold">Acessar Workspace BPO</span><span className="mt-2 block text-sm text-slate-300">Documentos, pagamentos e aprovações financeiras.</span><span className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-300">Entrar <ArrowRight size={16} /></span></a><a href="/advisory" className="group rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6 transition hover:border-blue-300 hover:bg-blue-500/20"><Sparkles className="mb-8 text-blue-300" /><span className="block text-xl font-semibold">Acessar Thera Advisory</span><span className="mt-2 block text-sm text-slate-300">Apontamento técnico, projetos e horas por cliente.</span><span className="mt-6 flex items-center gap-2 text-sm font-semibold text-blue-300">Entrar <ArrowRight size={16} /></span></a></div></section></div></main>;
}

function LoginPage({ module, onLogin }: { module: Module; onLogin: (user: Usuario) => void }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const label = module === 'workspace' ? 'Workspace BPO' : 'Thera Advisory';
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setLoading(true); try { onLogin(await authService.login(email, senha)); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível entrar agora.'); } finally { setLoading(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"><a href="/" className="text-sm font-semibold text-blue-600">← Thera Financial</a><div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"><LockKeyhole size={22} /></div><h1 className="mt-6 text-2xl font-bold text-slate-900">Entrar no {label}</h1><p className="mt-2 text-sm text-slate-500">Use seu acesso Thera Financial para continuar.</p><label className="mt-6 block text-sm font-medium text-slate-700">E-mail<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><label className="mt-4 block text-sm font-medium text-slate-700">Senha<input required type="password" value={senha} onChange={event => setSenha(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={17} />}Entrar</button></form></main>;
}

export function App() {
  const module: Module | null = window.location.pathname.startsWith('/workspace') ? 'workspace' : window.location.pathname.startsWith('/advisory') ? 'advisory' : null;
  const [user, setUser] = useState<Usuario | null>(null); const [checking, setChecking] = useState(module !== null); const [activeView, setActiveView] = useState(module === 'advisory' ? 'kanban' : 'entrada_docs');
  const [clientes, setClientes] = useState<Cliente[]>([]); const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null); const [loadingClientes, setLoadingClientes] = useState(false); const [usandoMock, setUsandoMock] = useState(false);
  useEffect(() => { if (module) authService.current().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false)); }, [module]);
  useEffect(() => {
    if (!user) return;
    setLoadingClientes(true);
    clienteService.listar()
      .then((lista) => { setClientes(lista); setClienteSelecionado(lista[0] ?? null); setUsandoMock(false); })
      .catch(() => { setClientes(CLIENTES_MOCK); setClienteSelecionado(CLIENTES_MOCK[0]); setUsandoMock(true); })
      .finally(() => setLoadingClientes(false));
  }, [user]);
  if (!module) return <LandingPage />; if (checking) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>; if (!user) return <LoginPage module={module} onLogin={setUser} />;
  if (loadingClientes) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;
  if (!clienteSelecionado) return <div className="flex min-h-screen items-center justify-center text-slate-500"><p className="text-sm">Nenhum cliente vinculado à sua conta.</p></div>;
  const activeModule = module === 'workspace' ? 'flow' : 'advisory';
  return <AppLayout activeModule={activeModule} setActiveModule={next => { window.location.href = next === 'flow' ? '/workspace' : '/advisory'; }} activeView={activeView} setActiveView={setActiveView} clientes={clientes} clienteSelecionado={clienteSelecionado} setClienteSelecionado={setClienteSelecionado} avisoClientesMock={usandoMock}>{module === 'advisory' && activeView === 'kanban' ? <KanbanView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'dashboard' ? <TimesheetView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'faturas' ? <FaturamentoView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'entrada_docs' ? <WorkspaceView cliente={clienteSelecionado} /> : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h3 className="font-semibold text-slate-800">Módulo em desenvolvimento</h3><p className="mt-1 text-sm text-slate-500">Visualização: {activeView}</p></div>}</AppLayout>;
}

export default App;
