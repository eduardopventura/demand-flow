/**
 * Auth Routes
 * 
 * Rotas de autenticação
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticação de usuário (placeholder - implementar corretamente para produção)
 */
router.post('/login', (req, res) => {
  const { login, senha } = req.body;
  const db = req.app.get('db');
  
  const usuarios = db.get('usuarios').value();
  const usuario = usuarios.find(u => u.login === login && u.senha === senha);
  
  if (usuario) {
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({
      success: true,
      usuario: usuarioSemSenha,
      token: 'mock-jwt-token-' + usuario.id
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

module.exports = router;

