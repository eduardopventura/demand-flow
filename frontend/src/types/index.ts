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

// =========================
// Cargos e Permissões (Fase 4)
// =========================

export type CargoPermissionKey =
  | "acesso_templates"
  | "acesso_acoes"
  | "acesso_usuarios"
  | "deletar_demandas"
  | "cargo_disponivel_como_responsavel"
  | "usuarios_disponiveis_como_responsaveis";

export interface Cargo {
  id: string;
  nome: string;

  // Permissões (podem ser omitidas em payloads "public")
  acesso_templates?: boolean;
  acesso_acoes?: boolean;
  acesso_usuarios?: boolean;
  deletar_demandas?: boolean;
  cargo_disponivel_como_responsavel?: boolean;
  usuarios_disponiveis_como_responsaveis?: boolean;

  // Metadados opcionais (dependendo do endpoint)
  created_at?: string;
  updated_at?: string;
  _count?: { usuarios: number };
}

// Interfaces
export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  telefone?: string; // Número com código país e região (ex: "5561999999999")
  login?: string;
  senha?: string; // Apenas para criação/edição no formulário
  notificar_email?: boolean; // Receber notificações por email
  notificar_telefone?: boolean; // Receber notificações por WhatsApp

  cargo_id?: string;
  cargo?: Cargo;
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
  responsavel_id?: string; // Responsável usuário específico da tarefa no template (opcional)
  cargo_responsavel_id?: string; // Responsável cargo específico da tarefa no template (opcional)
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
  responsavel_id?: string | null; // Responsável usuário específico da tarefa
  cargo_responsavel_id?: string | null; // Responsável cargo específico da tarefa
}

export type DemandaUpdatePayload = Partial<Demanda> & {
  // Merge por campo (evita sobrescrever alterações de outros usuários)
  campos_preenchidos_patch?: CampoPreenchido[];
  campos_preenchidos_remove?: string[];
  tarefas_status_patch?: TarefaStatus[];
};

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
  modificado_por_id?: string; // ID do usuário que modificou a demanda pela última vez
  modificado_por?: { id: string; nome: string; email: string }; // Dados do usuário que modificou
}

// Context types
export interface DataContextType {
  usuarios: Usuario[];
  cargos: Cargo[];
  templates: Template[];
  demandas: Demanda[];
  acoes: Acao[];
  refreshPublicData: () => Promise<void>;
  addUsuario: (usuario: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, usuario: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
  addTemplate: (template: Omit<Template, "id">) => void;
  updateTemplate: (id: string, template: Omit<Template, "id">) => void;
  deleteTemplate: (id: string) => void;
  addDemanda: (demanda: Omit<Demanda, "id">) => void;
  updateDemanda: (id: string, demanda: DemandaUpdatePayload) => void;
  deleteDemanda: (id: string) => void;
  addAcao: (acao: Omit<Acao, "id">) => void;
  updateAcao: (id: string, acao: Omit<Acao, "id">) => void;
  deleteAcao: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getUsuario: (id: string) => Usuario | undefined;
  getCargo: (id: string) => Cargo | undefined;
  getAcao: (id: string) => Acao | undefined;
  executarAcaoTarefa: (demandaId: string, tarefaId: string) => Promise<void>;
}

export * from "./socket-events";

