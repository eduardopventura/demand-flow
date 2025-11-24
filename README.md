# 🚀 Demand Flow - Sistema de Gerenciamento de Demandas

Sistema completo de gerenciamento de demandas com interface Kanban, templates customizáveis e controle de tarefas.

**100% dockerizado e pronto para produção!** 🐳

> **🎯 v2.5.0 - Gestão Inteligente**: Prazos individualizados por demanda, responsável por tarefa, design limpo e ordenação automática. Sistema testado e aprovado! ✅

---

## 📚 Documentação

> **Nova estrutura organizada em `docs/` - v2.3.0** ✨

### Guias Principais

| Documento | Descrição | Quando Usar |
|-----------|-----------|-------------|
| **[docs/QUICK_GUIDE.md](./docs/QUICK_GUIDE.md)** ⭐ | Quick start, comandos, configuração | Setup inicial e referência diária |
| **[docs/DOCKER.md](./docs/DOCKER.md)** 🐳 | Tudo sobre Docker e containers | Troubleshooting, deploy |
| **[docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)** 📦 | Histórico técnico e arquitetura | Entender decisões técnicas |
| **[docs/MIGRATION.md](./docs/MIGRATION.md)** 🔄 | Migração para PostgreSQL | Planejamento de upgrade |

### Outros Documentos

| Documento | Descrição |
|-----------|-----------|
| **[VERSAO_ATUAL.txt](./VERSAO_ATUAL.txt)** ⭐ | Versão atual e mudanças principais |
| **[CHANGELOG.md](./CHANGELOG.md)** | Histórico de todas as versões |
| **[SECURITY.md](./SECURITY.md)** | Considerações de segurança |
| **[docs/](./docs/)** 📚 | Documentação completa e organizada |
| **[docs/releases/v2.5.0/](./docs/releases/v2.5.0/)** 🆕 | Release atual (changelog, notes, summary) |
| **[docs/releases/](./docs/releases/)** | Histórico de todas as releases |

---

## 🚀 Quick Start com Docker

### 1. Configure o IP (Se Necessário)

**Padrão**: `192.168.1.4:3000`

Se seu IP for diferente, edite:
```typescript
// src/services/api.service.ts (linha ~17)
const API_URL = "http://SEU-IP:3000/api";
```

### 2. Subir Aplicação

```bash
# Clonar e entrar no diretório
git clone <seu-repo>
cd demand-flow

# Subir serviços (produção)
docker-compose up -d --build

# Acessar (substitua pelo seu IP)
# Frontend: http://192.168.1.4:3060
# Backend:  http://192.168.1.4:3000
```

### 3. Ambiente Dev Paralelo (Opcional)

Para testes sem afetar produção:
```bash
./scripts/start.sh dev

# Acessa em portas diferentes:
# Frontend DEV: http://192.168.1.4:3061
# Backend DEV:  http://192.168.1.4:3001
```

**Pronto! Aplicação rodando! 🎉**

> 💡 **Filosofia**: Simples e direto. IP hardcoded, sem auto-detecção complexa. Adequado para MVP/projetos pequenos.

---

## 📋 Funcionalidades

### Core Features
- ✅ **Quadro Kanban** com drag & drop
- ✅ **Templates customizáveis** com campos dinâmicos e tempo esperado
- ✅ **Controle de tarefas** com dependências
- ✅ **Gerenciamento de usuários**
- ✅ **Relatórios e gráficos** de desempenho
- ✅ **Priorização** de demandas
- ✅ **Campos personalizados** (texto, número, data, arquivo, dropdown)
- ✅ **Controle de prazos** com indicadores visuais coloridos
- ✅ **Rastreamento de datas** (criação e finalização)
- ✅ **Indicadores visuais** (🟢 verde, 🟡 amarelo, 🔴 vermelho) baseados no status do prazo

