import { apiClient, params, sessionStore, ApiError } from './apiClient';
export interface Apontamento { id: number; projeto_id: number; tarefa_id: number | null; data: string; hora_inicio: string; hora_fim: string; duracao_minutos: number; status_faturamento: 'pendente' | 'faturado' }
export interface Projeto { id: number; nome: string }
export interface Tarefa { id: number; projeto_id: number; titulo: string; descricao: string | null; prazo: string | null; status: 'pendente' | 'em_andamento' | 'concluida' }
export interface TarefaAnexo { id: number; nome_original: string; mime: string; tamanho: number; criado_em: string; enviado_por: string | null }
export interface Fechamento { id: number; minutos: number; honorarios_centavos: number; despesas_centavos: number; total_centavos: number }
export interface Fatura { id: number; codigo_fatura: string; periodo_inicio: string; periodo_fim: string; total_horas_minutos: number; valor_servicos: string; valor_despesas_reembolsadas: string; valor_total: string; status: 'rascunho' | 'emitida' | 'paga' }
export interface Despesa { id: number; tipo: string; data: string; descricao: string; valor: string; reembolsavel: 0 | 1; fatura_id: number | null }
export const advisoryService = {
  timesheet: (cliente_id: number, inicio?: string, fim?: string) => apiClient<{ apontamentos: Apontamento[]; total_minutos: number }>(`advisory/timesheet.php?${params({ cliente_id, inicio, fim })}`),
  apontar: (data: { cliente_id: number; tarefa_id: number; data: string; hora_inicio: string; hora_fim: string; descricao?: string; faturavel?: boolean }) => apiClient<{ id: number; duracao_minutos: number }>('advisory/timesheet.php', { method: 'POST', body: JSON.stringify(data) }),
  kanban: (cliente_id: number) => apiClient<{ projetos: Projeto[]; tarefas: Tarefa[] }>(`advisory/kanban.php?${params({ cliente_id })}`),
  criarProjeto: (cliente_id: number, titulo: string) => apiClient<{ id: number }>('advisory/projetos.php', { method: 'POST', body: JSON.stringify({ cliente_id, titulo }) }),
  criarTarefa: (data: { cliente_id: number; projeto_id: number; titulo: string; descricao?: string; prazo?: string }) => apiClient<{ id: number }>('advisory/kanban.php', { method: 'POST', body: JSON.stringify(data) }),
  moverTarefa: (cliente_id: number, id: number, status: Tarefa['status']) => apiClient('advisory/kanban.php', { method: 'PATCH', body: JSON.stringify({ cliente_id, id, status }) }),
  anexos: (cliente_id: number, tarefa_id: number) => apiClient<TarefaAnexo[]>(`advisory/tarefa_anexos.php?${params({ cliente_id, tarefa_id })}`),
  enviarAnexo: (cliente_id: number, tarefa_id: number, arquivo: File, nome?: string) => {
    const data = new FormData();
    data.set('cliente_id', String(cliente_id));
    data.set('tarefa_id', String(tarefa_id));
    data.set('arquivo', arquivo, arquivo.name || nome || 'anexo');
    if (nome) data.set('nome', nome);
    return apiClient<{ id: number }>('advisory/tarefa_anexos.php', { method: 'POST', body: data });
  },
  async baixarAnexo(cliente_id: number, anexo_id: number): Promise<Blob> {
    const response = await fetch(`/api/advisory/tarefa_anexo.php?${params({ cliente_id, anexo_id })}`, { headers: { Authorization: `Bearer ${sessionStore.read()?.token || ''}` }, cache: 'no-store' });
    if (response.status === 401) sessionStore.clear();
    if (!response.ok) throw new ApiError(response.status, 'Falha ao baixar anexo.');
    return response.blob();
  },
  faturas: (cliente_id: number) => apiClient<Fatura[]>(`advisory/faturamento.php?${params({ cliente_id })}`),
  fechar: (cliente_id: number, inicio: string, fim: string) => apiClient<Fechamento>('advisory/faturamento.php', { method: 'POST', body: JSON.stringify({ cliente_id, inicio, fim }) }),
  despesas: (cliente_id: number) => apiClient<Despesa[]>(`advisory/despesas.php?${params({ cliente_id })}`),
  registrarDespesa: (data: { cliente_id: number; tipo: string; data: string; descricao: string; valor: string; reembolsavel: boolean }) => apiClient<{ id: number }>('advisory/despesas.php', { method: 'POST', body: JSON.stringify(data) }),
};
