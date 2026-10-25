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

const PERFIL_LABEL: Record<Usuario['perfil'], string> = {
  bpo_adm: 'Administrador BPO',
  bpo_operador: 'Operador BPO',
  cliente_diretor: 'Diretor',
  cliente_gerente: 'Gerente',
  cliente_coordenador: 'Coordenador',
  cliente_usuario: 'Usuário',
};

function LandingPage() {
  const [conteudo, setConteudo] = useState<ConteudoSite>(CONTEUDO_PADRAO);

  useEffect(() => {
    institucionalService.obter().then((real) => setConteudo({ ...CONTEUDO_PADRAO, ...real })).catch(() => {});
  }, []);

  const c = (chave: keyof typeof CONTEUDO_PADRAO) => conteudo[chave] || CONTEUDO_PADRAO[chave];
  const servicos = parseServicos(conteudo.servicos);

  return (
    <main className="min-h-screen bg-white text-brand-navy">
      <header className="border-b border-brand-navy/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <img src="/brand/logo-horizontal.png" alt="Thera Financial" className="h-9 w-auto sm:h-10" />
          <nav className="flex items-center gap-2">
            <a href="/workspace" className="rounded-full border border-brand-navy/15 px-4 py-2 text-xs font-semibold text-brand-navy transition hover:border-brand-navy/40 hover:bg-brand-cream-light">{c('cta_workspace_label')}</a>
            <a href="/advisory" className="rounded-full bg-brand-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-navy-light">{c('cta_advisory_label')}</a>
          </nav>
        </div>
      </header>

      <section className="bg-brand-cream-light">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[3fr_2fr] lg:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-gold/40 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-brand-gold-dark">
              {c('hero_eyebrow')}
            </p>
            <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-brand-navy sm:text-5xl lg:text-[3.4rem]">{c('hero_titulo')}</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-brand-slate">{c('hero_subtitulo')}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="/workspace" className="group inline-flex items-center gap-2 rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-navy/20 transition hover:bg-brand-navy-light">
                <BriefcaseBusiness size={18} /> {c('cta_workspace_label')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </a>
              <a href="/advisory" className="group inline-flex items-center gap-2 rounded-xl border-2 border-brand-navy/15 bg-white px-6 py-3.5 text-sm font-semibold text-brand-navy transition hover:border-brand-gold hover:text-brand-gold-dark">
                <Sparkles size={18} /> {c('cta_advisory_label')} <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <img src="/brand/logo-mark.png" alt="" aria-hidden="true" className="w-56 opacity-90 drop-shadow-xl" />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-start">
            <div>
              <span className="h-1 w-12 rounded-full bg-brand-gold block" />
              <h2 className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-slate">Quem somos</h2>
            </div>
            <p className="max-w-2xl text-xl leading-9 text-brand-navy/90">{c('sobre_texto')}</p>
          </div>
        </div>
      </section>

      {servicos.length > 0 && (
        <section className="bg-brand-cream-light">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <span className="h-1 w-12 rounded-full bg-brand-gold block" />
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">O que fazemos</h2>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {servicos.map((servico) => (
                <div key={servico.titulo} className="rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-gold-dark">
                    <Sparkles size={20} />
                  </span>
                  <h3 className="font-bold text-brand-navy">{servico.titulo}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-slate">{servico.descricao}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-brand-navy">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{c('contato_titulo')}</h2>
          <a href={`mailto:${c('contato_email')}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-gold px-6 py-3.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-gold-dark hover:text-white">
            {c('contato_email')} <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
          <img src="/brand/logo-mark.png" alt="Thera Financial" className="h-7 w-auto opacity-80" />
          <div className="flex flex-wrap gap-5 text-xs text-brand-slate">
            <a href="/privacidade" className="hover:text-brand-navy">Política de Privacidade</a>
            <a href="/termos" className="hover:text-brand-navy">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) { const privacy = kind === 'privacy'; return <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-800"><article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><a href="/" className="text-sm font-semibold text-brand-gold-dark">← Thera Financial</a><h1 className="mt-8 text-3xl font-bold text-slate-900">{privacy ? 'Política de Privacidade' : 'Termos de Uso'}</h1><p className="mt-2 text-sm text-slate-500">Última atualização: 24 de outubro de 2026</p>{privacy ? <><h2 className="mt-8 text-lg font-semibold">1. Dados tratados</h2><p className="mt-2 leading-7">Tratamos dados necessários para autenticação, operação dos módulos Workspace BPO e Advisory, segurança, auditoria e atendimento.</p><h2 className="mt-6 text-lg font-semibold">2. Uso e proteção</h2><p className="mt-2 leading-7">Os dados são usados para prestar os serviços contratados, prevenir acessos indevidos e cumprir obrigações legais. Aplicamos controle de acesso, sessões autenticadas e medidas técnicas compatíveis com o serviço.</p><h2 className="mt-6 text-lg font-semibold">3. Direitos</h2><p className="mt-2 leading-7">Para solicitar acesso, correção ou esclarecimentos sobre seus dados, entre em contato com a Thera Financial pelo canal de atendimento habitual.</p></> : <><h2 className="mt-8 text-lg font-semibold">1. Acesso</h2><p className="mt-2 leading-7">O acesso é destinado a usuários autorizados. Cada usuário deve manter suas credenciais em sigilo e comunicar qualquer uso indevido.</p><h2 className="mt-6 text-lg font-semibold">2. Uso aceitável</h2><p className="mt-2 leading-7">O sistema deve ser utilizado exclusivamente para atividades financeiras, operacionais e consultivas relacionadas à Thera Financial e seus clientes.</p><h2 className="mt-6 text-lg font-semibold">3. Disponibilidade</h2><p className="mt-2 leading-7">Podem ocorrer manutenções, atualizações ou indisponibilidades de terceiros. A Thera Financial buscará comunicar impactos relevantes e preservar a integridade dos dados.</p></>}</article></main>; }

function CookieBanner() { const [visible, setVisible] = useState(() => localStorage.getItem('thera_cookie_consent') !== 'accepted'); if (!visible) return null; return <aside role="dialog" aria-label="Consentimento de cookies" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl rounded-xl border border-brand-navy/10 bg-brand-navy p-4 text-sm text-white shadow-2xl"><p>Usamos cookies essenciais para manter a sessão e proteger o acesso. Consulte nossa <a className="underline" href="/privacidade">Política de Privacidade</a>.</p><div className="mt-3 flex gap-2"><button onClick={() => { localStorage.setItem('thera_cookie_consent', 'accepted'); setVisible(false); }} className="rounded-lg bg-brand-gold px-4 py-2 font-semibold text-brand-navy">Aceitar</button><button onClick={() => { localStorage.setItem('thera_cookie_consent', 'essential'); setVisible(false); }} className="rounded-lg border border-white/30 px-4 py-2 font-semibold">Apenas essenciais</button></div></aside>; }

function LoginPage({ label, onLogin }: { label: string; onLogin: (user: Usuario) => void }) {
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); setLoading(true); try { onLogin(await authService.login(email, senha)); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível entrar agora.'); } finally { setLoading(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-brand-cream-light px-6"><form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-xl"><a href="/"><img src="/brand/logo-horizontal.png" alt="Thera Financial" className="h-8 w-auto" /></a><div className="mt-8 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-navy text-white"><LockKeyhole size={22} /></div><h1 className="mt-6 text-2xl font-bold text-brand-navy">Entrar no {label}</h1><p className="mt-2 text-sm text-brand-slate">Use seu acesso Thera Financial para continuar.</p><label className="mt-6 block text-sm font-medium text-brand-navy">E-mail<input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-gold" /></label><label className="mt-4 block text-sm font-medium text-brand-navy">Senha<input required type="password" value={senha} onChange={event => setSenha(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-gold" /></label><div className="mt-2 text-right"><a href="mailto:felicioe@gmail.com?subject=Redefinição%20de%20acesso%20Thera" className="text-xs font-semibold text-brand-gold-dark hover:underline">Esqueci minha senha</a></div>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 py-3 font-semibold text-white transition hover:bg-brand-navy-light disabled:opacity-60">{loading && <LoaderCircle className="animate-spin" size={17} />}Entrar</button><p className="mt-5 text-center text-xs text-brand-slate"><a href="/privacidade" className="hover:text-brand-navy hover:underline">Privacidade</a><span className="mx-2">·</span><a href="/termos" className="hover:text-brand-navy hover:underline">Termos de uso</a></p></form></main>;
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
  return <AppLayout activeModule={activeModule} setActiveModule={next => { window.location.href = next === 'flow' ? '/workspace' : '/advisory'; }} activeView={activeView} setActiveView={setActiveView} clientes={clientes} clienteSelecionado={clienteSelecionado} setClienteSelecionado={setClienteSelecionado} avisoClientesMock={usandoMock} isAdmin={user.perfil === 'bpo_adm'} nomeUsuario={user.nome} perfilLabel={PERFIL_LABEL[user.perfil]}>{module === 'advisory' && activeView === 'kanban' ? <KanbanView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'dashboard' ? <TimesheetView cliente={clienteSelecionado} /> : module === 'advisory' && activeView === 'faturas' ? <FaturamentoView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'entrada_docs' ? <WorkspaceView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'plano_contas' ? <PlanoContasView cliente={clienteSelecionado} /> : module === 'workspace' && activeView === 'fila_pagamentos' ? <FilaPagamentosView cliente={clienteSelecionado} /> : <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"><h3 className="font-semibold text-slate-800">Módulo em desenvolvimento</h3><p className="mt-1 text-sm text-slate-500">Visualização: {activeView}</p></div>}</AppLayout>;
}

export default App;
