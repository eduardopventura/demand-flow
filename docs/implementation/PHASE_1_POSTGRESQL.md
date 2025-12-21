# Fase 1: Migração PostgreSQL

**Status**: ⏳ Pendente  
**Prioridade**: 🔴 Crítica  
**Complexidade**: Alta  
**Duração Estimada**: 2 semanas

---

## 🎯 Objetivo

Substituir completamente o JSON-Server por PostgreSQL com Prisma, estabelecendo a base de dados relacional para produção. **Migração total sem compatibilidade com JSON**.

---

## ✅ Checklist de Implementação

### 1. Setup do Banco de Dados

- [ ] Adicionar serviço PostgreSQL no `docker-compose.yml`
- [ ] Configurar variáveis de conexão diretamente no compose
- [ ] Criar volumes para persistência do banco
- [ ] Testar conexão básica do backend ao PostgreSQL
- [ ] Documentar variáveis de conexão no compose

### 2. Schema e Migrations (Docker)

- [ ] Adicionar Prisma ao `package.json`:
  ```json
  "dependencies": {
    "prisma": "^5.x.x",
    "@prisma/client": "^5.x.x"
  }
  ```
- [ ] Inicializar Prisma dentro do container:
  ```bash
  docker exec -it demand-flow-backend npx prisma init
  ```
- [ ] Criar schema inicial (`prisma/schema.prisma`) com todas as entidades:
  - [ ] `usuarios` (id, nome, email, telefone, login, senha_hash, cargo, notificar_email, notificar_telefone, created_at, updated_at)
  - [ ] `templates` (id, nome, tempo_medio, abas, campos_preenchimento, tarefas, created_at, updated_at)
  - [ ] `demandas` (id, template_id, nome_demanda, status, responsavel_id, tempo_esperado, data_criacao, data_previsao, data_finalizacao, prazo, observacoes, created_at, updated_at)
  - [ ] `tarefas_status` (id, demanda_id, id_tarefa, concluida, responsavel_id, created_at, updated_at)
  - [ ] `acoes` (id, nome, url, campos, created_at, updated_at)
  - [ ] `campos_preenchidos` (id, demanda_id, id_campo, valor, created_at)
- [ ] Definir relacionamentos (foreign keys)
- [ ] Criar primeira migration dentro do container:
  ```bash
  docker exec -it demand-flow-backend npx prisma migrate dev --name init
  ```
- [ ] Adicionar scripts no `package.json` para automatizar:
  ```json
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "postinstall": "prisma generate"
  }
  ```
- [ ] Atualizar Dockerfile para gerar Prisma Client no build
- [ ] Validar schema no banco após build

### 3. Migração do Código Backend

- [ ] Criar `backend/src/database/client.js` (Prisma Client)
- [ ] Criar repositories para cada entidade:
  - [ ] `usuario.repository.js`
  - [ ] `template.repository.js`
  - [ ] `demanda.repository.js`
  - [ ] `acao.repository.js`
- [ ] Migrar `demanda.service.js` para usar Prisma
- [ ] Migrar todas as rotas para usar repositories
- [ ] Remover dependência do JSON-Server
- [ ] Atualizar `server.js` para não usar json-server
- [ ] Remover `db.json` e referências

### 4. Script de Migração de Dados

- [ ] Criar script `backend/scripts/migrate-json-to-postgres.js`
- [ ] Ler dados do `db.json` (backup)
- [ ] Transformar dados para formato Prisma
- [ ] Inserir dados no PostgreSQL
- [ ] Validar integridade dos dados migrados
- [ ] Documentar processo de migração

### 5. Atualização do Docker Compose

- [ ] Adicionar serviço `postgres` no compose
- [ ] Configurar variáveis de conexão no compose:
  ```yaml
  environment:
    POSTGRES_DB: demandflow
    POSTGRES_USER: demandflow
    POSTGRES_PASSWORD: demandflow_password
  ```
