import { z } from "zod";
import { TipoCampo, StatusDemanda } from "@/types";

/**
 * Validation schemas using Zod
 * Provides runtime type validation and error messages
 */

// Usuario schemas
export const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().optional(), // Número com código país e região (ex: "5561999999999")
  login: z.string().min(3, "Login deve ter no mínimo 3 caracteres"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  notificar_email: z.boolean().default(false), // Receber notificações por email
  notificar_telefone: z.boolean().default(false), // Receber notificações por WhatsApp
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

// Condição de visibilidade schema
export const condicaoVisibilidadeSchema = z.object({
  campo_id: z.string(),
  operador: z.enum(["igual", "diferente", "preenchido", "vazio"]),
  valor: z.string().optional(),
});

// Campo de preenchimento schema
export const campoPreenchimentoSchema = z.object({
  id_campo: z.string(),
  nome_campo: z.string().min(1, "Nome do campo é obrigatório"),
  tipo_campo: z.nativeEnum(TipoCampo),
  opcoes_dropdown: z.array(z.string()).optional(),
  obrigatorio_criacao: z.boolean(),
  complementa_nome: z.boolean(),
  abas_ids: z.array(z.string()).default(["geral"]), // IDs das abas onde o campo aparece
  condicao_visibilidade: condicaoVisibilidadeSchema.optional(), // Condição para exibir o campo
}).refine(
  (data) => {
    // If tipo is dropdown, opcoes_dropdown must have at least one option
    if (data.tipo_campo === TipoCampo.DROPDOWN) {
      return data.opcoes_dropdown && data.opcoes_dropdown.length > 0;
    }
    return true;
  },
  {
    message: "Campos dropdown devem ter pelo menos uma opção",
    path: ["opcoes_dropdown"],
  }
);

// Tarefa schema
export const tarefaSchema = z.object({
  id_tarefa: z.string(),
  nome_tarefa: z.string().min(1, "Nome da tarefa é obrigatório"),
  link_pai: z.string().nullable(),
  responsavel_id: z.string().optional(), // Responsável específico da tarefa no template
});

// Aba template schema
export const abaTemplateSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, "Nome da aba é obrigatório"),
  ordem: z.number().int().min(0),
});

// Template schema
export const templateSchema = z.object({
  nome: z.string().min(3, "Nome do template deve ter no mínimo 3 caracteres"),
  tempo_medio: z.number().min(1, "Tempo médio deve ser no mínimo 1 dia"),
  abas: z.array(abaTemplateSchema).default([{ id: "geral", nome: "Geral", ordem: 0 }]),
  campos_preenchimento: z.array(campoPreenchimentoSchema),
  tarefas: z.array(tarefaSchema),
});

export type TemplateFormData = z.infer<typeof templateSchema>;

// Campo preenchido schema
export const campoPreenchidoSchema = z.object({
  id_campo: z.string(),
  valor: z.string(),
});

// Tarefa status schema
export const tarefaStatusSchema = z.object({
  id_tarefa: z.string(),
  concluida: z.boolean(),
  responsavel_id: z.string().optional(), // Responsável específico da tarefa (se diferente do padrão)
});

// Demanda schema
export const demandaSchema = z.object({
  template_id: z.string().min(1, "Template é obrigatório"),
  nome_demanda: z.string().min(3, "Nome da demanda deve ter no mínimo 3 caracteres"),
  status: z.nativeEnum(StatusDemanda),
  responsavel_id: z.string().min(1, "Responsável é obrigatório"),
  tempo_esperado: z.number().min(1, "Tempo esperado deve ser no mínimo 1 dia"),
  campos_preenchidos: z.array(campoPreenchidoSchema),
  tarefas_status: z.array(tarefaStatusSchema),
  data_criacao: z.string(),
  data_previsao: z.string(), // Data prevista para conclusão (editável)
  data_finalizacao: z.string().nullable(),
  prazo: z.boolean(),
  observacoes: z.string().max(250, "Observações deve ter no máximo 250 caracteres"),
  notificacao_prazo_enviada: z.boolean().optional(), // Controle para enviar notificação de prazo apenas uma vez
});

export type DemandaFormData = z.infer<typeof demandaSchema>;

/**
 * Validate required fields for demanda creation
 */
export const validateDemandaFields = (
  campos: Array<{ id_campo: string; obrigatorio_criacao: boolean; nome_campo: string }>,
  valores: Record<string, string>
): { valid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];

  campos.forEach((campo) => {
    if (campo.obrigatorio_criacao && !valores[campo.id_campo]?.trim()) {
      missingFields.push(campo.nome_campo);
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};
