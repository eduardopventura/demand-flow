/**
 * Senha Helper
 * 
 * Funções auxiliares para conversão entre senha e senha_hash
 * Mantém compatibilidade entre frontend (senha) e backend (senha_hash)
 */

const { hashPassword } = require('../services/auth.service');

/**
 * Converte dados de usuário do formato frontend (senha) para backend (senha_hash)
 * Faz hash da senha se fornecida
 * @param {Object} usuarioData - Dados do usuário do frontend
 * @returns {Promise<Object>} - Dados do usuário para o backend
 */
async function frontendToBackend(usuarioData) {
  const data = { ...usuarioData };
  if (data.senha) {
    // Fazer hash da senha antes de salvar
    data.senha_hash = await hashPassword(data.senha);
    delete data.senha;
  }
  return data;
}

/**
 * Converte dados de usuário do formato backend (senha_hash) para frontend (senha)
 * @param {Object} usuario - Dados do usuário do backend
 * @returns {Object} - Dados do usuário para o frontend
 */
function backendToFrontend(usuario) {
  if (!usuario) return null;
  
  const response = { ...usuario };
  if (response.senha_hash) {
    response.senha = response.senha_hash;
    delete response.senha_hash;
  }
  return response;
}

/**
 * Converte array de usuários do formato backend para frontend
 * @param {Array} usuarios - Array de usuários do backend
 * @returns {Array} - Array de usuários para o frontend
 */
function backendToFrontendArray(usuarios) {
  return usuarios.map(backendToFrontend);
}

module.exports = {
  frontendToBackend,
  backendToFrontend,
  backendToFrontendArray
};

