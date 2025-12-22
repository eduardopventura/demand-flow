/**
 * Prisma Client Singleton
 * 
 * Instância única do Prisma Client para uso em toda a aplicação
 */

const { PrismaClient } = require('@prisma/client');

// Singleton pattern para evitar múltiplas instâncias
let prisma = null;

/**
 * Retorna a instância do Prisma Client (singleton)
 * @returns {PrismaClient} - Instância do Prisma Client
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }

  return prisma;
}

module.exports = {
  getPrismaClient,
  prisma: getPrismaClient(), // Exporta instância direta também
};

