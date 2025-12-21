/**
 * Acao Repository
 * 
 * Camada de acesso a dados para Acoes usando Prisma
 */

const { prisma } = require('../database/client');

class AcaoRepository {
  /**
   * Busca uma ação pelo ID
   * @param {string} id - ID da ação
   * @returns {Promise<Object|null>} - Ação encontrada ou null
   */
  async findById(id) {
    if (!id) return null;
    return await prisma.acao.findUnique({
      where: { id }
    });
  }

  /**
   * Lista todas as ações
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} - Lista de ações
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.nome) {
      where.nome = {
        contains: filters.nome,
        mode: 'insensitive'
      };
    }

    return await prisma.acao.findMany({
      where,
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * Cria uma nova ação
   * @param {Object} data - Dados da ação
   * @returns {Promise<Object>} - Ação criada
   */
  async create(data) {
    return await prisma.acao.create({
      data
    });
  }

  /**
   * Atualiza uma ação
   * @param {string} id - ID da ação
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} - Ação atualizada
   */
  async update(id, data) {
    return await prisma.acao.update({
      where: { id },
      data
    });
  }

  /**
   * Deleta uma ação
   * @param {string} id - ID da ação
   * @returns {Promise<Object>} - Ação deletada
   */
  async delete(id) {
    return await prisma.acao.delete({
      where: { id }
    });
  }
}

module.exports = new AcaoRepository();

