// Enums for better type safety
export enum StatusDemanda {
  CRIADA = "Criada",
  EM_ANDAMENTO = "Em Andamento",
  FINALIZADA = "Finalizada",
}

export enum TipoCampo {
  TEXTO = "texto",
  NUMERO = "numero",
  NUMERO_DECIMAL = "numero_decimal",
  DATA = "data",
  ARQUIVO = "arquivo",
  DROPDOWN = "dropdown",
  GRUPO = "grupo",
}

// Cargos disponíveis no sistema
export enum Cargo {
  ADMINISTRADOR = "administrador",
  OPERADOR = "operador",
  TECNICO = "tecnico",
}

// Labels para exibição dos cargos
export const CargoLabels: Record<Cargo, string> = {
  [Cargo.ADMINISTRADOR]: "Administrador",
  [Cargo.OPERADOR]: "Operador",
  [Cargo.TECNICO]: "Técnico",
};

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string; // Número com código país e região (ex: "5561999999999")
  login: string;
  senha: string; // TODO: Will be improved with proper authentication
  notificar_email: boolean; // Receber notificações por email
  notificar_telefone: boolean; // Receber notificações por WhatsApp
  cargo?: Cargo; // Cargo do usuário (administrador, operador, tecnico)
}

export interface CondicaoVisibilidade {
  campo_id: string; // ID do campo do qual este depende
  operador: "igual" | "diferente" | "preenchido" | "vazio";
  valor?: string; // Valor para comparação (ex: "Sim", "Não")
}

export interface CampoPreenchimento {
  id_campo: string;
  nome_campo: string;
  tipo_campo: TipoCampo;
  opcoes_dropdown?: string[];
  obrigatorio_criacao: boolean;
  complementa_nome: boolean;
  abas_ids: string[]; // IDs das abas onde o campo aparece
  condicao_visibilidade?: CondicaoVisibilidade; // Condição para exibir o campo
  ordem_abas?: Record<string, number>; // Ordem do campo em cada aba (abaId -> ordem)
  // Campos para grupos
  campos?: CampoPreenchimento[]; // Campos filhos do grupo (apenas quando tipo_campo === "grupo")
  quantidade_replicas_padrao?: number; // Quantidade padrão de réplicas do grupo no template
}

export interface MapeamentoCampos {
  [campoAcaoId: string]: string; // campoAcaoId -> campoDemandaId
}

export interface Tarefa {
  id_tarefa: string;
  nome_tarefa: string;
  link_pai: string | null;
  responsavel_id?: string; // Responsável específico da tarefa no template (opcional)
  acao_id?: string; // ID da ação automática associada (opcional)
  mapeamento_campos?: MapeamentoCampos; // Mapeamento de campos da ação para campos da demanda
}

// Campos de uma ação (estrutura igual ao CampoPreenchimento simplificado)
export interface CampoAcao {
  id_campo: string;
  nome_campo: string;
  tipo_campo: TipoCampo;
  opcoes_dropdown?: string[];
  obrigatorio: boolean;
}

// Ação automática (webhook)
export interface Acao {
  id: string;
  nome: string;
  url: string; // URL do webhook (n8n, etc)
  campos: CampoAcao[];
}

export interface AbaTemplate {
  id: string;
  nome: string;
  ordem: number; // Para ordenação visual
}

export interface Template {
  id: string;
  nome: string;
  tempo_medio: number; // Tempo médio em dias para conclusão de demandas deste template
  abas: AbaTemplate[]; // Abas do template
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
  responsavel_id?: string; // Responsável específico da tarefa (se diferente do responsável da demanda)
}

export interface Demanda {
  id: string;
  template_id: string;
  nome_demanda: string;
  status: StatusDemanda;
  responsavel_id: string;
  tempo_esperado: number; // Tempo esperado em dias (derivado do template no momento da criação)
  campos_preenchidos: CampoPreenchido[];
  tarefas_status: TarefaStatus[];
  data_criacao: string; // ISO date string
  data_previsao: string; // ISO date string - data prevista para conclusão (editável)
  data_finalizacao: string | null; // ISO date string ou null se não finalizada
  prazo: boolean; // true se dentro do prazo, false se fora
  observacoes: string; // Campo fixo de observações (max 100 caracteres)
  notificacao_prazo_enviada?: boolean; // Controle para enviar notificação de prazo apenas uma vez
}

// Context types
export interface DataContextType {
  usuarios: Usuario[];
  templates: Template[];
  demandas: Demanda[];
  acoes: Acao[];
  addUsuario: (usuario: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, usuario: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
  addTemplate: (template: Omit<Template, "id">) => void;
  updateTemplate: (id: string, template: Omit<Template, "id">) => void;
  deleteTemplate: (id: string) => void;
  addDemanda: (demanda: Omit<Demanda, "id">) => void;
  updateDemanda: (id: string, demanda: Partial<Demanda>) => void;
  deleteDemanda: (id: string) => void;
  addAcao: (acao: Omit<Acao, "id">) => void;
  updateAcao: (id: string, acao: Omit<Acao, "id">) => void;
  deleteAcao: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getUsuario: (id: string) => Usuario | undefined;
  getAcao: (id: string) => Acao | undefined;
  executarAcaoTarefa: (demandaId: string, tarefaId: string) => Promise<void>;
}

