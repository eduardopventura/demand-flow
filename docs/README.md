# 📚 Documentação - Demand Flow

Bem-vindo à documentação técnica do projeto. Este documento serve como índice de navegação.

---

## 📁 Estrutura do Projeto

```
demand-flow/
├── 📂 src/                     # Código-fonte Frontend
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes shadcn/ui
│   │   ├── kanban/             # Componentes do Kanban
│   │   └── modals/             # Modais da aplicação
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Index.tsx           # Home (redireciona)
│   │   ├── PainelDemandas.tsx  # Quadro Kanban
│   │   ├── Templates.tsx       # Gerenciar templates
│   │   ├── Usuarios.tsx        # Gerenciar usuários
│   │   └── Relatorios.tsx      # Dashboard de relatórios
│   ├── services/               # Serviços
│   │   ├── api.service.ts      # Comunicação com API
│   │   └── storage.service.ts  # Abstração localStorage
│   ├── contexts/               # Context API
│   │   └── DataContext.tsx     # Estado global da aplicação
│   ├── hooks/                  # Custom Hooks
│   ├── types/                  # TypeScript types/interfaces
│   ├── schemas/                # Validações Zod
│   ├── utils/                  # Funções utilitárias
│   ├── constants/              # Constantes da aplicação
│   └── lib/                    # Bibliotecas auxiliares
│
├── 📂 backend/                 # Código-fonte Backend
│   ├── server.js               # Servidor Express + Socket.io
│   ├── prisma/                  # Prisma schema e migrations
│   │   ├── schema.prisma       # Schema do banco de dados
│   │   └── migrations/         # Migrations do Prisma
│   ├── services/               # Serviços do backend
│   │   ├── email.service.js    # Envio de emails (SMTP)
│   │   ├── whatsapp.service.js # WhatsApp via webhook
│   │   ├── notification.service.js # Orquestrador de notificações
│   │   ├── auth.service.js     # Autenticação (JWT + bcrypt)
│   │   └── socket.service.js   # WebSockets (Socket.io)
│   ├── repositories/           # Camada de acesso a dados
│   ├── middlewares/            # Middlewares (auth, errors)
│   ├── scripts/
│   │   └── seed.js             # Script para popular dados
│   └── Dockerfile              # Build do container
│
├── 📂 docs/                    # Documentação
│   ├── README.md               # Este arquivo (índice)
│   ├── FEATURES.md             # Funcionalidades detalhadas
│   ├── DOCKER.md               # Guia Docker completo
│   ├── CHANGELOG.md            # Histórico de versões
│   └── SECURITY.md             # Políticas de segurança
│
├── 📂 public/                  # Assets públicos
│   ├── favicon.ico             # Favicon
│   └── *.png                   # Ícones PWA
│
├── 📄 docker-compose.yml       # Configuração Docker
├── 📄 Dockerfile               # Build frontend
├── 📄 nginx.conf               # Config Nginx
├── 📄 vite.config.ts           # Config Vite
├── 📄 tailwind.config.ts       # Config Tailwind
└── 📄 README.md                # Documentação principal
```

---

## 🛠️ Stack Tecnológica

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **React** | 18.x | Biblioteca UI |
| **TypeScript** | 5.x | Tipagem estática |
| **Vite** | 5.x | Build tool |
| **TailwindCSS** | 3.x | Framework CSS |
| **shadcn/ui** | - | Componentes UI |
| **React Query** | 5.x | Gerenciamento de estado servidor |
| **Zod** | 3.x | Validação de schemas |
| **date-fns** | 3.x | Manipulação de datas |
| **@dnd-kit** | - | Drag and Drop |
| **Lucide React** | - | Ícones |
| **Recharts** | - | Gráficos |

### Backend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Node.js** | 20.x | Runtime JavaScript |
| **Express** | 4.x | Framework HTTP |
| **PostgreSQL** | 16.x | Banco de dados relacional |
| **Prisma** | 5.x | ORM e migrations |
| **Socket.io** | 4.x | WebSockets para tempo real |
| **JWT** | 9.x | Autenticação e autorização |
| **bcrypt** | 5.x | Hash de senhas |
| **Nodemailer** | 6.x | Envio de emails |
| **node-cron** | 3.x | Agendamento de tarefas |

### Infraestrutura

| Tecnologia | Descrição |
|------------|-----------|
| **Docker** | Containerização |
| **Docker Compose** | Orquestração de containers |
| **Nginx** | Servidor web / Reverse proxy |

---

## 📖 Índice de Documentação

### 📌 Documentos Principais

