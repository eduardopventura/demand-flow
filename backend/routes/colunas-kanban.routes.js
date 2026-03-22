/**
 * Colunas Kanban Routes
 * 
 * CRUD para colunas do quadro Kanban.
 * GET é público (auth-only), demais requerem gerenciar_kanban.
 */

const express = require('express');
const router = express.Router();
const colunaKanbanRepository = require('../src/repositories/coluna-kanban.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { requireCargoPermission } = require('../middlewares/permissions.middleware');

/**
 * GET /api/colunas-kanban
 */
router.get('/', asyncHandler(async (_req, res) => {
  const colunas = await colunaKanbanRepository.findAll();
  res.json(colunas);
}));

/**
 * POST /api/colunas-kanban
 */
router.post('/', requireCargoPermission('gerenciar_kanban'), asyncHandler(async (req, res) => {
  const { nome, cor } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório' });
  }

  const existing = await colunaKanbanRepository.findByNome(nome.trim());
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma coluna com esse nome' });
  }

  const maxOrdem = await colunaKanbanRepository.getMaxOrdem();
  const coluna = await colunaKanbanRepository.create({
    nome: nome.trim(),
    ordem: maxOrdem + 1,
    fixa: false,
    cor: cor || null,
  });

  res.status(201).json(coluna);
}));

/**
 * PATCH /api/colunas-kanban/:id
 */
router.patch('/:id', requireCargoPermission('gerenciar_kanban'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coluna = await colunaKanbanRepository.findById(id);

  if (!coluna) {
    return res.status(404).json({ error: 'Coluna não encontrada' });
  }

  if (coluna.fixa) {
    return res.status(403).json({ error: 'Não é possível editar colunas fixas' });
  }

  const { nome, cor } = req.body;
  const updateData = {};

  if (nome !== undefined) {
    if (!nome.trim()) {
      return res.status(400).json({ error: 'Nome não pode ser vazio' });
    }
    const existing = await colunaKanbanRepository.findByNome(nome.trim());
    if (existing && existing.id !== id) {
      return res.status(409).json({ error: 'Já existe uma coluna com esse nome' });
    }

    const oldNome = coluna.nome;
    updateData.nome = nome.trim();

    // Rename status on all demands with the old column name
    if (oldNome !== updateData.nome) {
      const { prisma } = require('../src/database/client');
      await prisma.demanda.updateMany({
        where: { status: oldNome },
        data: { status: updateData.nome },
      });
    }
  }

  if (cor !== undefined) {
    updateData.cor = cor || null;
  }

  const updated = await colunaKanbanRepository.update(id, updateData);
  res.json(updated);
}));

/**
 * DELETE /api/colunas-kanban/:id
 */
router.delete('/:id', requireCargoPermission('gerenciar_kanban'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coluna = await colunaKanbanRepository.findById(id);

  if (!coluna) {
    return res.status(404).json({ error: 'Coluna não encontrada' });
  }

  if (coluna.fixa) {
    return res.status(403).json({ error: 'Não é possível excluir colunas fixas' });
  }

  const count = await colunaKanbanRepository.countDemandasByStatus(coluna.nome);
  if (count > 0) {
    return res.status(409).json({
      error: `Existem ${count} demanda(s) nesta coluna. Mova-as antes de excluir.`,
    });
  }

  await colunaKanbanRepository.delete(id);
  res.status(204).send();
}));

/**
 * PUT /api/colunas-kanban/reorder
 */
router.put('/reorder', requireCargoPermission('gerenciar_kanban'), asyncHandler(async (req, res) => {
  const { ordens } = req.body;

  if (!Array.isArray(ordens) || ordens.length === 0) {
    return res.status(400).json({ error: 'Array de ordens é obrigatório' });
  }

  const allColunas = await colunaKanbanRepository.findAll();
  const fixas = allColunas.filter(c => c.fixa);

  // Validate: fixed columns must keep their original ordem
  for (const fixa of fixas) {
    const entry = ordens.find(o => o.id === fixa.id);
    if (entry && entry.ordem !== fixa.ordem) {
      return res.status(400).json({ error: `Coluna fixa "${fixa.nome}" não pode mudar de posição` });
    }
  }

  await colunaKanbanRepository.reorder(ordens);
  const updated = await colunaKanbanRepository.findAll();
  res.json(updated);
}));

module.exports = router;
