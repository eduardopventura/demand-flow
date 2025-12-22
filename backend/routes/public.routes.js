/**
 * Public (auth-only) Routes
 *
 * Objetivo:
 * - Expor dados básicos necessários para a UI funcionar para todos usuários autenticados
 * - Sem permitir operações de gestão (essas ficam em /api/usuarios e /api/cargos com acesso_usuarios)
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../src/database/client');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * GET /api/public/usuarios
 * Lista usuários (dados básicos) para uso em selects, relatórios, etc.
 */
router.get('/usuarios', asyncHandler(async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      login: true,
      notificar_email: true,
      notificar_telefone: true,
      cargo_id: true,
      cargo: {
        select: {
          id: true,
          nome: true,
          cargo_disponivel_como_responsavel: true,
          usuarios_disponiveis_como_responsaveis: true,
        },
      },
    },
    orderBy: { nome: 'asc' },
  });

  res.json(usuarios);
}));

/**
 * GET /api/public/cargos
 * Lista cargos (dados básicos) para uso em selects.
 */
router.get('/cargos', asyncHandler(async (_req, res) => {
  const cargos = await prisma.cargo.findMany({
    select: {
      id: true,
      nome: true,
      cargo_disponivel_como_responsavel: true,
      usuarios_disponiveis_como_responsaveis: true,
    },
    orderBy: { nome: 'asc' },
  });

  res.json(cargos);
}));

module.exports = router;


