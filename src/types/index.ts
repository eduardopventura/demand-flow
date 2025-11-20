// Enums for better type safety
export enum StatusDemanda {
  CRIADA = "Criada",
  EM_ANDAMENTO = "Em Andamento",
  FINALIZADA = "Finalizada",
}

export enum Prioridade {
  BAIXA = "Baixa",
  MEDIA = "Média",
  ALTA = "Alta",
}

export enum TipoCampo {
  TEXTO = "texto",
  NUMERO = "numero",
  DATA = "data",
  ARQUIVO = "arquivo",
  DROPDOWN = "dropdown",
}

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  senha: string; // TODO: Will be improved with proper authentication
}

export interface CampoPreenchimento {
  id_campo: string;
  nome_campo: string;
  tipo_campo: TipoCampo;
  opcoes_dropdown?: string[];
  obrigatorio_criacao: boolean;
  complementa_nome: boolean;
}

export interface Tarefa {
  id_tarefa: string;
  nome_tarefa: string;
  link_pai: string | null;
}

export interface Template {
  id: string;
  nome: string;
  prioridade: Prioridade;
  campos_preenchimento: CampoPreenchimento[];
  tarefas: Tarefa[];
}

export interface CampoPreenchido {
  id_campo: string;
  valor: string;
}

export interface TarefaStatus {
  id_tarefa: string;
  concluida: boolean;
}

export interface Demanda {
  id: string;
  template_id: string;
  nome_demanda: string;
  status: StatusDemanda;
  prioridade: Prioridade;
  responsavel_id: string;
  campos_preenchidos: CampoPreenchido[];
  tarefas_status: TarefaStatus[];
}

// Context types
export interface DataContextType {
  usuarios: Usuario[];
  templates: Template[];
  demandas: Demanda[];
  addUsuario: (usuario: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, usuario: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
  addTemplate: (template: Omit<Template, "id">) => void;
  updateTemplate: (id: string, template: Omit<Template, "id">) => void;
  deleteTemplate: (id: string) => void;
  addDemanda: (demanda: Omit<Demanda, "id">) => void;
  updateDemanda: (id: string, demanda: Partial<Demanda>) => void;
  deleteDemanda: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getUsuario: (id: string) => Usuario | undefined;
}