- [ ] Configurar backend para usar variáveis do compose:
  ```yaml
  environment:
    DATABASE_URL: postgresql://demandflow:demandflow_password@postgres:5432/demandflow
  ```
- [ ] Adicionar `depends_on` do backend para postgres
- [ ] Remover volume do `db.json`
- [ ] Documentar variáveis no compose

### 6. Testes e Validação

- [ ] Testar CRUD de todas entidades
- [ ] Validar integridade referencial (foreign keys)
- [ ] Testar queries complexas (joins, agregações)
- [ ] Validar performance: criar índices nas colunas mais consultadas
- [ ] Testar migração de dados completa
- [ ] Validar que todas as rotas funcionam
- [ ] Testar em ambiente Docker completo

### 7. Documentação

- [ ] Atualizar `backend/README.md` com instruções PostgreSQL
- [ ] Documentar variáveis do docker-compose
- [ ] Criar guia de migração de dados
- [ ] Atualizar `docs/DOCKER.md` com informações do PostgreSQL
- [ ] Documentar estrutura do schema Prisma

---

## 📁 Estrutura de Arquivos

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── [timestamp]_init/
├── src/
│   ├── database/
│   │   └── client.js
│   └── repositories/
│       ├── usuario.repository.js
│       ├── template.repository.js
│       ├── demanda.repository.js
│       └── acao.repository.js
├── scripts/
│   └── migrate-json-to-postgres.js
├── Dockerfile (atualizado com Prisma)
└── package.json (adicionar prisma, @prisma/client + scripts)

docker-compose.yml (adicionar serviço postgres)
```

---

## 🐳 Dockerfile Atualizado

O Dockerfile será atualizado para gerar o Prisma Client automaticamente durante o build:

```dockerfile
# Backend Dockerfile - PostgreSQL + Prisma
FROM node:20-alpine

LABEL maintainer="Demand Flow Team"
LABEL description="Backend with PostgreSQL and Prisma"

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (inclui Prisma)
RUN npm install --omit=dev

# Generate Prisma Client durante o build
RUN npx prisma generate

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
# Migrations serão aplicadas automaticamente via script no package.json
CMD ["npm", "start"]
```

**Importante**: 
- Prisma Client é gerado durante o build (não precisa gerar no runtime)
- Migrations serão aplicadas automaticamente no startup via script `db:migrate` ou entrypoint
- Schema Prisma deve estar commitado no repositório (não usar volume para isso)

---

## 📦 Package.json - Scripts Automatizados

Adicionar scripts para facilitar operações Prisma dentro do container:

```json
{
  "scripts": {
    "start": "prisma migrate deploy && node -r dotenv/config server.js",
    "dev": "nodemon -r dotenv/config server.js",
    "seed": "node scripts/seed.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "prisma:migrate:dev": "prisma migrate dev",
    "postinstall": "prisma generate"
  }
}
```

**Scripts explicados**:
- `start`: **Aplica migrations automaticamente** antes de iniciar o servidor (produção)
- `prisma:generate`: Gera o Prisma Client (executado automaticamente no `postinstall`)
- `prisma:migrate`: Aplica migrations em produção (`migrate deploy`)
- `prisma:migrate:dev`: Cria novas migrations durante desenvolvimento
- `prisma:studio`: Abre Prisma Studio para visualizar dados

**Importante**: 
- O script `start` aplica migrations automaticamente no startup do container
- Isso garante que o banco sempre está atualizado quando o container inicia
- `migrate deploy` é seguro para produção (não cria novas migrations, apenas aplica existentes)

---

## 🔧 Configuração Docker Compose

### Serviço PostgreSQL

```yaml
postgres:
  image: postgres:16-alpine
  container_name: demand-flow-postgres
  restart: unless-stopped
  environment:
    POSTGRES_DB: demandflow
    POSTGRES_USER: demandflow
    POSTGRES_PASSWORD: demandflow_password
  volumes:
    - postgres_data:/var/lib/postgresql/data
  networks:
    - demand-flow-network
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U demandflow"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Atualização do Backend

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  container_name: demand-flow-backend
  restart: unless-stopped
  ports:
    - "3000:3000"
  volumes:
    # Remover volume do db.json
    - ./backend/uploads:/app/uploads
    # Opcional: manter prisma para desenvolvimento (não necessário em produção)
    # - ./backend/prisma:/app/prisma
  environment:
    - NODE_ENV=production
    - PORT=3000
    - DATABASE_URL=postgresql://demandflow:demandflow_password@postgres:5432/demandflow
  env_file:
    - ./backend/.env  # Para SMTP, WhatsApp, etc.
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - demand-flow-network
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

