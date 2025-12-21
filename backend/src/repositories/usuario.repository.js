/**
 * Usuario Repository
 * 
 * Camada de acesso a dados para Usuarios usando Prisma
 */

const { prisma } = require('../database/client');

class UsuarioRepository {
  /**
   * Busca um usuário pelo ID
   * @param {string} id - ID do usuário
   * @returns {Promise<Object|null>} - Usuário encontrado ou null
   */
  async findById(id) {
    if (!id) return null;
    return await prisma.usuario.findUnique({
      where: { id },
      include: { cargo: true }
    });
  }

  /**
   * Busca um usuário pelo login (case-insensitive)
   * @param {string} login - Login do usuário
   * @returns {Promise<Object|null>} - Usuário encontrado ou null
   */
  async findByLogin(login) {
    if (!login) return null;
    
    return await prisma.usuario.findUnique({
      where: { login },
      include: { cargo: true }
    });
  }

  /**
   * Busca um usuário pelo email
   * @param {string} email - Email do usuário
   * @returns {Promise<Object|null>} - Usuário encontrado ou null
   */
  async findByEmail(email) {
    if (!email) return null;
    return await prisma.usuario.findUnique({
      where: { email },
      include: { cargo: true }
    });
  }

  /**
   * Lista todos os usuários
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} - Lista de usuários
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.cargo_id) {
      where.cargo_id = filters.cargo_id;
    }
    
    if (filters.notificar_email !== undefined) {
      where.notificar_email = filters.notificar_email;
    }
    
    if (filters.notificar_telefone !== undefined) {
      where.notificar_telefone = filters.notificar_telefone;
    }

    return await prisma.usuario.findMany({
      where,
      include: { cargo: true },
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * Busca usuários por cargo
   * @param {string} cargo - Cargo a buscar
   * @returns {Promise<Array>} - Lista de usuários com o cargo
   */
  async findByCargoId(cargoId) {
    if (!cargoId) return [];
    return await prisma.usuario.findMany({
      where: { cargo_id: cargoId },
      include: { cargo: true },
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * Busca usuários notificáveis por cargo (com notificação habilitada)
   * @param {string} cargo - Cargo a buscar
   * @returns {Promise<Array>} - Lista de usuários com notificação habilitada
   */
  async findNotificaveisByCargoId(cargoId) {
    if (!cargoId) return [];
    return await prisma.usuario.findMany({
      where: {
        cargo_id: cargoId,
        OR: [{ notificar_email: true }, { notificar_telefone: true }],
      },
      include: { cargo: true },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Cria um novo usuário
   * @param {Object} data - Dados do usuário
   * @returns {Promise<Object>} - Usuário criado
   */
  async create(data) {
    return await prisma.usuario.create({
      data,
      include: { cargo: true }
    });
  }

  /**
   * Atualiza um usuário
   * @param {string} id - ID do usuário
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} - Usuário atualizado
   */
  async update(id, data) {
    return await prisma.usuario.update({
      where: { id },
      data,
      include: { cargo: true }
    });
  }

  /**
   * Deleta um usuário
   * @param {string} id - ID do usuário
   * @returns {Promise<Object>} - Usuário deletado
   */
  async delete(id) {
    return await prisma.usuario.delete({
      where: { id }
    });
  }
}

module.exports = new UsuarioRepository();

