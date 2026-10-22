import { apiClient, params, sessionStore, ApiError } from './apiClient';
export interface Documento { id: number; descricao: string; valor: string; vencimento: string; status: 'pendente_aprovacao' | 'aprovado' }
export interface LinhaImportacao { codigo: string; descricao: string; tipo?: 'sintetica' | 'analitica'; codigo_pai?: string }
export type Destino = 'plano_contas' | 'centros_custo';
export const flowService = {
  documentos: (cliente_id: number, filtros: { inicio?: string; fim?: string; status?: string } = {}) => apiClient<Documento[]>(`flow/documentos.php?${params({ cliente_id, ...filtros })}`),
  criarDocumento: (data: FormData) => apiClient<{ id: number; status: string }>('flow/documentos.php', { method: 'POST', body: data }),
  aprovar: (cliente_id: number, documento_id: number) => apiClient<{ id: number; status: string }>('flow/alcadas.php', { method: 'POST', body: JSON.stringify({ cliente_id, documento_id }) }),
  importar: (cliente_id: number, destino: Destino, linhas: LinhaImportacao[]) => apiClient<{ inseridos: number }>('flow/importador_contas.php', { method: 'POST', body: JSON.stringify({ cliente_id, destino, linhas }) }),
  importarArquivo: (cliente_id: number, destino: Destino, arquivo: File, mapeamento: Record<string, string>) => {
    const data = new FormData(); data.set('cliente_id', String(cliente_id)); data.set('destino', destino); data.set('arquivo', arquivo); data.set('mapeamento', JSON.stringify(mapeamento));
    return apiClient<{ inseridos: number }>('flow/importador_contas.php', { method: 'POST', body: data });
  },
  notificacoes: () => apiClient<{ id: number; documento_id: number; mensagem: string; lida: boolean }[]>('flow/notificacoes.php'),
  marcarLida: (id: number) => apiClient('flow/notificacoes.php', { method: 'POST', body: JSON.stringify({ id }) }),
  async anexo(cliente_id: number, documento_id: number): Promise<Blob> {
    const response = await fetch(`/api/flow/anexo.php?${params({ cliente_id, documento_id })}`, { headers: { Authorization: `Bearer ${sessionStore.read()?.token || ''}` }, cache: 'no-store' });
    if (response.status === 401) sessionStore.clear();
    if (!response.ok) throw new ApiError(response.status, 'Falha ao baixar anexo.'); return response.blob();
  },
};