**Importante**: 
- `DATABASE_URL` está hardcoded no compose (não usar .env para isso)
- Variáveis de conexão ficam diretamente no compose conforme solicitado
- `db.json` não será mais montado como volume

### Volumes

```yaml
volumes:
  postgres_data:
    driver: local
```

---

## 📊 Schema Prisma (Estrutura Base)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id                String   @id @default(uuid())
  nome              String
  email             String   @unique
  telefone          String
  login             String   @unique
  senha_hash        String   // Será usado na Fase 2
  cargo             String?
  notificar_email   Boolean  @default(true)
  notificar_telefone Boolean @default(false)
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  demandas          Demanda[]
  tarefas_status    TarefaStatus[]
}

model Template {
  id                  String   @id @default(uuid())
  nome                String
  tempo_medio         Int
  abas                Json     // Array de AbaTemplate
  campos_preenchimento Json    // Array de CampoPreenchimento
  tarefas             Json     // Array de Tarefa
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  
  demandas            Demanda[]
}

model Demanda {
  id                String   @id @default(uuid())
  template_id       String
  nome_demanda      String
  status            String   // "Criada" | "Em Andamento" | "Finalizada"
  responsavel_id    String
  tempo_esperado    Int
  data_criacao      DateTime @default(now())
  data_previsao     DateTime
  data_finalizacao  DateTime?
  prazo             Boolean  @default(true)
  observacoes       String?
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  template          Template @relation(fields: [template_id], references: [id])
  responsavel        Usuario  @relation(fields: [responsavel_id], references: [id])
  tarefas_status     TarefaStatus[]
  campos_preenchidos CampoPreenchido[]
}

model TarefaStatus {
  id            String   @id @default(uuid())
  demanda_id    String
  id_tarefa     String
  concluida     Boolean  @default(false)
  responsavel_id String?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  demanda       Demanda  @relation(fields: [demanda_id], references: [id], onDelete: Cascade)
  responsavel    Usuario? @relation(fields: [responsavel_id], references: [id])
}

model Acao {
  id        String   @id @default(uuid())
  nome      String
  url       String
  campos    Json     // Array de CampoAcao
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}

