/**
 * Acoes Routes
 * 
 * Rotas CRUD para ações
 */

const express = require('express');
const router = express.Router();
const acaoRepository = require('../src/repositories/acao.repository');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * GET /api/acoes
 * Lista todas as ações
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.nome) filters.nome = req.query.nome;
  if (req.query.q) filters.nome = req.query.q; // Busca por texto
  
  const acoes = await acaoRepository.findAll(filters);
  res.json(acoes);
}));

/**
 * GET /api/acoes/:id
 * Busca uma ação por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const acao = await acaoRepository.findById(id);
  
  if (!acao) {
    return res.status(404).json({
      error: 'Ação não encontrada',
      message: `Ação com ID ${id} não existe`
    });
  }
  
  res.json(acao);
}));

/**
 * POST /api/acoes
 * Cria uma nova ação
 */
router.post('/', asyncHandler(async (req, res) => {
  const acao = await acaoRepository.create(req.body);
  res.status(201).json(acao);
}));

/**
 * PATCH /api/acoes/:id
 * Atualiza uma ação
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const acao = await acaoRepository.update(id, req.body);
  res.json(acao);
}));

/**
 * PUT /api/acoes/:id
 * Substitui uma ação
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const acao = await acaoRepository.update(id, req.body);
  res.json(acao);
}));

/**
 * DELETE /api/acoes/:id
 * Deleta uma ação
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await acaoRepository.delete(id);
  res.status(204).send();
}));

module.exports = router;

