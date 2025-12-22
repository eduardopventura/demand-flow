/**
 * Demand Flow Backend Server
 * 
 * Entry Point - Configuração e inicialização do servidor
 * 
 * Arquitetura:
 * - Express.js para servidor HTTP
 * - PostgreSQL + Prisma para banco de dados
 * - Rotas customizadas para lógica de negócio
 * - Jobs agendados para notificações
 */

const express = require('express');
const cors = require('cors');
const http = require('http');

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
const { initSocketServer } = require('./services/socket.service');

// Database
const { prisma } = require('./src/database/client');

// ============================================================================
// SERVER SETUP
// ============================================================================

const server = express();

// Enable CORS
server.use(cors());

// Parse JSON body
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
server.use('/uploads', express.static(UPLOADS_DIR));

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
server.get('/health', async (req, res) => {
  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'postgresql',
      features: ['notifications', 'deadline-checker', 'modular-architecture', 'postgresql']
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'postgresql',
      error: 'Database connection failed'
    });
  }
});

// API info
server.get('/api', (req, res) => {
  res.json({
    message: 'Demand Flow API',
    version: '1.0.0',
    database: 'PostgreSQL + Prisma',
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

// Root route handler
server.get('/', (req, res) => {
  res.json({
    message: 'Demand Flow Backend API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      usuarios: '/api/usuarios',
      templates: '/api/templates',
      demandas: '/api/demandas',
      acoes: '/api/acoes',
    }
  });
});

// ============================================================================
// ROUTES
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
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;
const httpServer = http.createServer(server);

// Inicializar Socket.io no mesmo servidor HTTP
initSocketServer(httpServer);

httpServer.listen(PORT, async () => {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                                                   ║');
  console.log('║         🚀 Demand Flow Backend Server            ║');
  console.log('║              v1.0.0                               ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check:      http://localhost:${PORT}/health`);
  console.log(`📚 API docs:          http://localhost:${PORT}/api`);
  console.log('');
  console.log('📦 Database: PostgreSQL + Prisma');
  console.log('⚡ Mode: Production Ready');
  console.log('🔔 Notifications: Enabled (Email + WhatsApp)');
  console.log('');
  console.log('📁 Architecture:');
  console.log('   ├── config/        - Configurations');
  console.log('   ├── routes/        - HTTP Routes');
  console.log('   ├── services/      - Business Logic');
  console.log('   ├── src/           - Source Code');
  console.log('   │   ├── database/  - Prisma Client');
  console.log('   │   └── repositories/ - Data Access Layer');
  console.log('   ├── utils/         - Helpers');
  console.log('   └── jobs/          - Scheduled Tasks');
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
  
  // Verificar conexão com banco
  try {
    await prisma.$connect();
    console.log('✅ Database: Connected to PostgreSQL');
  } catch (error) {
    console.error('❌ Database: Connection failed', error.message);
  }
  
  // Verificar conexão SMTP
  console.log('🔌 Verificando conexão SMTP...');
  await emailService.verificarConexao();
  
  // Iniciar job de verificação de prazos
  prazoCheckerJob.iniciar();
  
  console.log('');
  console.log('💡 Tip: Use Postman or curl to test the API');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = server;