### Infraestrutura
- ✅ **100% Docker** - Deploy em qualquer lugar
- ✅ **JSON-Server MVP** - Backend simples e eficiente
- ✅ **API REST** - Todas operações CRUD
- ✅ **Nginx** - Frontend otimizado
- ✅ **Health Checks** - Monitoramento automático
- ✅ **Volumes persistentes** - Dados seguros

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18
- TypeScript (strict mode)
- Vite
- TailwindCSS
- shadcn/ui
- React Router
- @dnd-kit (drag & drop)
- Zod (validações)
- Recharts (gráficos)
- React Query

### Backend (MVP)
- JSON-Server
- Express
- CORS

### Infraestrutura
- Docker & Docker Compose
- Nginx
- Multi-stage builds

### Futuro (Upgrade)
- PostgreSQL
- Prisma ORM
- Redis (cache)
- WebSockets

---

## 🏗️ Arquitetura

### Estrutura de Pastas

```
demand-flow/
├── 🐳 Docker
│   ├── docker-compose.yml          # Orquestração
│   ├── docker-compose.dev.yml      # Dev overrides
│   ├── Dockerfile                  # Frontend image
│   ├── Dockerfile.dev              # Frontend dev
│   └── nginx.conf                  # Nginx config
│
├── 🔧 Backend (JSON-Server MVP)
│   └── backend/
│       ├── server.js               # API server
│       ├── db.json                 # Database
│       ├── Dockerfile              # Backend image
│       └── scripts/seed.js         # Reset DB
│
├── 🎨 Frontend (React + TS)
│   └── src/
│       ├── components/             # React components
│       ├── pages/                  # Pages
│       ├── services/
│       │   ├── api.service.ts      # API layer ⭐
│       │   └── storage.service.ts
│       ├── types/                  # TypeScript types
│       ├── constants/              # Constants
│       ├── schemas/                # Zod validations
│       ├── hooks/                  # Custom hooks
│       ├── contexts/               # React Context
│       └── utils/                  # Utilities
│
├── 📜 Scripts
│   └── scripts/
│       ├── start.sh                # Start services
│       ├── stop.sh                 # Stop services
│       └── reset-db.sh             # Reset database
│
└── 📚 Documentação
    ├── DOCKER_MVP.md               # ⭐ Comece aqui
    ├── DOCKER_GUIDE.md
    ├── MIGRATION_GUIDE.md
    ├── IMPLEMENTATION_SUMMARY.md
    └── ... (outros)
```

### Fluxo de Dados

```
Browser → Nginx:8080 → React App → api.service.ts → JSON-Server:3000 → db.json
```

---

## 🔧 Desenvolvimento

### Comandos Docker

```bash
# Subir serviços
docker-compose up -d                    # Produção
./scripts/start.sh dev                  # Desenvolvimento

# Parar serviços
docker-compose down                     # Parar
./scripts/stop.sh                       # Parar (script)

# Ver logs
docker-compose logs -f                  # Todos
docker-compose logs -f backend          # Backend apenas
docker-compose logs -f frontend         # Frontend apenas

# Rebuild
docker-compose up -d --build            # Rebuild tudo
docker-compose up -d --build backend    # Rebuild backend

# Shell nos containers
docker-compose exec backend sh
docker-compose exec frontend sh

# Database
./scripts/reset-db.sh                   # Resetar para estado inicial
```

### Sem Docker (Local)

