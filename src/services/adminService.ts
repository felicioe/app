import { apiClient } from './apiClient';
import type { Cliente } from '../mock/mockData';

type ClienteApi = { id: number; nome: string; tipo_cobranca: Cliente['tipoCobranca']; franquia_horas?: string; valor_hora_padrao?: string; valor_mensalidade_fixa?: string; permite_reembolso_despesas?: number | boolean };

export const adminService = {
  async clientes(): Promise<Cliente[]> {
    const items = await apiClient<ClienteApi[]>('admin/clientes.php');
    return items.map(item => ({ id: item.id, razaoSocial: item.nome, nomeFantasia: item.nome, tipoCobranca: item.tipo_cobranca, valorHora: Number(item.valor_hora_padrao || 0), valorMensalidade: Number(item.valor_mensalidade_fixa || 0), permiteReembolsoDespesas: Boolean(item.permite_reembolso_despesas) }));
  },
};
