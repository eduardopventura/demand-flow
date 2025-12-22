# Backend - Demand Flow

## 📦 PostgreSQL + Prisma

Backend com PostgreSQL e Prisma ORM para produção.

---

## 🚀 Quick Start

### Local (sem Docker)

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou desenvolvimento (com hot reload)
npm run dev

# Resetar database
npm run seed
```

### Com Docker

```bash
# Da raiz do projeto
docker-compose up backend -d

# Ver logs
docker-compose logs -f backend
```

---

## 📁 Estrutura

```
backend/
├── server.js          # Servidor Express API
├── prisma/            # Prisma schema e migrations
│   ├── schema.prisma
│   └── migrations/
├── src/               # Source code
│   ├── database/      # Prisma Client
│   └── repositories/  # Data access layer
├── package.json       # Dependencies
├── Dockerfile         # Docker image
└── scripts/
    ├── seed.js        # Reset database
    └── migrate-json-to-postgres.js  # Migration script
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Recursos

**Usuários**
- `GET /api/usuarios` - Listar todos
- `GET /api/usuarios/:id` - Buscar por ID
- `POST /api/usuarios` - Criar novo
- `PATCH /api/usuarios/:id` - Atualizar
- `PUT /api/usuarios/:id` - Substituir
- `DELETE /api/usuarios/:id` - Deletar

**Templates**
- `GET /api/templates`
- `GET /api/templates/:id`
- `POST /api/templates`
- `PATCH /api/templates/:id`
- `DELETE /api/templates/:id`

**Demandas**
- `GET /api/demandas`
- `GET /api/demandas/:id`
- `POST /api/demandas`
- `PATCH /api/demandas/:id`
- `DELETE /api/demandas/:id`

---

## 🔌 WebSockets (Socket.io)

O backend expõe um endpoint Socket.io (path padrão):

- **URL**: `http://localhost:3000`
- **Path**: `/socket.io/`

### Autenticação

A conexão exige JWT. O client envia o token no handshake:

- `auth: { token }`

O backend valida com o mesmo `JWT_SECRET` usado no login e popula `socket.userId`.

### Eventos emitidos

- `demanda:created` → `{ demanda, meta }`
- `demanda:updated` → `{ demanda, meta }`
- `demanda:deleted` → `{ id, meta }`
- `tarefa:finalizada` → `{ demandaId, tarefaId, meta }`

Onde:

- `meta.actorId` (opcional) = ID do usuário que realizou a ação
- `meta.timestamp` = ISO datetime

### Filtros e Query

JSON-Server suporta queries avançadas:

```bash
# Filtrar por campo
GET /api/demandas?status=Criada
GET /api/usuarios?nome=João

# Ordenar
GET /api/demandas?_sort=nome_demanda&_order=asc

# Paginar
GET /api/demandas?_page=1&_limit=10

# Buscar texto
GET /api/templates?q=Aluno

# Relações (embed)
GET /api/demandas?_embed=template
```

---

## 🗄️ Database Schema

### PostgreSQL + Prisma

O schema está definido em `prisma/schema.prisma` com as seguintes entidades:

- **Usuario**: Usuários do sistema
- **Template**: Templates de demandas
- **Demanda**: Demandas criadas
- **TarefaStatus**: Status das tarefas de cada demanda
- **Acao**: Ações automáticas (webhooks)
- **CampoPreenchido**: Campos preenchidos de cada demanda

Relacionamentos:
- Demanda → Template (many-to-one)
- Demanda → Usuario (responsável, many-to-one)
- TarefaStatus → Demanda (many-to-one, cascade delete)
- TarefaStatus → Usuario (responsável opcional, many-to-one)
- CampoPreenchido → Demanda (many-to-one, cascade delete)

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3000              # Porta do servidor
NODE_ENV=development   # Ambiente
```

### package.json

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed.js"
  }
}
```

---

## 🔄 Migração de Dados

Para migrar dados do `db.json` para PostgreSQL:

```bash
# Dentro do container
docker exec -it demand-flow-backend node scripts/migrate-json-to-postgres.js

# Ou localmente (com DATABASE_URL configurada)
node scripts/migrate-json-to-postgres.js [caminho-do-db.json]
```

O script migra:
- Usuários
- Templates
- Ações
- Demandas (com tarefas_status e campos_preenchidos)

---

## 🐛 Debug

### Ver logs
```bash
# Docker
docker-compose logs -f backend

# Local
npm run dev
```

### Testar endpoints
```bash
# Health check
curl http://localhost:3000/health

# Listar usuários
curl http://localhost:3000/api/usuarios

# Criar usuário
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@test.com","login":"teste","senha":"123456"}'
```

### Resetar database
```bash
npm run seed
```

---

## 📚 Recursos

- [Express.js](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL](https://www.postgresql.org/)

## 🔧 Comandos Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Criar nova migration (desenvolvimento)
npm run prisma:migrate:dev -- --name nome_da_migration

# Aplicar migrations (produção)
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```

---

**Backend com PostgreSQL pronto para produção! 🚀**