model CampoPreenchido {
  id         String   @id @default(uuid())
  demanda_id String
  id_campo   String
  valor      String
  created_at DateTime @default(now())
  
  demanda    Demanda  @relation(fields: [demanda_id], references: [id], onDelete: Cascade)
}
```

---

## 🔄 Processo de Migração de Dados

### Script de Migração (Executar no Container)

O script será executado dentro do container Docker:

```javascript
// backend/scripts/migrate-json-to-postgres.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Iniciando migração de dados...');
    
    // Ler db.json (backup deve estar no container ou montado como volume temporário)
    const dbPath = path.join(__dirname, '../db.json');
    
    if (!fs.existsSync(dbPath)) {
      throw new Error('db.json não encontrado. Certifique-se de que o arquivo está no container.');
    }
    
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    // Migrar usuários
    console.log('📦 Migrando usuários...');
    for (const usuario of dbData.usuarios || []) {
      await prisma.usuario.create({
        data: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          telefone: usuario.telefone,
          login: usuario.login,
          senha_hash: usuario.senha, // Será migrado na Fase 2
          cargo: usuario.cargo,
          notificar_email: usuario.notificar_email ?? true,
          notificar_telefone: usuario.notificar_telefone ?? false,
        }
      });
    }
    console.log(`✅ ${dbData.usuarios?.length || 0} usuários migrados`);
    
    // Migrar templates
    console.log('📦 Migrando templates...');
    for (const template of dbData.templates || []) {
      await prisma.template.create({
        data: {
          id: template.id,
          nome: template.nome,
          tempo_medio: template.tempo_medio,
          abas: template.abas,
          campos_preenchimento: template.campos_preenchimento,
          tarefas: template.tarefas,
        }
      });
    }
    console.log(`✅ ${dbData.templates?.length || 0} templates migrados`);
    
    // Migrar demandas (com relacionamentos)
    console.log('📦 Migrando demandas...');
    for (const demanda of dbData.demandas || []) {
      await prisma.demanda.create({
        data: {
          id: demanda.id,
          template_id: demanda.template_id,
          nome_demanda: demanda.nome_demanda,
          status: demanda.status,
          responsavel_id: demanda.responsavel_id,
          tempo_esperado: demanda.tempo_esperado,
          data_criacao: new Date(demanda.data_criacao),
          data_previsao: new Date(demanda.data_previsao),
          data_finalizacao: demanda.data_finalizacao ? new Date(demanda.data_finalizacao) : null,
          prazo: demanda.prazo ?? true,
          observacoes: demanda.observacoes || null,
          // Relacionamentos
          tarefas_status: {
            create: demanda.tarefas_status?.map(ts => ({
              id_tarefa: ts.id_tarefa,
              concluida: ts.concluida ?? false,
              responsavel_id: ts.responsavel_id || null,
            })) || []
          },
          campos_preenchidos: {
            create: demanda.campos_preenchidos?.map(cp => ({
              id_campo: cp.id_campo,
              valor: cp.valor,
            })) || []
          }
        }
      });
    }
    console.log(`✅ ${dbData.demandas?.length || 0} demandas migradas`);
    
    // Migrar ações
    console.log('📦 Migrando ações...');
    for (const acao of dbData.acoes || []) {
      await prisma.acao.create({
        data: {
          id: acao.id,
          nome: acao.nome,
          url: acao.url,
          campos: acao.campos,
        }
      });
    }
    console.log(`✅ ${dbData.acoes?.length || 0} ações migradas`);
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  }
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Executar Migração no Container

```bash
# 1. Copiar db.json para o container (temporariamente)
docker cp backend/db.json demand-flow-backend:/app/db.json

# 2. Executar script de migração dentro do container
docker exec -it demand-flow-backend node scripts/migrate-json-to-postgres.js

# 3. Validar dados migrados
docker exec -it demand-flow-backend npx prisma studio
# Ou via API: GET http://localhost:3000/api/demandas
```

**Alternativa**: Montar db.json como volume temporário apenas para migração:

```yaml
# No docker-compose.yml, temporariamente:
backend:
  volumes:
    - ./backend/db.json:/app/db.json:ro  # Read-only, apenas para migração
```

---

## ⚠️ Pontos de Atenção

### Antes de Começar
- [ ] Fazer backup completo do `db.json`
- [ ] Criar branch separado (`git checkout -b fase-1-postgresql`)
- [ ] Documentar estado atual do sistema
- [ ] Garantir que Docker está rodando

### Durante a Implementação (Docker)
- [ ] **TODOS** os comandos Prisma devem ser executados dentro do container:
  ```bash
  docker exec -it demand-flow-backend npx prisma <comando>
  ```
- [ ] Commits pequenos e frequentes
- [ ] Testar cada mudança antes de avançar
- [ ] Rebuild do container após mudanças no `package.json`:
  ```bash
  docker-compose up -d --build backend
  ```
- [ ] Validar queries Prisma antes de remover JSON-Server
- [ ] Manter frontend funcionando durante migração

### Comandos Prisma Úteis (Docker)

