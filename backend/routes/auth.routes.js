/**
 * Auth Routes
 * 
 * Rotas de autenticação
 */

const express = require('express');
const router = express.Router();
const usuarioRepository = require('../src/repositories/usuario.repository');
const { asyncHandler, badRequest } = require('../middlewares/error.middleware');
const { comparePassword, hashPassword, generateToken } = require('../services/auth.service');
const { authMiddleware } = require('../middlewares/auth.middleware');

/**
 * POST /api/auth/login
 * Autenticação de usuário
 * 
 * Body: { login: string, senha: string }
 * Response: { usuario: Object, token: string }
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { login, senha } = req.body;
  
  // Validação
  if (!login || !senha) {
    throw badRequest('Login e senha são obrigatórios');
  }
  
  // Buscar usuário (case-insensitive via repository)
  const usuario = await usuarioRepository.findByLogin(login);
  
  if (!usuario) {
    return res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
  
  // Comparar senha com hash
  const senhaValida = await comparePassword(senha, usuario.senha_hash);
  
  if (!senhaValida) {
    return res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
  
  // Remover senha_hash da resposta
  const { senha_hash: _, ...usuarioSemSenha } = usuario;
  
  // Gerar token JWT
  const token = generateToken(usuario);
  
  res.json({
    success: true,
    usuario: usuarioSemSenha,
    token
  });
}));

/**
 * POST /api/auth/register
 * Registro de novo usuário
 * 
 * Body: { nome, email, telefone, login, senha, cargo?, notificar_email?, notificar_telefone? }
 * Response: { usuario: Object, token: string }
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { nome, email, telefone, login, senha, cargo_id, notificar_email, notificar_telefone } = req.body;
  
  // Validação
  if (!nome || !email || !telefone || !login || !senha) {
    throw badRequest('Nome, email, telefone, login e senha são obrigatórios');
  }
  
  // Verificar se login já existe
  const usuarioExistente = await usuarioRepository.findByLogin(login);
  if (usuarioExistente) {
    throw badRequest('Login já está em uso');
  }
  
  // Verificar se email já existe
  const emailExistente = await usuarioRepository.findByEmail(email);
  if (emailExistente) {
    throw badRequest('Email já está em uso');
  }
  
  // Hash da senha
  const senha_hash = await hashPassword(senha);

  // cargo_id é obrigatório
  if (!cargo_id) {
    throw badRequest('cargo_id é obrigatório');
  }
  
  // Criar usuário
  const novoUsuario = await usuarioRepository.create({
    nome,
    email,
    telefone,
    login,
    senha_hash,
    cargo_id,
    notificar_email: notificar_email !== undefined ? notificar_email : true,
    notificar_telefone: notificar_telefone !== undefined ? notificar_telefone : false
  });
  
  // Remover senha_hash da resposta
  const { senha_hash: _, ...usuarioSemSenha } = novoUsuario;
  
  // Gerar token JWT
  const token = generateToken(novoUsuario);
  
  res.status(201).json({
    success: true,
    usuario: usuarioSemSenha,
    token
  });
}));

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 * 
 * Requer autenticação (token JWT)
 * Response: { usuario: Object }
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  // req.user já está preenchido pelo authMiddleware
  res.json({
    success: true,
    usuario: req.user
  });
}));

module.exports = router;

