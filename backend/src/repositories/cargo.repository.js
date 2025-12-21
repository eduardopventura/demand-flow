/**
 * Cargo Repository
 *
 * Camada de acesso a dados para Cargos usando Prisma
 */

const { prisma } = require('../database/client');

class CargoRepository {
  async findAll() {
    return prisma.cargo.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findAllWithUserCount() {
    return prisma.cargo.findMany({
      include: {
        _count: { select: { usuarios: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async findById(id) {
    if (!id) return null;
    return prisma.cargo.findUnique({ where: { id } });
  }

  async findByNome(nome) {
    if (!nome) return null;
    return prisma.cargo.findUnique({ where: { nome } });
  }
}

module.exports = new CargoRepository();


