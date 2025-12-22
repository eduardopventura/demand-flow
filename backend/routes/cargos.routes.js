/**
 * Cargos Routes
 *
 * Gestão de cargos (requer acesso_usuarios via middleware no routes/index.js)
 *
 * Implementa "Salvar em lote" (transacional):
 * - cria/renomeia/atualiza permissões
 * - exclui cargos (com reassignment obrigatório quando houver usuários)
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../src/database/client');
const cargoRepository = require('../src/repositories/cargo.repository');
const { asyncHandler, badRequest } = require('../middlewares/error.middleware');

/**
 * GET /api/cargos
 * Lista cargos (com contagem de usuários)
 */
router.get('/', asyncHandler(async (_req, res) => {
  const cargos = await cargoRepository.findAllWithUserCount();
  res.json(cargos);
}));

/**
 * PUT /api/cargos/batch
 * Aplica alterações staged em lote (transação)
 *
 * Body:
 * {
 *   creates?: Array<{ nome: string, ...flags }>
 *   updates?: Array<{ id: string, nome?: string, ...flags }>
 *   deletes?: Array<{ id: string, reassignToCargoId?: string }>
 * }
 */
router.put('/batch', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const creates = Array.isArray(body.creates) ? body.creates : [];
  const updates = Array.isArray(body.updates) ? body.updates : [];
  const deletes = Array.isArray(body.deletes) ? body.deletes : [];

  const result = await prisma.$transaction(async (tx) => {
    const created = [];
    const updated = [];
    const deleted = [];

    for (const c of creates) {
      if (!c?.nome || String(c.nome).trim().length === 0) {
        throw badRequest('Nome do cargo é obrigatório para criar');
      }

      const createdCargo = await tx.cargo.create({
        data: {
          nome: String(c.nome).trim(),
          acesso_templates: !!c.acesso_templates,
          acesso_acoes: !!c.acesso_acoes,
          acesso_usuarios: !!c.acesso_usuarios,
          deletar_demandas: !!c.deletar_demandas,
          cargo_disponivel_como_responsavel: !!c.cargo_disponivel_como_responsavel,
          usuarios_disponiveis_como_responsaveis: !!c.usuarios_disponiveis_como_responsaveis,
        },
      });
      created.push(createdCargo);
    }

    for (const u of updates) {
      if (!u?.id) {
        throw badRequest('ID do cargo é obrigatório para atualizar');
      }

      const data = {};
      if (u.nome !== undefined) data.nome = String(u.nome).trim();
      if (u.acesso_templates !== undefined) data.acesso_templates = !!u.acesso_templates;
      if (u.acesso_acoes !== undefined) data.acesso_acoes = !!u.acesso_acoes;
      if (u.acesso_usuarios !== undefined) data.acesso_usuarios = !!u.acesso_usuarios;
      if (u.deletar_demandas !== undefined) data.deletar_demandas = !!u.deletar_demandas;
      if (u.cargo_disponivel_como_responsavel !== undefined)
        data.cargo_disponivel_como_responsavel = !!u.cargo_disponivel_como_responsavel;
      if (u.usuarios_disponiveis_como_responsaveis !== undefined)
        data.usuarios_disponiveis_como_responsaveis = !!u.usuarios_disponiveis_como_responsaveis;

      const updatedCargo = await tx.cargo.update({
        where: { id: u.id },
        data,
      });
      updated.push(updatedCargo);
    }

    for (const d of deletes) {
      if (!d?.id) {
        throw badRequest('ID do cargo é obrigatório para excluir');
      }

      const countUsuarios = await tx.usuario.count({
        where: { cargo_id: d.id },
      });

      if (countUsuarios > 0) {
        const destino = d.reassignToCargoId;
        if (!destino || destino === d.id) {
          throw badRequest('Excluir cargo com usuários exige selecionar um cargo destino válido');
        }

        // Reassign users
        await tx.usuario.updateMany({
          where: { cargo_id: d.id },
          data: { cargo_id: destino },
        });
      }

      // Se houver tarefas apontando para esse cargo, o FK está como SET NULL (migração),
      // então não precisamos tratar explicitamente.
      await tx.cargo.delete({ where: { id: d.id } });
      deleted.push({ id: d.id });
    }

    return { created, updated, deleted };
  });

  res.json({ success: true, ...result });
}));

module.exports = router;


