/**
 * Definição canônica da Ação de sistema "Realizar Cadastro Kumon".
 *
 * Compartilhada entre o seed (scripts/init-db.js) e o handler dedicado
 * (services/demanda.service.js) para manter os id_campo em sincronia. Só os
 * campos que o MOL NÃO extrai do PDF ficam aqui (o resto vem da IA no Kumon).
 */

const KUMON_CADASTRO_SLUG = 'kumon_cadastro';
const KUMON_CADASTRO_NOME = 'Realizar Cadastro Kumon';

// IDs estáveis dos campos da Ação (referenciados pelo handler ao montar o payload).
// `tipo_campo` reflete o TIPO NA API do Kumon (string=texto, number=numero/decimal,
// boolean=booleano, date=data). Campos com rótulos amigáveis (Fidelidade, Forma de
// Recorrência, Modalidade) são traduzidos para o valor canônico no handler.
const CAMPOS_KUMON = {
  ESCOLA: 'escola',
  NEEDS_ATTENTION: 'needs_attention',
  MATRICULA_VALOR: 'matricula_valor',
  MENSALIDADE_VALOR: 'mensalidade_valor',
  CONTRATO_DATA_INICIO: 'contrato_data_inicio',
  CONTRATO_DATA_KSIS: 'contrato_data_ksis',
  CONTRATO_TIPO: 'contrato_tipo',
  CONTRATO_TIPO_FIDELIDADE: 'contrato_tipo_fidelidade',
  CONTRATO_FORMA_RECORRENCIA: 'contrato_forma_recorrencia',
  FP_DATA: 'fp_data',
  FP_FORMA: 'fp_forma',
  FP_STATUS: 'fp_status',
  CEP: 'cep',
  DIA1: 'dia1',
  HORA1: 'hora1',
  MOD1: 'mod1',
  DIA2: 'dia2',
  HORA2: 'hora2',
  MOD2: 'mod2',
  ARQUIVO_MOL: 'arquivo_mol',
};

// Campos expostos pela Ação (ordem de exibição). As opções/rótulos de escolha ficam
// no campo da DEMANDA associado a cada um destes (não aqui).
const KUMON_CADASTRO_CAMPOS = [
  { id_campo: CAMPOS_KUMON.ESCOLA, nome_campo: 'Escola', tipo_campo: 'texto', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.NEEDS_ATTENTION, nome_campo: 'Precisa de Atenção', tipo_campo: 'booleano', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.MATRICULA_VALOR, nome_campo: 'Valor da Matrícula', tipo_campo: 'numero_decimal', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.MENSALIDADE_VALOR, nome_campo: 'Valor da Mensalidade', tipo_campo: 'numero_decimal', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.CONTRATO_DATA_INICIO, nome_campo: 'Data do Contrato', tipo_campo: 'data', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.CONTRATO_DATA_KSIS, nome_campo: 'Data KSIS', tipo_campo: 'data', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.CONTRATO_TIPO, nome_campo: 'Tipo do Contrato', tipo_campo: 'texto', obrigatorio: true },
  // Rótulo amigável (Tradicional / 6 Meses / 12 Meses) → o handler deriva fidelidade + mesesFidelidade.
  { id_campo: CAMPOS_KUMON.CONTRATO_TIPO_FIDELIDADE, nome_campo: 'Tipo de Fidelidade', tipo_campo: 'texto', obrigatorio: true },
  // Rótulo amigável (Boleto Bancário / Cartão Recorrente) → o handler traduz para boleto | cartao.
  { id_campo: CAMPOS_KUMON.CONTRATO_FORMA_RECORRENCIA, nome_campo: 'Forma de Recorrência', tipo_campo: 'texto', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.FP_DATA, nome_campo: 'Data 1º Pagamento', tipo_campo: 'data', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.FP_FORMA, nome_campo: 'Forma 1º Pagamento', tipo_campo: 'texto', obrigatorio: true },
  { id_campo: CAMPOS_KUMON.FP_STATUS, nome_campo: 'Status 1º Pagamento', tipo_campo: 'texto', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.CEP, nome_campo: 'CEP', tipo_campo: 'texto', obrigatorio: true },
  // dias_semana envia o número canônico (0-6) esperado pela API.
  { id_campo: CAMPOS_KUMON.DIA1, nome_campo: 'Dia 1 (aula)', tipo_campo: 'dias_semana', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.HORA1, nome_campo: 'Hora 1 (HH:MM)', tipo_campo: 'texto', obrigatorio: false },
  // Rótulo P / V → o handler traduz para in_person | virtual.
  { id_campo: CAMPOS_KUMON.MOD1, nome_campo: 'Modalidade 1', tipo_campo: 'texto', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.DIA2, nome_campo: 'Dia 2 (aula)', tipo_campo: 'dias_semana', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.HORA2, nome_campo: 'Hora 2 (HH:MM)', tipo_campo: 'texto', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.MOD2, nome_campo: 'Modalidade 2', tipo_campo: 'texto', obrigatorio: false },
  { id_campo: CAMPOS_KUMON.ARQUIVO_MOL, nome_campo: 'PDF do MOL', tipo_campo: 'arquivo', obrigatorio: true },
];

/** Integração Kumon habilitada por variável de ambiente (não por cargo/usuário). */
function isKumonIntegrationEnabled() {
  return String(process.env.SISTEMA_GESTAO_KUMON).toLowerCase() === 'true';
}

module.exports = {
  KUMON_CADASTRO_SLUG,
  KUMON_CADASTRO_NOME,
  KUMON_CADASTRO_CAMPOS,
  CAMPOS_KUMON,
  isKumonIntegrationEnabled,
};
