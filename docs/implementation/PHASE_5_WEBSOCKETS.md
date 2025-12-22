# Fase 5: WebSockets (Tempo Real)

**Status**: ⏳ Em andamento  
**Prioridade**: 🟡 Média  
**Complexidade**: Alta  
**Duração Estimada**: 1-2 semanas

**Dependência**: Fase 2 (Login) deve estar completa (recomendado: Fase 3 e Fase 4 também)

---

## 🎯 Objetivo

Implementar sincronização em tempo real entre usuários via WebSockets (Socket.io), permitindo que mudanças em demandas sejam refletidas instantaneamente em todos os clientes conectados.

---

## ✅ Checklist de Implementação

### 1. Backend - Setup Socket.io

- [x] Instalar dependências: `socket.io`
- [x] Integrar Socket.io no `backend/server.js` (HTTP server + attach Socket.io)
- [x] Configurar CORS para Socket.io (origens via `FRONTEND_URL`/`CORS_ORIGIN`, default `http://localhost:3060`)
- [x] Criar `backend/services/socket.service.js`:
  - [x] Funções para emitir eventos
  - [x] Gerenciamento de conexões
  - [x] Autenticação de sockets (validar JWT)
- [ ] Testar conexão básica (multi-usuário no browser)

### 2. Backend - Emitir Eventos

- [x] Integrar com `backend/services/demanda.service.js`:
  - [x] Após criar demanda → `demanda:created`
  - [x] Após atualizar demanda → `demanda:updated`
  - [x] Após deletar demanda → `demanda:deleted`
  - [x] Após finalizar tarefa → `tarefa:finalizada`
- [x] Emitir eventos em todas as operações CRUD relevantes
- [x] Incluir payloads completos (demanda completa nos eventos created/updated)

### 3. Backend - Autenticação de Sockets

- [x] Validar token JWT na conexão do socket
- [x] Associar socket ao usuário logado (`socket.userId`)
- [x] Rejeitar conexões sem token válido
- [x] Gerenciar desconexões

### 4. Frontend - Cliente Socket.io

- [x] Instalar `socket.io-client`
- [x] Criar `frontend/src/services/socket.service.ts`:
  - [x] Conectar ao servidor
  - [x] Enviar token na conexão (handshake auth)
  - [x] Gerenciar reconexão automática
- [x] Integrar com `AuthContext` para obter token

### 5. Frontend - Integração com DataContext

- [x] Atualizar `frontend/src/contexts/DataContext.tsx`:
  - [x] Escutar eventos do socket
  - [x] Atualizar estado quando receber eventos (com dedupe por ID)
  - [x] Mostrar toast quando outros usuários fazem mudanças (baseado em `meta.actorId`)
- [x] Sincronizar estado local com eventos do servidor

### 6. Otimizações

- [ ] Debounce para evitar atualizações excessivas
- [ ] Indicador visual de "outro usuário está editando" (opcional)
- [ ] Resolver conflitos (última mudança vence ou merge inteligente)
- [ ] Performance: evitar re-renders desnecessários

### 7. Testes e Validação

- [ ] Testar com múltiplos usuários simultâneos
- [ ] Validar que mudanças aparecem em tempo real
- [ ] Testar reconexão automática após queda de conexão
- [ ] Validar que eventos não duplicam dados
- [ ] Performance: validar que não há lag

### 8. Documentação

- [ ] Documentar eventos emitidos pelo servidor
- [ ] Documentar eventos escutados pelo cliente
- [ ] Documentar formato dos eventos
- [ ] Atualizar `backend/README.md` com informações de WebSocket

---

## 📁 Estrutura de Arquivos

```
backend/
├── services/
│   ├── socket.service.js
│   └── demanda.service.js (emite eventos)
└── server.js (HTTP server + Socket.io)

frontend/
├── src/
│   ├── services/
│   │   └── socket.service.ts
│   └── contexts/
│       └── DataContext.tsx (integrar eventos)
```

---

## 🔁 Formato dos Eventos (Implementado)

Todos os eventos enviados pelo backend seguem este formato:

- `demanda:created`
- `demanda:updated`
- `demanda:deleted`
- `tarefa:finalizada`

Payload padrão:

```ts
{
  // depende do evento (ex: { demanda } ou { id } ...)
  meta: {
    actorId?: string;    // usuário que realizou a ação (quando disponível)
    timestamp: string;   // ISO
  }
}
```

---

## 🌐 Proxy /socket.io (Implementado)

Para evitar CORS e manter **same-origin**, foi adicionado proxy de WebSocket:

- Produção (Nginx): `frontend/nginx.conf` encaminha `/socket.io/` para `http://backend:3000`
- Dev (Vite): `frontend/vite.config.ts` faz proxy de `/socket.io` para `http://backend:3000` com `ws: true`


---

## 🔧 Implementação Detalhada

### Backend - Integração Socket.io