| Documento | Descrição |
|-----------|-----------|
| [README.md](../README.md) | Visão geral e Quick Start |
| [FEATURES.md](./FEATURES.md) | Funcionalidades atuais e planejadas |
| [DOCKER.md](./DOCKER.md) | Guia completo Docker e troubleshooting |
| [CHANGELOG.md](./CHANGELOG.md) | Histórico de versões |
| [SECURITY.md](./SECURITY.md) | Políticas de segurança |

### 🔧 Documentação Técnica

| Documento | Descrição |
|-----------|-----------|
| [backend/REFACTORING.md](./backend/REFACTORING.md) | Detalhes da refatoração do Backend |
| [frontend/DESIGN_SYSTEM.md](./frontend/DESIGN_SYSTEM.md) | **Padrões de Design Visual e UI** |
| [frontend/HOOKS.md](./frontend/HOOKS.md) | Documentação dos Custom Hooks |
| [frontend/COMPONENTS_FORM.md](./frontend/COMPONENTS_FORM.md) | Documentação de Componentes de Formulário |
| [frontend/DASHBOARD.md](./frontend/DASHBOARD.md) | Documentação do Dashboard de Relatórios |
| [frontend/FINALIZADAS.md](./frontend/FINALIZADAS.md) | Documentação da Página de Finalizadas |

### 🚀 Implementação Versão 1.0

| Documento | Descrição |
|-----------|-----------|
| [IMPLEMENTATION_PHASES.md](./IMPLEMENTATION_PHASES.md) | **Plano Geral de Implementação - Fases e Progresso** |
| [implementation/PHASE_1_POSTGRESQL.md](./implementation/PHASE_1_POSTGRESQL.md) | Fase 1: Migração PostgreSQL |
| [implementation/PHASE_2_AUTH.md](./implementation/PHASE_2_AUTH.md) | Fase 2: Login Completo |
| [implementation/PHASE_3_TASK_USER.md](./implementation/PHASE_3_TASK_USER.md) | Fase 3: Controle de Responsáveis e Auditoria |
| [implementation/PHASE_4_ROLES.md](./implementation/PHASE_4_ROLES.md) | Fase 4: Sistema de Cargos e Permissões |
| [implementation/PHASE_5_WEBSOCKETS.md](./implementation/PHASE_5_WEBSOCKETS.md) | Fase 5: WebSockets (Tempo Real) |

### 🔗 Links Rápidos

- **Subir ambiente:** `docker-compose up -d --build`
- **Ver logs:** `docker-compose logs -f`
- **Frontend:** http://localhost:3060
- **Backend:** http://localhost:3000

---

## 🧭 Navegação por Funcionalidade

### Onde encontrar o código de cada feature?

| Feature | Frontend | Backend |
|---------|----------|---------|
| Quadro Kanban | `src/pages/PainelDemandas.tsx`, `src/components/kanban/` | - |
| Finalizadas | `src/pages/Finalizadas.tsx` | - |
| Templates | `src/pages/Templates.tsx`, `src/components/modals/EditorTemplateModal.tsx` | - |
| Demandas | `src/components/modals/NovaDemandaModal.tsx`, `DetalhesDemandaModal.tsx` | `backend/server.js` |
| Usuários | `src/pages/Usuarios.tsx` | - |
| Relatórios | `src/pages/Relatorios.tsx` | - |
| Notificações | - | `backend/services/` |
| API | `src/services/api.service.ts` | `backend/server.js` |
| Tipos | `src/types/index.ts` | - |
| Validações | `src/schemas/validation.schemas.ts` | - |
| Cálculo de Prazos | `src/utils/prazoUtils.ts` | - |

---

## 🎯 Padrões do Projeto

### Código

- **TypeScript Strict Mode** habilitado
- **Enums** para valores fixos (Status, Prioridade)
- **Validação Zod** em formulários
- **React Query** para estado do servidor
- **Context API** para estado global

### Estilo

- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes base
- **Mobile-first** responsive design
- **CSS Variables** para temas (index.css)
- **Design System** documentado em [frontend/DESIGN_SYSTEM.md](./frontend/DESIGN_SYSTEM.md)

### Git

- **Conventional Commits** para mensagens
- **Feature Branch** workflow

---

## 🔧 Comandos Úteis

### Docker

```bash
# Subir projeto
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down
```

### Manutenção

```bash
# Backup do banco
cp backend/db.json backend/db.backup.json

# Rebuild sem cache
docker-compose build --no-cache

# Limpar tudo
docker system prune -a
```

---

## 📝 Contribuindo

1. Documentação sempre em `docs/`
2. Mantenha links relativos atualizados
3. Siga padrão Markdown
4. Atualize CHANGELOG.md para mudanças significativas

---

**Versão:** 1.0.0  
**Última Atualização:** 18/12/2025
