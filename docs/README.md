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
│   ├── server.js               # Servidor Express + JSON-Server
│   ├── db.json                 # Banco de dados (JSON)
│   ├── services/               # Serviços do backend
│   │   ├── email.service.js    # Envio de emails (SMTP)
│   │   ├── whatsapp.service.js # WhatsApp via webhook
│   │   └── notification.service.js # Orquestrador de notificações
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
| **JSON-Server** | 0.17.x | REST API mock |
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

**Versão:** 2.6.0  
**Última Atualização:** 07/12/2025