```javascript
// backend/server.js
const { Server } = require('socket.io');
const http = require('http');
const { verifyToken } = require('./src/services/auth.service');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3060",
    methods: ["GET", "POST"]
  }
});

// Autenticação de sockets
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token não fornecido'));
    }
    
    const decoded = verifyToken(token);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Usuário conectado: ${socket.user.email}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${socket.user.email}`);
  });
});

// Exportar io para uso nos serviços
app.set('io', io);
```

### Backend - Socket Service

```javascript
// backend/src/services/socket.service.js

function emitDemandaCreated(io, demanda) {
  io.emit('demanda:created', demanda);
}

function emitDemandaUpdated(io, demanda) {
  io.emit('demanda:updated', demanda);
}

function emitDemandaDeleted(io, demandaId) {
  io.emit('demanda:deleted', { id: demandaId });
}

function emitTarefaFinalizada(io, demandaId, tarefaId) {
  io.emit('tarefa:finalizada', { demandaId, tarefaId });
}

module.exports = {
  emitDemandaCreated,
  emitDemandaUpdated,
  emitDemandaDeleted,
  emitTarefaFinalizada
};
```

### Backend - Integrar com Demanda Service

```javascript
// backend/src/services/demanda.service.js
const socketService = require('./socket.service');

async function criarDemanda(prisma, dados, io) {
  const novaDemanda = await prisma.demanda.create({ /* ... */ });
  
  // Emitir evento
  if (io) {
    socketService.emitDemandaCreated(io, novaDemanda);
  }
  
  return novaDemanda;
}

async function atualizarDemanda(prisma, id, updates, userId, io) {
  const demandaAtualizada = await prisma.demanda.update({ /* ... */ });
  
  // Emitir evento
  if (io) {
    socketService.emitDemandaUpdated(io, demandaAtualizada);
  }
  
  return demandaAtualizada;
}
```

### Frontend - Socket Service

```typescript
// frontend/src/services/socket.service.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      this.disconnect();
    }

    this.token = token;
    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado ao WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado do WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const socketService = new SocketService();
```

### Frontend - Integração com DataContext

```typescript
// frontend/src/contexts/DataContext.tsx
import { socketService } from '@/services/socket.service';
import { useAuth } from './AuthContext';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [demandas, setDemandas] = useState<Demanda[]>([]);

  // Conectar socket quando token disponível
  useEffect(() => {
    if (token) {
      socketService.connect(token);
      
      // Escutar eventos
      socketService.on('demanda:created', (novaDemanda) => {
        setDemandas(prev => [...prev, novaDemanda]);
        toast.info(`Nova demanda criada: ${novaDemanda.nome_demanda}`);
      });

      socketService.on('demanda:updated', (demandaAtualizada) => {
        setDemandas(prev => 
          prev.map(d => d.id === demandaAtualizada.id ? demandaAtualizada : d)
        );
        // Não mostrar toast se foi o próprio usuário que fez a mudança
        if (demandaAtualizada.updated_by !== user?.id) {
          toast.info(`Demanda atualizada: ${demandaAtualizada.nome_demanda}`);
        }
      });

      socketService.on('demanda:deleted', ({ id }) => {
        setDemandas(prev => prev.filter(d => d.id !== id));
        toast.info('Demanda excluída');
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [token, user]);

  // ... resto do código
};
```

---

## 🔐 Autenticação de Sockets

### Backend - Validar JWT

```javascript
// No server.js, middleware de autenticação
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Token não fornecido'));
  }
  
  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});
```

### Frontend - Enviar Token

```typescript
// No socket.service.ts
this.socket = io(url, {
  auth: { token }, // Token enviado na conexão
  // ...
});
```

---

## ⚠️ Pontos de Atenção

### Performance
- [ ] Evitar emitir eventos desnecessários
- [ ] Debounce para evitar atualizações excessivas
- [ ] Limitar tamanho dos dados nos eventos
- [ ] Considerar rooms/channels para reduzir tráfego

### Conflitos
- [ ] Resolver conflitos quando múltiplos usuários editam simultaneamente
- [ ] Última mudança vence ou merge inteligente
- [ ] Indicador visual de "outro usuário está editando"

### Reconexão
- [ ] Reconexão automática após queda
- [ ] Sincronizar estado após reconexão
- [ ] Tratar eventos perdidos durante desconexão

### Segurança
- [ ] Validar token em todas as conexões
- [ ] Não expor dados sensíveis nos eventos
- [ ] Rate limiting para evitar abuso

---

## 🧪 Testes de Validação

- [ ] Múltiplos usuários conectados simultaneamente
- [ ] Mudança de um usuário aparece nos outros
- [ ] Reconexão automática após queda
- [ ] Eventos não duplicam dados
- [ ] Performance: sem lag perceptível
- [ ] Autenticação: conexão sem token falha

---

## 📚 Referências

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Socket.io Authentication](https://socket.io/docs/v4/middlewares/)

---

**Fase Anterior**: [Fase 4: Sistema de Cargos e Permissões](./PHASE_4_ROLES.md)  
**Voltar**: [Plano de Implementação](../IMPLEMENTATION_PHASES.md)

