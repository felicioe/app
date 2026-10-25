import { apiClient, params } from './apiClient';

export interface ClienteCompleto {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string | null;
  emailContato: string | null;
  telefone: string | null;
  tipoCobranca: 'hora' | 'fechado' | 'misto';
  valorHora: number;
  valorMensalidade: number;
  franquiaHoras: number;
  permiteReembolsoDespesas: boolean;
  ativo: boolean;
}

export interface ClienteForm {
  razaoSocial: string;
  nomeFantasia: string;
  cnpjCpf: string;
  emailContato: string;
  telefone: string;
  tipoCobranca: 'hora' | 'fechado' | 'misto';
  valorHora: string;
  valorMensalidade: string;
  franquiaHoras: string;
  permiteReembolsoDespesas: boolean;
  ativo: boolean;
}

export interface Fornecedor { id: number; razao_social: string; cnpj_cpf: string | null; dados_bancarios: string | null; chave_pix: string | null }
export interface TipoDocumentoCadastro { id: number; nome: string }

export const cadastrosService = {
  clientes: {
    listar: (todos = false) => apiClient<ClienteCompleto[]>(`clientes.php?${params({ todos: todos ? 1 : undefined })}`),
    criar: (data: ClienteForm) => apiClient<{ id: number }>('clientes.php', { method: 'POST', body: JSON.stringify(data) }),
    editar: (id: number, data: ClienteForm) => apiClient<{ id: number }>('clientes.php', { method: 'PATCH', body: JSON.stringify({ id, ...data }) }),
  },
  fornecedores: {
    listar: (cliente_id: number) => apiClient<Fornecedor[]>(`flow/fornecedores.php?${params({ cliente_id })}`),
    criar: (cliente_id: number, data: Omit<Fornecedor, 'id'>) => apiClient<{ id: number }>('flow/fornecedores.php', { method: 'POST', body: JSON.stringify({ cliente_id, ...data }) }),
    editar: (id: number, cliente_id: number, data: Omit<Fornecedor, 'id'>) => apiClient<{ id: number }>('flow/fornecedores.php', { method: 'PATCH', body: JSON.stringify({ id, cliente_id, ...data }) }),
    excluir: (id: number, cliente_id: number) => apiClient<{ excluido: boolean }>(`flow/fornecedores.php?${params({ id, cliente_id })}`, { method: 'DELETE' }),
  },
  tiposDocumento: {
    listar: (cliente_id: number) => apiClient<TipoDocumentoCadastro[]>(`flow/tipos_documento.php?${params({ cliente_id })}`),
    criar: (cliente_id: number, nome: string) => apiClient<{ id: number }>('flow/tipos_documento.php', { method: 'POST', body: JSON.stringify({ cliente_id, nome }) }),
    editar: (id: number, cliente_id: number, nome: string) => apiClient<{ id: number }>('flow/tipos_documento.php', { method: 'PATCH', body: JSON.stringify({ id, cliente_id, nome }) }),
    excluir: (id: number, cliente_id: number) => apiClient<{ excluido: boolean }>(`flow/tipos_documento.php?${params({ id, cliente_id })}`, { method: 'DELETE' }),
  },
};
