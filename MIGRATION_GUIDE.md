# 🔄 Migration Guide: JSON-Server → PostgreSQL

## 📋 Overview

Este guia detalha como migrar do MVP atual (JSON-Server) para produção (PostgreSQL).

A arquitetura foi desenhada para facilitar esta migração mantendo o máximo de código existente.

---

## 🎯 Estratégia de Migração

### Fase 1: MVP Atual (JSON-Server) ✅
```
Frontend → API Service → JSON-Server → db.json
```

### Fase 2: Produção (PostgreSQL) 🎯
```
Frontend → API Service → Express/Fastify → Prisma → PostgreSQL
```

**Mudanças necessárias:**
- ✅ Frontend: **Nenhuma** (usa mesmo API Service)
- 🔧 Backend: Substituir JSON-Server por Express + Prisma
- 🗄️ Database: Substituir db.json por PostgreSQL

---

## 📦 O Que Manter (Não Mudar)

### 1. Frontend Completo ✅
- Todos os componentes React
- Tipos TypeScript (`src/types/`)
- Constants (`src/constants/`)
- Schemas Zod (`src/schemas/`)
- Hooks (`src/hooks/`)
- Utils (`src/utils/`)

### 2. API Service Interface ✅
O arquivo `src/services/api.service.ts` **mantém a mesma interface**:

```typescript
// Estas funções NÃO mudam
apiService.getUsuarios()
apiService.createDemanda()
apiService.updateTemplate()
// etc...
```

### 3. Estrutura Docker ✅
- `docker-compose.yml` (apenas adicionar serviço PostgreSQL)
- Estrutura de pastas
- Scripts

---

## 🔧 O Que Substituir

### 1. Backend: JSON-Server → Express + Prisma

#### Atual (backend/server.js):
```javascript
const jsonServer = require('json-server');
const router = jsonServer.router('db.json');
```

#### Novo (backend/src/server.ts):
```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.get('/api/usuarios', async (req, res) => {
  const usuarios = await prisma.usuario.findMany();
  res.json(usuarios);
});
```

### 2. Database: db.json → PostgreSQL

#### Atual:
```json
{
  "usuarios": [],
  "templates": [],
  "demandas": []
}
```

#### Novo (schema.prisma):
```prisma
model Usuario {
  id       String   @id @default(uuid())
  nome     String
  email    String   @unique
  login    String   @unique
  senha    String
  demandas Demanda[]
}

model Template {
  id                    String   @id @default(uuid())
  nome                  String
  prioridade            String
  campos_preenchimento  Json
  tarefas               Json
  demandas              Demanda[]
}

model Demanda {
  id                  String    @id @default(uuid())
  template_id         String
  template            Template  @relation(fields: [template_id], references: [id])
  nome_demanda        String
  status              String
  prioridade          String
  responsavel_id      String
  responsavel         Usuario   @relation(fields: [responsavel_id], references: [id])
  campos_preenchidos  Json
  tarefas_status      Json
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
}
```

---

## 🚀 Passo a Passo da Migração

### Passo 1: Preparar Ambiente PostgreSQL

#### 1.1 Atualizar docker-compose.yml

Adicionar serviço PostgreSQL:

```yaml
services:
  # Adicionar ANTES do backend
  db:
    image: postgres:16-alpine
    container_name: demand-flow-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: demandflow
      POSTGRES_USER: demandflow
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demandflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://demandflow:${DB_PASSWORD}@db:5432/demandflow

volumes:
  postgres_data:
```

#### 1.2 Adicionar ao .env

```bash
DB_PASSWORD=strong_password_here
DATABASE_URL=postgresql://demandflow:strong_password_here@localhost:5432/demandflow
```

### Passo 2: Instalar Prisma

```bash
cd backend
npm install prisma @prisma/client
npm install -D prisma
npx prisma init
```

### Passo 3: Criar Schema Prisma

Criar `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id        String    @id @default(uuid())
  nome      String
  email     String    @unique
  login     String    @unique
  senha     String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  demandas  Demanda[]

  @@map("usuarios")
}

model Template {
  id                    String    @id @default(uuid())
  nome                  String
  prioridade            String
  campos_preenchimento  Json      @map("campos_preenchimento")
  tarefas               Json
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  demandas              Demanda[]

  @@map("templates")
}

model Demanda {
  id                  String    @id @default(uuid())
  template_id         String
  template            Template  @relation(fields: [template_id], references: [id], onDelete: Cascade)
  nome_demanda        String    @map("nome_demanda")
  status              String
  prioridade          String
  responsavel_id      String    @map("responsavel_id")
  responsavel         Usuario   @relation(fields: [responsavel_id], references: [id], onDelete: SetNull)
  campos_preenchidos  Json      @map("campos_preenchidos")
  tarefas_status      Json      @map("tarefas_status")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@index([status])
  @@index([template_id])
  @@index([responsavel_id])
  @@map("demandas")
}
```