```bash
# Gerar Prisma Client
docker exec -it demand-flow-backend npm run prisma:generate

# Criar nova migration (durante desenvolvimento)
docker exec -it demand-flow-backend npm run prisma:migrate:dev -- --name nome_da_migration

# Aplicar migrations (produção)
docker exec -it demand-flow-backend npm run prisma:migrate

# Abrir Prisma Studio (visualizar dados)
docker exec -it demand-flow-backend npm run prisma:studio
# Acessar em: http://localhost:5555 (se porta exposta)

# Ver status das migrations
docker exec -it demand-flow-backend npx prisma migrate status
```

### Após Conclusão
- [ ] Testes de integração completos no Docker
- [ ] Validar migração de dados
- [ ] Remover referências ao `db.json` do código
- [ ] Documentar rollback plan
- [ ] Merge para branch principal apenas após validação completa

---

## 🧪 Testes de Validação

### Checklist de Testes (Docker)

Todos os testes devem ser executados com o sistema rodando em Docker:

```bash
# Subir todos os serviços
docker-compose up -d --build

# Verificar logs
docker-compose logs -f backend
```

**Testes via API** (http://localhost:3000/api):

- [ ] Criar usuário via API: `POST /api/usuarios`
- [ ] Criar template via API: `POST /api/templates`
- [ ] Criar demanda via API: `POST /api/demandas`
- [ ] Atualizar demanda via API: `PATCH /api/demandas/:id`
- [ ] Deletar demanda via API: `DELETE /api/demandas/:id`
- [ ] Listar demandas com filtros: `GET /api/demandas?status=Em Andamento`
- [ ] Validar foreign keys (não permitir demanda sem template)
- [ ] Validar cascade delete (deletar demanda deleta tarefas)
- [ ] Performance: query de 100+ demandas
- [ ] Performance: query com joins complexos

**Testes via Prisma Studio**:

```bash
# Abrir Prisma Studio no container
docker exec -it demand-flow-backend npm run prisma:studio

# Acessar via navegador (se porta exposta no compose)
# http://localhost:5555
```

**Validação de Conexão**:

```bash
# Testar conexão do backend ao PostgreSQL
docker exec -it demand-flow-backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ Conexão com PostgreSQL OK');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ Erro de conexão:', err);
  process.exit(1);
});
"
```

---

## 📚 Referências

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Prisma Migrate Guide](https://www.prisma.io/docs/guides/migrate)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

## 🚀 Fluxo Completo de Implementação (Resumo)

### 1. Preparação
```bash
# Criar branch
git checkout -b fase-1-postgresql

# Backup do db.json
cp backend/db.json backend/db.backup.json
```

### 2. Adicionar Dependências
```bash
# Editar backend/package.json manualmente
# Adicionar: "prisma": "^5.x.x", "@prisma/client": "^5.x.x"
```

### 3. Setup Inicial no Container
```bash
# Subir backend (sem postgres ainda, apenas para setup)
docker-compose up -d --build backend

# Inicializar Prisma dentro do container
docker exec -it demand-flow-backend npx prisma init

# Editar prisma/schema.prisma (fora do container, no editor)
# Criar schema completo
```

### 4. Adicionar PostgreSQL ao Compose
```bash
# Editar docker-compose.yml
# Adicionar serviço postgres e atualizar backend
```

### 5. Criar Primeira Migration
```bash
# Rebuild com postgres
docker-compose up -d --build

# Criar migration dentro do container
docker exec -it demand-flow-backend npm run prisma:migrate:dev -- --name init
```

### 6. Migrar Dados
```bash
# Copiar db.json para container
docker cp backend/db.json demand-flow-backend:/app/db.json

# Executar migração
docker exec -it demand-flow-backend node scripts/migrate-json-to-postgres.js
```

### 7. Atualizar Código Backend
```bash
# Migrar serviços para usar Prisma
# Remover JSON-Server
# Testar tudo
```

### 8. Validação Final
```bash
# Testes completos
# Validar que tudo funciona
# Commit e merge
```

---

**Próxima Fase**: [Fase 2: Login Completo](./PHASE_2_AUTH.md)  
**Voltar**: [Plano de Implementação](../IMPLEMENTATION_PHASES.md)

