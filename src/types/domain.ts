export interface Cliente {
  id: number;
  razaoSocial: string;
  nomeFantasia: string;
  tipoCobranca: 'hora' | 'fechado' | 'misto';
  valorHora: number;
  valorMensalidade: number;
  permiteReembolsoDespesas: boolean;
}

export interface TarefaKanban {
  id: number;
  clienteId: number;
  titulo: string;
  status: 'backlog' | 'planejado' | 'execucao' | 'validacao' | 'concluido';
  horasEstimadas: number;
  horasRealizadas: number;
  prazo: string;
}