### Passo 4: Gerar Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Passo 5: Migrar Dados de db.json

Criar script `backend/scripts/migrate-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrate() {
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  
  console.log('Migrating usuarios...');
  for (const usuario of data.usuarios) {
    await prisma.usuario.create({ data: usuario });
  }
  
  console.log('Migrating templates...');
  for (const template of data.templates) {
    await prisma.template.create({ data: template });
  }
  
  console.log('Migrating demandas...');
  for (const demanda of data.demandas) {
    await prisma.demanda.create({ data: demanda });
  }
  
  console.log('✅ Migration complete!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Executar:
```bash
node backend/scripts/migrate-data.js
```

### Passo 6: Substituir Backend

Criar `backend/src/server.ts`:

```typescript
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app: Express = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    database: 'postgresql',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// USUARIOS
// ============================================================================

app.get('/api/usuarios', async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching usuarios' });
  }
});

app.get('/api/usuarios/:id', async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id }
    });
    if (!usuario) return res.status(404).json({ error: 'Usuario not found' });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching usuario' });
  }
});

app.post('/api/usuarios', async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.create({
      data: req.body
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error creating usuario' });
  }
});

app.patch('/api/usuarios/:id', async (req: Request, res: Response) => {
  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error updating usuario' });
  }
});

app.delete('/api/usuarios/:id', async (req: Request, res: Response) => {
  try {
    await prisma.usuario.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting usuario' });
  }
});

// ============================================================================
// TEMPLATES (similar structure)
// ============================================================================

app.get('/api/templates', async (req: Request, res: Response) => {
  const templates = await prisma.template.findMany();
  res.json(templates);
});

// ... (outras rotas similares)

// ============================================================================
// DEMANDAS (similar structure)
// ============================================================================

app.get('/api/demandas', async (req: Request, res: Response) => {
  const demandas = await prisma.demanda.findMany({
    include: {
      template: true,
      responsavel: true
    }
  });
  res.json(demandas);
});

// ... (outras rotas similares)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📦 Database: PostgreSQL`);
});

export default app;
```

### Passo 7: Atualizar package.json

```json
{
  "name": "demand-flow-backend",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Passo 8: Testar

```bash
# Subir PostgreSQL
docker-compose up db -d

# Aplicar migrations
cd backend && npx prisma migrate dev

# Migrar dados
node scripts/migrate-data.js

# Subir backend
npm run dev

# Testar
curl http://localhost:3000/health
curl http://localhost:3000/api/usuarios
```

### Passo 9: Deploy Completo

```bash
# Subir tudo
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs backend
```

---

## ✅ Checklist de Migração

### Preparação
- [ ] Backup do db.json atual
- [ ] Documentar dados importantes
- [ ] Testar em ambiente de desenvolvimento

### Infraestrutura
- [ ] PostgreSQL rodando no Docker
- [ ] Variáveis de ambiente configuradas
- [ ] Prisma instalado e configurado

### Backend
- [ ] Schema Prisma criado
- [ ] Migrations aplicadas
- [ ] Dados migrados de db.json
- [ ] Rotas Express implementadas
- [ ] Testes de API funcionando

### Frontend
- [ ] Variável VITE_API_URL configurada
- [ ] API Service funcionando (sem mudanças!)
- [ ] Aplicação React funcionando

### Produção
- [ ] Docker Compose atualizado
- [ ] Volumes persistentes configurados
- [ ] Backup automático configurado
- [ ] Monitoramento configurado

---

## 🎯 Resultado Final

### Antes (MVP):
```
Frontend → api.service.ts → JSON-Server → db.json
```

### Depois (Produção):
```
Frontend → api.service.ts → Express → Prisma → PostgreSQL
```

**O que mudou para o usuário:** NADA! ✅

**O que mudou no código:**
- ✅ Apenas o backend (substituído)
- ✅ Database (upgraded)
- ✅ Frontend continua igual

---

## 📚 Recursos Adicionais

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL in Docker](https://hub.docker.com/_/postgres)
- [Express.js](https://expressjs.com/)

---

## 💡 Dicas

1. **Teste Localmente Primeiro**
   - Use Docker Compose para testar tudo
   - Não migre direto em produção

2. **Backup é Essencial**
   - Sempre tenha backup do db.json
   - Configure backup automático do PostgreSQL

3. **Migração Gradual**
   - Pode rodar JSON-Server e PostgreSQL em paralelo
   - Migre dados gradualmente
   - Valide antes de desativar JSON-Server

4. **Monitoramento**
   - Configure logs
   - Use Prisma Studio para visualizar dados
   - Configure alertas

---

**A arquitetura foi desenhada para esta migração ser simples e segura!** 🚀