```bash
# Backend
cd backend
npm install
npm run dev         # Porta 3000

# Frontend (em outro terminal)
npm install
npm run dev         # Porta 8080
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Recursos Disponíveis

**Usuários**
- `GET /api/usuarios` - Listar todos
- `POST /api/usuarios` - Criar novo
- `PATCH /api/usuarios/:id` - Atualizar
- `DELETE /api/usuarios/:id` - Deletar

**Templates**
- `GET /api/templates` - Listar todos
- `POST /api/templates` - Criar novo
- `PATCH /api/templates/:id` - Atualizar
- `DELETE /api/templates/:id` - Deletar

**Demandas**
- `GET /api/demandas` - Listar todas
- `POST /api/demandas` - Criar nova
- `PATCH /api/demandas/:id` - Atualizar
- `DELETE /api/demandas/:id` - Deletar

**Utilitários**
- `GET /health` - Health check
- `POST /api/auth/login` - Login (mock)

Ver **[backend/README.md](./backend/README.md)** para detalhes completos.

---

## 📊 Melhorias Implementadas

### v2.4.0 - Sistema de Prazos ✅ NOVO!
- ✅ Controle de prazos nas demandas
- ✅ Tempo esperado configurável por template
- ✅ Indicadores visuais coloridos (verde/amarelo/vermelho)
- ✅ Rastreamento de datas (criação e finalização)
- ✅ Exibição otimizada (primeiro nome do responsável)
- ✅ Cálculo automático de status do prazo

### v2.0 - Refatoração Completa ✅
- ✅ TypeScript strict mode
- ✅ Arquitetura organizada
- ✅ Validações Zod
- ✅ Performance otimizada
- ✅ Error Boundary
- ✅ Custom hooks
- ✅ Documentação completa

### v2.1 - Docker + Backend MVP ✅
- ✅ Docker Compose completo
- ✅ JSON-Server backend
- ✅ API REST completa
- ✅ Nginx otimizado
- ✅ Scripts de desenvolvimento
- ✅ Migration path para PostgreSQL

### v2.2 - API Integration ✅
- ✅ DataContext migrado para API
- ✅ Loading states implementados
- ✅ Error handling robusto
- ✅ Fallback automático localStorage
- ✅ Toast notifications
- ✅ Cache inteligente
- ✅ Sistema fullstack completo

Ver **[API_INTEGRATION.md](./API_INTEGRATION.md)** e **[MIGRATION_COMPLETED.md](./MIGRATION_COMPLETED.md)** para detalhes da migração.

Ver também **[IMPROVEMENTS.md](./IMPROVEMENTS.md)** e **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**.

---

## 🔄 Migration Path

### Fase 1: MVP Atual ✅
```
JSON-Server → db.json
```
- Desenvolvimento rápido
- Setup simples
- Perfeito para MVP

### Fase 2: PostgreSQL (Futuro)
```
Express/Fastify → Prisma → PostgreSQL
```
- Produção robusta
- Escalabilidade
- Relações complexas

**Ver [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) para passo-a-passo completo.**

---

## 🔒 Segurança

### Status Atual
⚠️ **MVP/Desenvolvimento**
- Senhas em texto plano (OK para dev)
- Sem autenticação real (mock apenas)
- CORS aberto

### Produção TODO
- Implementar JWT
- Hash de senhas (bcrypt)
- HTTPS/SSL
- Rate limiting
- Input sanitization

**Ver [SECURITY.md](./SECURITY.md) para guia completo.**

---

## 🚀 Deploy

### Requisitos
- Docker e Docker Compose instalados
- Servidor com Docker (AWS, DigitalOcean, etc)

### Deploy Simples

```bash
# No servidor
git clone <repo>
cd demand-flow
docker-compose up -d --build

# Configurar domínio (opcional)
# Configurar SSL com Let's Encrypt
# Configurar backup automático
```

### Deploy Avançado
- Kubernetes (quando escalar)
- CI/CD (GitHub Actions)
- Monitoring (Prometheus + Grafana)
- Load Balancing (Nginx/Traefik)

---

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Editar docker-compose.yml
ports:
  - "3001:3000"  # Mudar porta externa
```

### Container não inicia
```bash
docker-compose logs backend
docker-compose up --build --force-recreate
```

### Database vazio
```bash
./scripts/reset-db.sh
```

**Ver [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) para troubleshooting completo.**

---

## 📦 Requisitos

### Para Rodar
- Docker 20.10+
- Docker Compose 2.0+

### Para Desenvolver (opcional)
- Node.js 18+
- npm ou yarn

## Project info

**URL**: https://lovable.dev/projects/b9306f0b-8995-4deb-b618-d823b5fcd334

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b9306f0b-8995-4deb-b618-d823b5fcd334) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b9306f0b-8995-4deb-b618-d823b5fcd334) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
