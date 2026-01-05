/**
 * Routes Index
 * 
 * Agregador central de rotas
 */

const authRoutes = require('./auth.routes');
const uploadRoutes = require('./upload.routes');
const demandasRoutes = require('./demandas.routes');
const usuariosRoutes = require('./usuarios.routes');
const cargosRoutes = require('./cargos.routes');
const publicRoutes = require('./public.routes');
const templatesRoutes = require('./templates.routes');
const acoesRoutes = require('./acoes.routes');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { requireCargoPermission } = require('../middlewares/permissions.middleware');

/**
 * Configura todas as rotas no servidor Express
 * @param {Object} server - Instância do Express
 */
function setupRoutes(server) {
  // Rotas de autenticação (públicas - login e register não precisam de auth)
  server.use('/api/auth', authRoutes);
  
  // Rotas protegidas - requerem autenticação
  // Rotas públicas (auth-only) para dados básicos usados pela UI (não é gestão)
  server.use('/api/public', authMiddleware, publicRoutes);

  // Rotas CRUD básicas
  server.use('/api/usuarios', authMiddleware, requireCargoPermission('acesso_usuarios'), usuariosRoutes);
  server.use('/api/cargos', authMiddleware, requireCargoPermission('acesso_usuarios'), cargosRoutes);
  // Templates: leitura liberada para todos, gestão requer acesso_templates (proteção nas rotas individuais)
  server.use('/api/templates', authMiddleware, templatesRoutes);
  server.use('/api/acoes', authMiddleware, requireCargoPermission('acesso_acoes'), acoesRoutes);
  
  // Rotas de upload
  server.use('/api/upload', authMiddleware, uploadRoutes);
  
  // Rotas de demandas (com lógica de negócio)
  server.use('/api/demandas', authMiddleware, demandasRoutes);
}

module.exports = {
  setupRoutes,
  authRoutes,
  uploadRoutes,
  demandasRoutes,
  usuariosRoutes,
  templatesRoutes,
  acoesRoutes
};

