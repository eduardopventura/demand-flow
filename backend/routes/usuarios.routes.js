/**
 * Usuarios Routes
 * 
 * Rotas CRUD para usuários
 */

const express = require('express');
const router = express.Router();
const usuarioRepository = require('../src/repositories/usuario.repository');
const { asyncHandler, badRequest } = require('../middlewares/error.middleware');
const { frontendToBackend, backendToFrontend, backendToFrontendArray } = require('../utils/senha.helper');

/**
 * GET /api/usuarios
 * Lista todos os usuários
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.cargo_id) {
    filters.cargo_id = String(req.query.cargo_id);
  }
  
  const usuarios = await usuarioRepository.findAll(filters);
  res.json(backendToFrontendArray(usuarios));
}));

/**
 * GET /api/usuarios/:id
 * Busca um usuário por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usuario = await usuarioRepository.findById(id);
  
  if (!usuario) {
    return res.status(404).json({
      error: 'Usuário não encontrado',
      message: `Usuário com ID ${id} não existe`
    });
  }
  
  res.json(backendToFrontend(usuario));
}));

/**
 * POST /api/usuarios
 * Cria um novo usuário
 */
router.post('/', asyncHandler(async (req, res) => {
  const data = await frontendToBackend(req.body);

  // cargo_id é obrigatório
  if (!data.cargo_id) {
    throw badRequest('cargo_id é obrigatório');
  }

  const usuario = await usuarioRepository.create(data);
  res.status(201).json(backendToFrontend(usuario));
}));

/**
 * PATCH /api/usuarios/:id
 * Atualiza um usuário
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await frontendToBackend(req.body);

  const usuario = await usuarioRepository.update(id, data);
  res.json(backendToFrontend(usuario));
}));

/**
 * PUT /api/usuarios/:id
 * Substitui um usuário
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = await frontendToBackend(req.body);

  const usuario = await usuarioRepository.update(id, data);
  res.json(backendToFrontend(usuario));
}));

/**
 * DELETE /api/usuarios/:id
 * Deleta um usuário
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  await usuarioRepository.delete(id);
  res.status(204).send();
}));

module.exports = router;

