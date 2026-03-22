/**
 * ColunaKanban Repository
 * 
 * Camada de acesso a dados para colunas do Kanban usando Prisma.
 */

const { prisma } = require('../database/client');

class ColunaKanbanRepository {
  async findAll() {
    return prisma.colunaKanban.findMany({
      orderBy: { ordem: 'asc' },
    });
  }

  async findById(id) {
    if (!id) return null;
    return prisma.colunaKanban.findUnique({ where: { id } });
  }

  async findByNome(nome) {
    if (!nome) return null;
    return prisma.colunaKanban.findUnique({ where: { nome } });
  }

  async create(data) {
    return prisma.colunaKanban.create({ data });
  }

  async update(id, data) {
    return prisma.colunaKanban.update({
      where: { id },
      data,
    });
  }

  async delete(id) {
    return prisma.colunaKanban.delete({ where: { id } });
  }

  async getMaxOrdem() {
    const result = await prisma.colunaKanban.findFirst({
      where: { fixa: false },
      orderBy: { ordem: 'desc' },
      select: { ordem: true },
    });
    return result?.ordem ?? 0;
  }

  async reorder(updates) {
    return prisma.$transaction(
      updates.map(({ id, ordem }) =>
        prisma.colunaKanban.update({ where: { id }, data: { ordem } })
      )
    );
  }

  async countDemandasByStatus(nome) {
    return prisma.demanda.count({ where: { status: nome } });
  }
}

module.exports = new ColunaKanbanRepository();
