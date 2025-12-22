/**
 * Database Helpers
 * 
 * Funções auxiliares para acesso ao banco de dados PostgreSQL
 * Usa repositories para acesso aos dados
 */

const usuarioRepository = require('../src/repositories/usuario.repository');
const templateRepository = require('../src/repositories/template.repository');
const demandaRepository = require('../src/repositories/demanda.repository');
const acaoRepository = require('../src/repositories/acao.repository');
const cargoRepository = require('../src/repositories/cargo.repository');


/**
 * Busca um usuário pelo ID
 * @param {string} id - ID do usuário
 * @returns {Promise<Object|null>} - Usuário encontrado ou null
 */
async function getUsuarioById(id) {
  if (!id) return null;
  return await usuarioRepository.findById(id);
}

/**
 * Busca um template pelo ID
 * @param {string} id - ID do template
 * @returns {Promise<Object|null>} - Template encontrado ou null
 */
async function getTemplateById(id) {
  if (!id) return null;
  return await templateRepository.findById(id);
}

/**
 * Busca uma demanda pelo ID
 * @param {string} id - ID da demanda
 * @returns {Promise<Object|null>} - Demanda encontrada ou null
 */
async function getDemandaById(id) {
  if (!id) return null;
  return await demandaRepository.findById(id);
}

/**
 * Busca uma ação pelo ID
 * @param {string} id - ID da ação
 * @returns {Promise<Object|null>} - Ação encontrada ou null
 */
async function getAcaoById(id) {
  if (!id) return null;
  return await acaoRepository.findById(id);
}

/**
 * Busca o nome de uma tarefa pelo ID no template
 * @param {Object} template - Template contendo as tarefas
 * @param {string} tarefaId - ID da tarefa
 * @returns {string} - Nome da tarefa ou 'Tarefa' como fallback
 */
function getNomeTarefaById(template, tarefaId) {
  if (!template || !template.tarefas) return 'Tarefa';
  const tarefa = template.tarefas.find(t => t.id_tarefa === tarefaId);
  return tarefa ? tarefa.nome_tarefa : 'Tarefa';
}

/**
 * Retorna o responsável efetivo de uma tarefa
 * Se a tarefa tem responsavel_id próprio, usa esse
 * Senão, usa o responsável da demanda
 * @param {Object} tarefaStatus - Status da tarefa
 * @param {Object} demanda - Demanda
 * @returns {string|null} - ID do responsável efetivo
 */
function getResponsavelEfetivoDaTarefa(tarefaStatus, demanda) {
  // Fase 4: tarefa pode ter responsável usuário OU cargo; se não tiver, usa responsável da demanda (usuário)
  return tarefaStatus?.responsavel_id || tarefaStatus?.cargo_responsavel_id || demanda?.responsavel_id || null;
}

/**
 * Atualiza uma demanda no banco de dados
 * @param {string} id - ID da demanda
 * @param {Object} updates - Campos a atualizar
 * @param {Array} tarefasStatus - Array de tarefas_status (opcional)
 * @param {Array} camposPreenchidos - Array de campos_preenchidos (opcional)
 * @returns {Promise<Object>} - Demanda atualizada
 */
async function updateDemanda(id, updates, tarefasStatus = null, camposPreenchidos = null) {
  return await demandaRepository.update(id, updates, tarefasStatus, camposPreenchidos);
}

/**
 * Deleta uma demanda no banco de dados
 * @param {string} id - ID da demanda
 * @returns {Promise<Object>} - Demanda deletada
 */
async function deleteDemanda(id) {
  return await demandaRepository.delete(id);
}

/**
 * Cria uma nova demanda no banco de dados
 * @param {Object} demandaData - Dados da demanda
 * @param {Array} tarefasStatus - Array de tarefas_status
 * @param {Array} camposPreenchidos - Array de campos_preenchidos
 * @returns {Promise<Object>} - Demanda criada
 */
async function createDemanda(demandaData, tarefasStatus = [], camposPreenchidos = []) {
  return await demandaRepository.create(demandaData, tarefasStatus, camposPreenchidos);
}

/**
 * Busca um cargo pelo ID
 * @param {string} id
 */
async function getCargoById(id) {
  return await cargoRepository.findById(id);
}

/**
 * Busca usuários por cargo_id
 * @param {string} cargoId
 */
async function getUsuariosByCargoId(cargoId) {
  if (!cargoId) return [];
  return await usuarioRepository.findByCargoId(cargoId);
}

/**
 * Busca usuários notificáveis por cargo_id (com alguma notificação habilitada)
 * @param {string} cargoId
 */
async function getUsuariosNotificaveisByCargoId(cargoId) {
  if (!cargoId) return [];
  return await usuarioRepository.findNotificaveisByCargoId(cargoId);
}

/**
 * Resolve um responsável (usuário e/ou cargo) para lista de usuários a notificar.
 * @param {{ usuario_id?: string|null, cargo_id?: string|null }} params
 */
async function resolverResponsavelParaUsuarios(params) {
  const usuarioId = params?.usuario_id || null;
  const cargoId = params?.cargo_id || null;

  if (cargoId) {
    return await getUsuariosNotificaveisByCargoId(cargoId);
  }

  if (usuarioId) {
    const usuario = await getUsuarioById(usuarioId);
    return usuario ? [usuario] : [];
  }

  return [];
}

module.exports = {
  getUsuarioById,
  getCargoById,
  getTemplateById,
  getDemandaById,
  getAcaoById,
  getNomeTarefaById,
  getResponsavelEfetivoDaTarefa,
  updateDemanda,
  deleteDemanda,
  createDemanda,
  getUsuariosByCargoId,
  getUsuariosNotificaveisByCargoId,
  resolverResponsavelParaUsuarios
};

