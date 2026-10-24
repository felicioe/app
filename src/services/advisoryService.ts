import { apiClient, params } from './apiClient';
export interface Apontamento { id: number; projeto_id: number; tarefa_id: number | null; data: string; hora_inicio: string; hora_fim: string; duracao_minutos: number; status_faturamento: 'pendente' | 'faturado' }
export interface Projeto { id: number; nome: string }
export interface Tarefa { id: number; projeto_id: number; titulo: string; status: 'pendente' | 'em_andamento' | 'concluida' }
export interface Fechamento { id: number; minutos: number; honorarios_centavos: number; despesas_centavos: number; total_centavos: number }
export const advisoryService = {
  timesheet: (cliente_id: number, inicio?: string, fim?: string) => apiClient<{ apontamentos: Apontamento[]; total_minutos: number }>(`advisory/timesheet.php?${params({ cliente_id, inicio, fim })}`),
  apontar: (data: { cliente_id: number; tarefa_id: number; data: string; hora_inicio: string; hora_fim: string; descricao?: string; faturavel?: boolean }) => apiClient<{ id: number; duracao_minutos: number }>('advisory/timesheet.php', { method: 'POST', body: JSON.stringify(data) }),
  kanban: (cliente_id: number) => apiClient<{ projetos: Projeto[]; tarefas: Tarefa[] }>(`advisory/kanban.php?${params({ cliente_id })}`),
  criarTarefa: (cliente_id: number, projeto_id: number, titulo: string) => apiClient<{ id: number }>('advisory/kanban.php', { method: 'POST', body: JSON.stringify({ cliente_id, projeto_id, titulo }) }),
  moverTarefa: (cliente_id: number, id: number, status: Tarefa['status']) => apiClient('advisory/kanban.php', { method: 'PATCH', body: JSON.stringify({ cliente_id, id, status }) }),
  fechar: (cliente_id: number, inicio: string, fim: string) => apiClient<Fechamento>('advisory/faturamento.php', { method: 'POST', body: JSON.stringify({ cliente_id, inicio, fim }) }),
  registrarDespesa: (data: { cliente_id: number; data: string; descricao: string; valor: string; reembolsavel: boolean }) => apiClient<{ id: number }>('advisory/despesas.php', { method: 'POST', body: JSON.stringify(data) }),
};
