/**
 * Auth Service - Autenticação e JWT
 * 
 * Serviço para hash de senhas, comparação e geração/validação de tokens JWT
 * 
 * Variáveis de ambiente necessárias:
 * - JWT_SECRET: Chave secreta para assinatura de tokens (obrigatório em produção)
 * - JWT_EXPIRES_IN: Tempo de expiração do token (padrão: 24h)
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash de senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} - Hash da senha
 */
async function hashPassword(password) {
  if (!password) {
    throw new Error('Senha não fornecida');
  }
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compara senha em texto plano com hash
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash da senha armazenado
 * @returns {Promise<boolean>} - true se senha corresponde ao hash
 */
async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

/**
 * Gera token JWT para usuário
 * @param {Object} usuario - Objeto com dados do usuário
 * @param {string} usuario.id - ID do usuário
 * @param {string} usuario.email - Email do usuário
 * @param {string} usuario.login - Login do usuário
 * @returns {string} - Token JWT
 */
function generateToken(usuario) {
  if (!usuario || !usuario.id) {
    throw new Error('Dados do usuário inválidos para gerar token');
  }

  const payload = {
    id: usuario.id,
    email: usuario.email,
    login: usuario.login
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Valida e decodifica token JWT
 * @param {string} token - Token JWT
 * @returns {Object} - Payload decodificado do token
 * @throws {Object} - Erro com status 401 se token inválido ou expirado
 */
function verifyToken(token) {
  if (!token) {
    throw { status: 401, message: 'Token não fornecido' };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw { status: 401, message: 'Token expirado' };
    } else if (error.name === 'JsonWebTokenError') {
      throw { status: 401, message: 'Token inválido' };
    } else {
      throw { status: 401, message: 'Erro ao validar token' };
    }
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};

