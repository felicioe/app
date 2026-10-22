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

export const CLIENTES_MOCK: Cliente[] = [
  {
    id: 1,
    razaoSocial: "Alpha Indústria de Alimentos Ltda",
    nomeFantasia: "Alpha Alimentos",
    tipoCobranca: "hora",
    valorHora: 220.00,
    valorMensalidade: 0,
    permiteReembolsoDespesas: true
  },
  {
    id: 2,
    razaoSocial: "Beta Tecnologia e Serviços S/A",
    nomeFantasia: "Beta Tech",
    tipoCobranca: "fechado",
    valorHora: 0,
    valorMensalidade: 4500.00,
    permiteReembolsoDespesas: false
  }
];

export const TAREFAS_KANBAN_MOCK: TarefaKanban[] = [
  { id: 101, clienteId: 1, titulo: "Diagnóstico de Processos Fiscais", status: "backlog", horasEstimadas: 15, horasRealizadas: 0, prazo: "2026-11-10" },
  { id: 102, clienteId: 1, titulo: "Mapeamento da DRE Gerencial", status: "execucao", horasEstimadas: 20, horasRealizadas: 8.5, prazo: "2026-10-30" },
  { id: 103, clienteId: 1, titulo: "Apresentação para Diretoria", status: "validacao", horasEstimadas: 4, horasRealizadas: 4, prazo: "2026-10-25" },
  { id: 104, clienteId: 2, titulo: "Parametrização Orçamentária 2027", status: "planejado", horasEstimadas: 30, horasRealizadas: 0, prazo: "2026-11-30" }
];
