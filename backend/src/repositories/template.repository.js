/**
 * Template Repository
 * 
 * Camada de acesso a dados para Templates usando Prisma
 */

const { prisma } = require('../database/client');

class TemplateRepository {
  /**
   * Busca um template pelo ID
   * @param {string} id - ID do template
   * @returns {Promise<Object|null>} - Template encontrado ou null
   */
  async findById(id) {
    if (!id) return null;
    return await prisma.template.findUnique({
      where: { id }
    });
  }

  /**
   * Lista todos os templates
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} - Lista de templates
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.nome) {
      where.nome = {
        contains: filters.nome,
        mode: 'insensitive'
      };
    }

    return await prisma.template.findMany({
      where,
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * Cria um novo template
   * @param {Object} data - Dados do template
   * @returns {Promise<Object>} - Template criado
   */
  async create(data) {
    return await prisma.template.create({
      data
    });
  }

  /**
   * Atualiza um template
   * @param {string} id - ID do template
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} - Template atualizado
   */
  async update(id, data) {
    return await prisma.template.update({
      where: { id },
      data
    });
  }

  /**
   * Deleta um template
   * @param {string} id - ID do template
   * @returns {Promise<Object>} - Template deletado
   */
  async delete(id) {
    return await prisma.template.delete({
      where: { id }
    });
  }
}

module.exports = new TemplateRepository();

