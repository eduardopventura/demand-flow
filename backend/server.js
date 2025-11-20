/**
 * JSON-Server Backend for Demand Flow
 * 
 * MVP Implementation with JSON-Server
 * Ready for future upgrade to PostgreSQL + Express/Fastify
 * 
 * Migration Path:
 * 1. Replace this file with Express/Fastify server
 * 2. Keep same route structure (/api/usuarios, /api/templates, etc)
 * 3. Replace jsonServer with Prisma/TypeORM queries
 * 4. Add authentication middleware
 */

const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Enable CORS for all origins (configure properly in production)
server.use(cors());

// Default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Parse JSON body
server.use(jsonServer.bodyParser);

// Custom middleware for logging (useful for debugging)
server.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Custom routes (before json-server router)
// These will be replaced by proper controllers when migrating to PostgreSQL

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'json-server'
  });
});

// API info endpoint
server.get('/api', (req, res) => {
  res.json({
    message: 'Demand Flow API',
    version: '1.0.0',
    endpoints: {
      usuarios: '/api/usuarios',
      templates: '/api/templates',
      demandas: '/api/demandas',
    },
    documentation: 'https://github.com/typicode/json-server#routes'
  });
});

// Custom route for authentication (placeholder - implement properly for production)
server.post('/api/auth/login', (req, res) => {
  const { login, senha } = req.body;
  
  // TODO: Replace with proper authentication when migrating to PostgreSQL
  // This is a MOCK implementation for MVP only
  const db = router.db; // lowdb instance
  const usuarios = db.get('usuarios').value();
  
  const usuario = usuarios.find(u => u.login === login && u.senha === senha);
  
  if (usuario) {
    // TODO: Generate JWT token in production
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({
      success: true,
      usuario: usuarioSemSenha,
      token: 'mock-jwt-token-' + usuario.id // Replace with real JWT
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

// Use default router for REST API
// Routes will be: /api/usuarios, /api/templates, /api/demandas
server.use('/api', router);

// Custom error handler
server.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                                                   ║');
  console.log('║         🚀 Demand Flow Backend Server            ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check:      http://localhost:${PORT}/health`);
  console.log(`📚 API docs:          http://localhost:${PORT}/api`);
  console.log('');
  console.log('📦 Database: JSON-Server (db.json)');
  console.log('⚡ Mode: MVP/Development');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET    /api/usuarios');
  console.log('  POST   /api/usuarios');
  console.log('  GET    /api/templates');
  console.log('  POST   /api/templates');
  console.log('  GET    /api/demandas');
  console.log('  POST   /api/demandas');
  console.log('  POST   /api/auth/login');
  console.log('');
  console.log('💡 Tip: Use Postman or curl to test the API');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

module.exports = server;

