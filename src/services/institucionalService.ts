import { apiClient } from './apiClient';

export type ConteudoSite = Record<string, string>;
export interface Servico { titulo: string; descricao: string }

export const CONTEUDO_PADRAO: ConteudoSite = {
  hero_eyebrow: 'Consultoria e BPO Financeiro',
  hero_titulo: 'Clareza financeira para decidir com confiança.',
  hero_subtitulo: 'Consultoria estratégica e operação financeira (BPO) para empresas que querem crescer com controle.',
  sobre_texto: 'A Thera Financial une consultoria estratégica e operação financeira (BPO) para dar às empresas clareza, controle e previsibilidade sobre seus números.',
  servicos: JSON.stringify([
    { titulo: 'Thera Advisory', descricao: 'Consultoria estratégica, projetos e apontamento técnico de horas.' },
    { titulo: 'Thera Flow (BPO Financeiro)', descricao: 'Documentos a pagar, aprovações e rotinas financeiras operacionais.' },
    { titulo: 'Governança e controles', descricao: 'Alçadas de aprovação, auditoria e processos financeiros estruturados.' },
  ] satisfies Servico[]),
  contato_titulo: 'Vamos conversar sobre o seu próximo passo?',
  contato_email: 'contato@therafinancial.com.br',
  cta_workspace_label: 'Acessar Workspace BPO',
  cta_workspace_desc: 'Documentos, pagamentos e aprovações financeiras.',
  cta_advisory_label: 'Acessar Thera Advisory',
  cta_advisory_desc: 'Apontamento técnico, projetos e horas por cliente.',
};

export function parseServicos(valor: string | undefined): Servico[] {
  if (!valor) return [];
  try {
    const lista = JSON.parse(valor);
    if (!Array.isArray(lista)) return [];
    return lista.filter((item): item is Servico => typeof item?.titulo === 'string' && typeof item?.descricao === 'string');
  } catch {
    return [];
  }
}

export const institucionalService = {
  obter: () => apiClient<ConteudoSite>('institucional.php'),
  salvar: (conteudo: ConteudoSite) => apiClient<{ atualizado: boolean }>('institucional.php', { method: 'POST', body: JSON.stringify(conteudo) }),
};
