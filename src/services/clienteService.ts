import { apiClient } from './apiClient';
import type { Cliente } from '../mock/mockData';

export const clienteService = {
  listar: () => apiClient<Cliente[]>('clientes.php'),
};
