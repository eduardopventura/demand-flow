/**
 * Demand Flow Backend Server
 * 
 * Entry Point - Configuração e inicialização do servidor
 * 
 * Arquitetura:
 * - JSON-Server para CRUD básico
 * - Rotas customizadas para lógica de negócio
 * - Jobs agendados para notificações
 */

const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');

// Configurações
const { handleMulterError, UPLOADS_DIR } = require('./config/upload.config');

// Middlewares
const { errorHandler } = require('./middlewares/error.middleware');

// Rotas
const { setupRoutes } = require('./routes');

// Jobs
const prazoCheckerJob = require('./jobs/prazo-checker.job');

// Services
const emailService = require('./services/email.service');

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Enable CORS
server.use(cors());

// Serve static files from uploads directory
server.use('/uploads', require('express').static(UPLOADS_DIR));

// Default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Parse JSON body
server.use(jsonServer.bodyParser);

// Disponibilizar db para as rotas
server.use((req, res, next) => {
  req.app.set('db', router.db);
  next();
});

// Logging middleware
server.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// INFO ENDPOINTS
// ============================================================================

// Health check
server.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '0.2.11',
    database: 'json-server',
    features: ['notifications', 'deadline-checker', 'modular-architecture']
  });
});

// API info
server.get('/api', (req, res) => {
  res.json({
    message: 'Demand Flow API',
    version: '0.2.11',
    endpoints: {
      usuarios: '/api/usuarios',
      templates: '/api/templates',
      demandas: '/api/demandas',
      acoes: '/api/acoes',
      upload: '/api/upload (POST)',
      auth: '/api/auth/login (POST)',
      executarAcao: '/api/demandas/:id/tarefas/:taskId/executar (POST)',
    }
  });
});

// ============================================================================
// CUSTOM ROUTES (before json-server router)
// ============================================================================

setupRoutes(server);

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// Multer error handler
server.use(handleMulterError);

// General error handler (centralizado)
server.use(errorHandler);

// ============================================================================
// JSON-SERVER ROUTER (for CRUD operations)
// ============================================================================

server.use('/api', router);

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                                                   ║');
  console.log('║         🚀 Demand Flow Backend Server            ║');
  console.log('║              v0.2.11                               ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check:      http://localhost:${PORT}/health`);
  console.log(`📚 API docs:          http://localhost:${PORT}/api`);
  console.log('');
  console.log('📦 Database: JSON-Server (db.json)');
  console.log('⚡ Mode: MVP/Development');
  console.log('🔔 Notifications: Enabled (Email + WhatsApp)');
  console.log('');
  console.log('📁 Architecture:');
  console.log('   ├── config/     - Configurations');
  console.log('   ├── routes/     - HTTP Routes');
  console.log('   ├── services/   - Business Logic');
  console.log('   ├── utils/      - Helpers');
  console.log('   └── jobs/       - Scheduled Tasks');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET    /api/usuarios');
  console.log('  POST   /api/usuarios');
  console.log('  GET    /api/templates');
  console.log('  POST   /api/templates');
  console.log('  GET    /api/demandas');
  console.log('  POST   /api/demandas');
  console.log('  PATCH  /api/demandas/:id');
  console.log('  POST   /api/demandas/:id/tarefas/:taskId/executar');
  console.log('  POST   /api/upload');
  console.log('  POST   /api/auth/login');
  console.log('');
  
  // Verificar conexão SMTP
  console.log('🔌 Verificando conexão SMTP...');
  await emailService.verificarConexao();
  
  // Iniciar job de verificação de prazos
  prazoCheckerJob.iniciar(router.db);
  
  console.log('');
  console.log('💡 Tip: Use Postman or curl to test the API');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = server;
