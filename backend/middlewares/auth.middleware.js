/**
 * Auth Middleware - Autenticação JWT
 * 
 * Middleware para validar tokens JWT e adicionar dados do usuário autenticado em req.user
 * 
 * Uso:
 *   router.get('/protected', authMiddleware, (req, res) => {
 *     // req.user contém os dados do usuário autenticado
 *   });
 */

const { verifyToken } = require('../services/auth.service');
const { prisma } = require('../src/database/client');

/**
 * Middleware de autenticação
 * Extrai token do header Authorization, valida e adiciona req.user
 */
async function authMiddleware(req, res, next) {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        message: 'É necessário fornecer um token de autenticação no header Authorization'
      });
    }
    
    // Extrair token (remover "Bearer " do início)
    const token = authHeader.substring(7);
    
    // Validar token
    const decoded = verifyToken(token);
    
    // Buscar usuário no banco (inclui cargo e permissões)
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nome: true,
        email: true,
        login: true,
        telefone: true,
        notificar_email: true,
        notificar_telefone: true,
        cargo_id: true,
        cargo: {
          select: {
            id: true,
            nome: true,
            acesso_templates: true,
            acesso_acoes: true,
            acesso_usuarios: true,
            deletar_demandas: true,
            cargo_disponivel_como_responsavel: true,
            usuarios_disponiveis_como_responsaveis: true,
          },
        },
      },
    });
    
    if (!usuario) {
      return res.status(401).json({ 
        error: 'Usuário não encontrado',
        message: 'O usuário associado ao token não existe mais'
      });
    }
    
    // Adicionar usuário ao request
    req.user = usuario;
    next();
  } catch (error) {
    // Se o erro já tem status (vindo do verifyToken), usar ele
    if (error.status) {
      return res.status(error.status).json({ 
        error: 'Token inválido',
        message: error.message 
      });
    }
    
    // Erro inesperado
    return res.status(401).json({ 
      error: 'Erro de autenticação',
      message: error.message || 'Token inválido'
    });
  }
}

module.exports = { authMiddleware };

