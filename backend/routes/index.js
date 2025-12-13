/**
 * Routes Index
 * 
 * Agregador central de rotas customizadas
 */

const authRoutes = require('./auth.routes');
const uploadRoutes = require('./upload.routes');
const demandasRoutes = require('./demandas.routes');

/**
 * Configura todas as rotas customizadas no servidor
 * @param {Object} server - Instância do Express/JSON-Server
 */
function setupRoutes(server) {
  // Rotas de autenticação
  server.use('/api/auth', authRoutes);
  
  // Rotas de upload
  server.use('/api/upload', uploadRoutes);
  
  // Rotas de demandas (customizadas - antes do JSON-Server)
  server.use('/api/demandas', demandasRoutes);
}

module.exports = {
  setupRoutes,
  authRoutes,
  uploadRoutes,
  demandasRoutes
};

