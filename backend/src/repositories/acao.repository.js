/**
 * Acao Repository
 * 
 * Camada de acesso a dados para Acoes usando Prisma
 */

const { prisma } = require('../database/client');

// Campos aceitos ao criar/atualizar uma Ação (evita mass-assignment de body cru).
// Ações de sistema (fixa/slug) são criadas apenas pelo seed, nunca pelas rotas.
const CAMPOS_PERMITIDOS = [
  'nome',
  'url',
  'campos',
];

/**
 * Filtra o body mantendo apenas os campos permitidos e presentes.
 * @param {Object} data - Body recebido
 * @returns {Object} - Objeto contendo somente as chaves da whitelist
 */
function filtrarCampos(data = {}) {
  const filtrado = {};
  for (const chave of CAMPOS_PERMITIDOS) {
    if (data[chave] !== undefined) {
      filtrado[chave] = data[chave];
    }
  }
  return filtrado;
}

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
      data: filtrarCampos(data)
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
      data: filtrarCampos(data)
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

