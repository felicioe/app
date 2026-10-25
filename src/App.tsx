import React, { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { FaturamentoView } from './components/advisory/FaturamentoView';
import { KanbanView } from './components/advisory/KanbanView';
import { TimesheetView } from './components/advisory/TimesheetView';
import { FilaPagamentosView } from './components/flow/FilaPagamentosView';
import { PlanoContasView } from './components/flow/PlanoContasView';
import { WorkspaceView } from './components/flow/WorkspaceView';
import { AdminSiteView } from './components/admin/AdminSiteView';
import { CLIENTES_MOCK, Cliente } from './mock/mockData';
import { authService } from './services/authService';
import { clienteService } from './services/clienteService';
import { CONTEUDO_PADRAO, institucionalService, parseServicos, type ConteudoSite } from './services/institucionalService';
import { ApiError, type Usuario } from './services/apiClient';

type Module = 'workspace' | 'advisory';

function LandingPage() {
  const [conteudo, setConteudo] = useState<ConteudoSite>(CONTEUDO_PADRAO);

  useEffect(() => {
    institucionalService.obter().then((real) => setConteudo({ ...CONTEUDO_PADRAO, ...real })).catch(() => {});
  }, []);

  const c = (chave: keyof typeof CONTEUDO_PADRAO) => conteudo[chave] || CONTEUDO_PADRAO[chave];
  const servicos = parseServicos(conteudo.servicos);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">T</span>
            <span className="text-lg font-semibold">Thera <span className="font-normal text-slate-400">Financial</span></span>
          </div>
          <nav className="flex items-center gap-2">
            <a href="/workspace" className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">{c('cta_workspace_label')}</a>
            <a href="/advisory" className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">{c('cta_advisory_label')}</a>
          </nav>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">{c('hero_eyebrow')}</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">{c('hero_titulo')}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{c('hero_subtitulo')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/workspace" className="group inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-300 hover:bg-emerald-500/20">
              <BriefcaseBusiness size={18} /> {c('cta_workspace_label')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
            <a href="/advisory" className="group inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-300 transition hover:border-blue-300 hover:bg-blue-500/20">
              <Sparkles size={18} /> {c('cta_advisory_label')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
            </a>
          </div>
        </section>

        <section className="border-t border-slate-800 py-14">
          <p className="max-w-3xl text-base leading-8 text-slate-300">{c('sobre_texto')}</p>
        </section>

        {servicos.length > 0 && (
          <section className="border-t border-slate-800 py-14">
            <h2 className="mb-6 text-xl font-bold">O que fazemos</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {servicos.map((servico) => (
                <div key={servico.titulo} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h3 className="font-semibold text-white">{servico.titulo}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{servico.descricao}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-slate-800 py-14">
          <h2 className="text-xl font-bold">{c('contato_titulo')}</h2>
          <a href={`mailto:${c('contato_email')}`} className="mt-3 inline-block text-sm font-semibold text-blue-400 hover:underline">{c('contato_email')}</a>
        </section>

        <footer className="flex flex-wrap gap-4 border-t border-slate-800 pt-5 text-xs text-slate-400">
          <a href="/privacidade" className="hover:text-white">Política de Privacidade</a>
          <a href="/termos" className="hover:text-white">Termos de Uso</a>
        </footer>
      </div>
    </main>
  );
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) { const privacy = kind === 'privacy'; return <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-800"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><a href="/" className="text-sm font-semibold text-blue-600">← Thera Financial</a><h1 className="mt-8 text-3xl font-bold text-slate-900">{privacy ? 'Política de Privacidade' : 'Termos de Uso'}</h1><p className="mt-2 text-sm text-slate-500">Última atualização: 24 de outubro de 2026</p>{privacy ? <><h2 className="mt-8 text-lg font-semibold">1. Dados tratados</h2><p className="mt-2 leading-7">Tratamos dados necessários para autenticação, operação dos módulos Workspace BPO e Advisory, segurança, auditoria e atendimento.</p><h2 className="mt-6 text-lg font-semibold">2. Uso e proteção</h2><p className="mt-2 leading-7">Os dados são usados para prestar os serviços contratados, prevenir acessos indevidos e cumprir obrigações legais. Aplicamos controle de acesso, sessões autenticadas e medidas técnicas compatíveis com o serviço.</p><h2 className="mt-6 text-lg font-semibold">3. Direitos</h2><p className="mt-2 leading-7">Para solicitar acesso, correção ou esclarecimentos sobre seus dados, entre em contato com a Thera Financial pelo canal de atendimento habitual.</p></> : <><h2 className="mt-8 text-lg font-semibold">1. Acesso</h2><p className="mt-2 leading-7">O acesso é destinado a usuários autorizados. Cada usuário deve manter suas credenciais em sigilo e comunicar qualquer uso indevido.</p><h2 className="mt-6 text-lg font-semibold">2. Uso aceitável</h2><p className="mt-2 leading-7">O sistema deve ser utilizado exclusivamente para atividades financeiras, operacionais e consultivas relacionadas à Thera Financial e seus clientes.</p><h2 className="mt-6 text-lg font-semibold">3. Disponibilidade</h2><p className="mt-2 leading-7">Podem ocorrer manutenções, atualizações ou indisponibilidades de terceiros. A Thera Financial buscará comunicar impactos relevantes e preservar a integridade dos dados.</p></>}</article></main>; }

function CookieBanner() { const [visible, setVisible] = useState(() => localStorage.getItem('thera_cookie_consent') !== 'accepted'); if (!visible) return null; return <aside role="dialog" aria-label="Consentimento de cookies" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-white shadow-2xl"><p>Usamos cookies essenciais para manter a sessão e proteger o acesso. Consulte nossa <a className="underline" href="/privacidade">Política de Privacidade</a>.</p><div className="mt-3 flex gap-2"><button onClick={() => { localStorage.setItem('thera_cookie_consent', 'accepted'); setVisible(false); }} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold">Aceitar</button><button onClick={() => { localStorage.setItem('thera_cookie_consent', 'essential'); setVisible(false); }} className="rounded-lg border border-slate-500 px-4 py-2 font-semibold">Apenas essenciais</button></div></aside>; }

function LoginPage({ label, onLogin }: { label: string; onLogin: (user: Usuario) => void }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setLoading(true); try { onLogin(await authService.login(email, senha)); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível entrar agora.'); } finally { setLoading(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"><a href="/" className="text-sm font-semibold text-blue-600">← Thera Financial</a><div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"><LockKeyhole size={22} /></div><h1 className="mt-6 text-2xl font-bold text-slate-900">Entrar no {label}</h1><p className="mt-2 text-sm text-slate-500">Use seu acesso Thera Financial para continuar.</p><label className="mt-6 block text-sm font-medium text-slate-700">E-mail<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><label className="mt-4 block text-sm font-medium text-slate-700">Senha<input required type="password" value={senha} onChange={event => setSenha(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" /></label><div className="mt-2 text-right"><a href="mailto:felicioe@gmail.com?subject=Redefinição%20de%20acesso%20Thera" className="text-xs font-semibold text-blue-600 hover:underline">Esqueci minha senha</a></div>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={17} />}Entrar</button><p className="mt-5 text-center text-xs text-slate-500"><a href="/privacidade" className="hover:text-slate-800 hover:underline">Privacidade</a><span className="mx-2">·</span><a href="/termos" className="hover:text-slate-800 hover:underline">Termos de uso</a></p></form></main>;
}

function AdminSiteRoute() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { authService.current().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false)); }, []);
  if (checking) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;
  if (!user) return <LoginPage label="Painel Administrativo" onLogin={setUser} />;
  if (user.perfil !== 'bpo_adm') return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-slate-600"><p className="text-sm">Acesso restrito ao administrador BPO.</p></div>;
  return <AdminSiteView />;
}

export function App() {
  if (window.location.pathname === '/privacidade') return <LegalPage kind="privacy" />;
  if (window.location.pathname === '/termos') return <LegalPage kind="terms" />;
  if (window.location.pathname === '/admin/site') return <AdminSiteRoute />;
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
  if (!module) return <><LandingPage /><CookieBanner /></>; if (checking) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>; if (!user) return <><LoginPage label={module === 'workspace' ? 'Workspace BPO' : 'Thera Advisory'} onLogin={setUser} /><CookieBanner /></>;
  if (loadingClientes) return <div className="flex min-h-screen items-center justify-center text-slate-500"><LoaderCircle className="animate-spin" /></div>;
  if (!clienteSelecionado) return <div className="flex min-h-screen items-center justify-center text-slate-500"><p className="text-sm">Nenhum cliente vinculado à sua conta.</p></div>;
  const activeModule = module === 'workspace' ? 'flow' : 'advisory';
  return <AppLayout activeModule={activeModule} setActiveModule={next => { window.location.href = next === 'flow' ? '/workspace' : '/advisory'; }} activeView={activeView} setActiveView={setActiveView} clientes={clientes} clienteSelecionado={clienteSelecionado} setClienteSelecionado={setClienteSelecionado} avisoClientesMock={usandoMock} isAdmin={user.perfil === 'bpo_adm'}>{module === 'advisory' && activeView === 'kanban' ? <KanbanView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'dashboard' ? <TimesheetView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'faturas' ? <FaturamentoView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'entrada_docs' ? <WorkspaceView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'plano_contas' ? <PlanoContasView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'fila_pagamentos' ? <FilaPagamentosView cliente={clienteSelecionado} /> : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h3 className="font-semibold text-slate-800">Módulo em desenvolvimento</h3><p className="mt-1 text-sm text-slate-500">Visualização: {activeView}</p></div>}</AppLayout>;
}

export default App;
