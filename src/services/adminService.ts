import { apiClient } from './apiClient';
import type { Cliente } from '../mock/mockData';

export type UsuarioAdmin = { id: number; cliente_id: number | null; nome: string; email: string; ativo: number | boolean; perfil: string };

type ClienteApi = { id: number; nome: string; tipo_cobranca: Cliente['tipoCobranca']; franquia_horas?: string; valor_hora_padrao?: string; valor_mensalidade_fixa?: string; permite_reembolso_despesas?: number | boolean };

function mapCliente(item: ClienteApi): Cliente { return { id: item.id, razaoSocial: item.nome, nomeFantasia: item.nome, tipoCobranca: item.tipo_cobranca, valorHora: Number(item.valor_hora_padrao || 0), valorMensalidade: Number(item.valor_mensalidade_fixa || 0), permiteReembolsoDespesas: Boolean(item.permite_reembolso_despesas) }; }

export const adminService = {
  async clientes(): Promise<Cliente[]> {
    const items = await apiClient<ClienteApi[]>('admin/clientes.php');
    return items.map(mapCliente);
  },
  async clientesOperacao(): Promise<Cliente[]> { const items = await apiClient<ClienteApi[]>('flow/clientes.php'); return items.map(mapCliente); },
  async clienteAtual(id: number): Promise<Cliente> { return mapCliente(await apiClient<ClienteApi>(`flow/cliente.php?cliente_id=${id}`)); },
  async usuarios(): Promise<UsuarioAdmin[]> { return apiClient<UsuarioAdmin[]>('admin/usuarios.php'); },
  async criarCliente(data: { nome: string; tipo_cobranca: string }): Promise<{ id: number }> { return apiClient<{ id: number }>('admin/clientes.php', { method: 'POST', body: JSON.stringify(data) }); },
  async atualizarCliente(id: number, data: { nome: string; tipo_cobranca: string }): Promise<void> { await apiClient('admin/clientes.php', { method: 'PATCH', body: JSON.stringify({ id, ...data }) }); },
  async atualizarUsuario(id: number, data: { perfil: string; ativo: boolean }): Promise<void> { await apiClient('admin/usuarios.php', { method: 'PATCH', body: JSON.stringify({ id, ...data }) }); },
  async criarUsuario(data: { nome: string; email: string; senha: string; perfil: string; cliente_id?: number }): Promise<{ id: number }> { return apiClient<{ id: number }>('admin/usuarios.php', { method: 'POST', body: JSON.stringify(data) }); },
};
