import { apiClient, params, sessionStore, ApiError } from './apiClient';
export interface Documento { id: number; descricao: string; valor: string; vencimento: string; status: 'pendente_aprovacao' | 'aprovado' }
export interface LinhaImportacao { codigo: string; descricao: string; tipo?: 'sintetica' | 'analitica'; codigo_pai?: string }
export type Destino = 'plano_contas' | 'centros_custo';
export interface CadastroNome { id: number; nome: string }
export interface CadastroCodigo { id: number; codigo: string; descricao: string }
export type TipoCadastro = 'fornecedores' | 'tipos_documento' | 'plano_contas' | 'centros_custo';
export const flowService = {
  documentos: (cliente_id: number, filtros: { inicio?: string; fim?: string; status?: string } = {}) => apiClient<Documento[]>(`flow/documentos.php?${params({ cliente_id, ...filtros })}`),
  fornecedores: (cliente_id: number) => apiClient<CadastroNome[]>(`flow/cadastros.php?${params({ tipo: 'fornecedores', cliente_id })}`),
  tiposDocumento: () => apiClient<CadastroNome[]>(`flow/cadastros.php?${params({ tipo: 'tipos_documento' })}`),
  planoContas: (cliente_id: number) => apiClient<CadastroCodigo[]>(`flow/cadastros.php?${params({ tipo: 'plano_contas', cliente_id })}`),
  centrosCusto: (cliente_id: number) => apiClient<CadastroCodigo[]>(`flow/cadastros.php?${params({ tipo: 'centros_custo', cliente_id })}`),
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
