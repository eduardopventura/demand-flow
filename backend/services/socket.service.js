/**
 * Socket Service (Socket.io)
 *
 * - Centraliza setup do Socket.io no backend
 * - Autentica sockets via JWT (handshake.auth.token ou Authorization header)
 * - Expõe helpers para emitir eventos de demandas/tarefas
 *
 * Observação:
 * - Emitimos eventos para TODOS os clientes conectados.
 *   No frontend fazemos dedupe por ID para evitar duplicação e controlamos toasts via meta.actorId.
 */

const { Server } = require('socket.io');
const { verifyToken } = require('./auth.service');

let io = null;

function userRoom(userId) {
  return `user:${userId}`;
}

function parseAllowedOrigins() {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CORS_ORIGIN ||
    'http://localhost:3060';

  // Suporta múltiplas origens separadas por vírgula
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function initSocketServer(httpServer) {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: parseAllowedOrigins(),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Autenticação no handshake
  io.use((socket, next) => {
    try {
      const authToken = socket.handshake?.auth?.token;
      const headerAuth = socket.handshake?.headers?.authorization;
      const headerToken =
        typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')
          ? headerAuth.substring(7)
          : null;

      const token = authToken || headerToken;

      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.user = decoded;

      return next();
    } catch (error) {
      return next(new Error(error?.message || 'Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(userRoom(socket.userId));
    }

    console.log(`🔌 [WS] Conectado userId=${socket.userId || 'unknown'}`);

    socket.on('disconnect', (reason) => {
      console.log(
        `🔌 [WS] Desconectado userId=${socket.userId || 'unknown'} reason=${reason}`
      );
    });
  });

  console.log('✅ [WS] Socket.io inicializado');

  return io;
}

function getIO() {
  return io;
}

function emit(event, payload, meta = {}) {
  if (!io) return;

  const envelope = {
    ...payload,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };

  io.emit(event, envelope);
}

function emitDemandaCreated(demanda, meta = {}) {
  emit('demanda:created', { demanda }, meta);
}

function emitDemandaUpdated(demanda, meta = {}) {
  emit('demanda:updated', { demanda }, meta);
}

function emitDemandaDeleted(demandaId, meta = {}) {
  emit('demanda:deleted', { id: demandaId }, meta);
}

function emitTarefaFinalizada(demandaId, tarefaId, meta = {}) {
  emit('tarefa:finalizada', { demandaId, tarefaId }, meta);
}

module.exports = {
  initSocketServer,
  getIO,
  emitDemandaCreated,
  emitDemandaUpdated,
  emitDemandaDeleted,
  emitTarefaFinalizada,
};


