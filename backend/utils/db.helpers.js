/**
 * Database Helpers
 * 
 * Funções auxiliares para acesso ao banco de dados JSON-Server
 */

/**
 * Gera um ID único
 * @returns {string} - ID único baseado em timestamp e random
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Busca um usuário pelo ID
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID do usuário
 * @returns {Object|null} - Usuário encontrado ou null
 */
function getUsuarioById(db, id) {
  if (!id) return null;
  const usuarios = db.get('usuarios').value();
  return usuarios.find(u => u.id === id || u.id == id) || null;
}

/**
 * Busca um template pelo ID
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID do template
 * @returns {Object|null} - Template encontrado ou null
 */
function getTemplateById(db, id) {
  if (!id) return null;
  const templates = db.get('templates').value();
  return templates.find(t => t.id == id || t.id === id) || null;
}

/**
 * Busca uma demanda pelo ID
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID da demanda
 * @returns {Object|null} - Demanda encontrada ou null
 */
function getDemandaById(db, id) {
  if (!id) return null;
  const demandas = db.get('demandas').value();
  return demandas.find(d => d.id == id || d.id === id) || null;
}

/**
 * Busca uma ação pelo ID
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID da ação
 * @returns {Object|null} - Ação encontrada ou null
 */
function getAcaoById(db, id) {
  if (!id) return null;
  const acoes = db.get('acoes').value();
  return acoes.find(a => a.id == id || a.id === id) || null;
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
  return tarefaStatus.responsavel_id || demanda.responsavel_id;
}

/**
 * Atualiza uma demanda no banco de dados
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID da demanda
 * @param {Object} updates - Campos a atualizar
 * @returns {Object} - Demanda atualizada
 */
function updateDemanda(db, id, updates) {
  const demanda = getDemandaById(db, id);
  if (!demanda) return null;
  
  const demandaAtualizada = { ...demanda, ...updates };
  db.get('demandas')
    .find(d => d.id == id || d.id === id)
    .assign(demandaAtualizada)
    .write();
  
  return demandaAtualizada;
}

/**
 * Cria uma nova demanda no banco de dados
 * @param {Object} db - Instância do lowdb
 * @param {Object} demanda - Dados da demanda
 * @returns {Object} - Demanda criada
 */
function createDemanda(db, demanda) {
  db.get('demandas').push(demanda).write();
  return demanda;
}

// Lista de cargos válidos
const CARGOS_VALIDOS = ['administrador', 'operador', 'tecnico'];

/**
 * Verifica se um ID é um cargo válido
 * @param {string} id - ID a verificar
 * @returns {boolean} - true se for um cargo válido
 */
function isCargo(id) {
  if (!id) return false;
  return CARGOS_VALIDOS.includes(id);
}

/**
 * Busca todos os usuários que têm um determinado cargo
 * @param {Object} db - Instância do lowdb
 * @param {string} cargoId - ID do cargo
 * @returns {Array} - Lista de usuários com o cargo
 */
function getUsuariosByCargo(db, cargoId) {
  if (!cargoId || !isCargo(cargoId)) return [];
  const usuarios = db.get('usuarios').value();
  return usuarios.filter(u => u.cargo === cargoId);
}

/**
 * Busca todos os usuários com um cargo que têm alguma notificação habilitada
 * @param {Object} db - Instância do lowdb
 * @param {string} cargoId - ID do cargo
 * @returns {Array} - Lista de usuários com notificação habilitada
 */
function getUsuariosNotificaveisByCargo(db, cargoId) {
  const usuarios = getUsuariosByCargo(db, cargoId);
  return usuarios.filter(u => u.notificar_email || u.notificar_telefone);
}

/**
 * Resolve um responsável_id para uma lista de usuários a notificar
 * Se for um usuário, retorna array com apenas esse usuário
 * Se for um cargo, retorna todos os usuários daquele cargo com notificação habilitada
 * @param {Object} db - Instância do lowdb
 * @param {string} responsavelId - ID do responsável (usuário ou cargo)
 * @returns {Array} - Lista de usuários a notificar
 */
function resolverResponsavelParaUsuarios(db, responsavelId) {
  if (!responsavelId) return [];
  
  // Se for um cargo, buscar todos os usuários com esse cargo
  if (isCargo(responsavelId)) {
    return getUsuariosNotificaveisByCargo(db, responsavelId);
  }
  
  // Senão, buscar o usuário pelo ID
  const usuario = getUsuarioById(db, responsavelId);
  return usuario ? [usuario] : [];
}

/**
 * Busca todos os cargos disponíveis
 * @param {Object} db - Instância do lowdb
 * @returns {Array} - Lista de cargos
 */
function getCargos(db) {
  return db.get('cargos').value() || [];
}

module.exports = {
  generateId,
  getUsuarioById,
  getTemplateById,
  getDemandaById,
  getAcaoById,
  getNomeTarefaById,
  getResponsavelEfetivoDaTarefa,
  updateDemanda,
  createDemanda,
  CARGOS_VALIDOS,
  isCargo,
  getUsuariosByCargo,
  getUsuariosNotificaveisByCargo,
  resolverResponsavelParaUsuarios,
  getCargos
};

