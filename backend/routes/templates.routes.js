/**
 * Templates Routes
 * 
 * Rotas CRUD para templates
 */

const express = require('express');
const router = express.Router();
const templateRepository = require('../src/repositories/template.repository');
const { asyncHandler } = require('../middlewares/error.middleware');

/**
 * GET /api/templates
 * Lista todos os templates
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.nome) filters.nome = req.query.nome;
  if (req.query.q) filters.nome = req.query.q; // Busca por texto
  
  const templates = await templateRepository.findAll(filters);
  res.json(templates);
}));

/**
 * GET /api/templates/:id
 * Busca um template por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await templateRepository.findById(id);
  
  if (!template) {
    return res.status(404).json({
      error: 'Template não encontrado',
      message: `Template com ID ${id} não existe`
    });
  }
  
  res.json(template);
}));

/**
 * POST /api/templates
 * Cria um novo template
 */
router.post('/', asyncHandler(async (req, res) => {
  const template = await templateRepository.create(req.body);
  res.status(201).json(template);
}));

/**
 * PATCH /api/templates/:id
 * Atualiza um template
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await templateRepository.update(id, req.body);
  res.json(template);
}));

/**
 * PUT /api/templates/:id
 * Substitui um template
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const template = await templateRepository.update(id, req.body);
  res.json(template);
}));

/**
 * DELETE /api/templates/:id
 * Deleta um template
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await templateRepository.delete(id);
  res.status(204).send();
}));

module.exports = router;

