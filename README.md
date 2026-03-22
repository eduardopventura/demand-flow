# 🚀 Demand Flow - Sistema de Gerenciamento de Demandas

Sistema completo de gerenciamento de demandas com interface Kanban, templates customizáveis, controle de tarefas e notificações automáticas.

**100% Dockerizado** 🐳

---

## 📋 Sobre o Projeto

O **Demand Flow** é uma solução moderna para gerenciamento de processos e demandas, desenvolvida para facilitar o acompanhamento de tarefas em equipe.

### Principais Funcionalidades

- 📊 **Quadro Kanban** - Interface drag & drop com colunas customizáveis
- 📝 **Templates Dinâmicos** - Modelos reutilizáveis com campos e tarefas personalizados
- ✅ **Gestão de Tarefas** - Com dependências e responsáveis individuais
- 📅 **Controle de Prazos** - Alertas visuais e notificações automáticas
- 🔔 **Notificações** - Email e WhatsApp para responsáveis
- 📈 **Relatórios** - Métricas de desempenho e cumprimento de prazos
- 📄 **Página de Finalizadas** - Consulta completa com filtros e ordenação
- 🎯 **Indicadores de Validação** - Feedback visual nas abas do formulário
- 💾 **Autosave** - Salvamento automático de alterações e uploads

---

## 🚀 Quick Start

### Opção 1: Usando Imagens do Docker Hub (Recomendado)

#### Pré-requisitos

- Docker e Docker Compose instalados

#### 1. Crie um diretório para o projeto

```bash
mkdir demand-flow
cd demand-flow
```

#### 2. Crie o arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
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

  backend:
    image: edpv/demand-flow-backend:latest
    container_name: demand-flow-backend
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./backend/.env:/app/.env
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://demandflow:demandflow_password@postgres:5432/demandflow
      - JWT_EXPIRES_IN=24h
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - demand-flow-network

  frontend:
    image: edpv/demand-flow-frontend:latest
    container_name: demand-flow-frontend
    restart: unless-stopped
    ports:
      - "3060:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - demand-flow-network

networks:
  demand-flow-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

#### 3. Crie a estrutura de diretórios e arquivo .env

```bash
mkdir -p uploads
touch .env
```

> ⚠️ **Importante:** O arquivo `.env` **DEVE ser criado antes** de subir o docker-compose. Ele deve estar na mesma pasta onde está o `docker-compose.yml` (raiz do projeto ou pasta `execution`).

#### 4. Execute o projeto

```bash
docker-compose up -d
```

Na primeira execução:
- O script `init-env.js` irá preencher o arquivo `.env` com valores padrão se estiver vazio
- O `JWT_SECRET` será gerado automaticamente pelo script `init-env.js`
- O banco de dados será inicializado com usuário admin padrão (login: `admin`, senha: `password`)
- O diretório `uploads` será criado automaticamente

#### 5. Acesse a aplicação

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3060 |
| Backend | Não exposto (acesso via frontend) |

**Credenciais padrão:**
- Login: `admin`
- Senha: `password`

> ⚠️ **Importante:** Altere a senha do usuário admin após o primeiro login!

> 💡 **Desenvolvimento Local:** Para desenvolvimento com build local, consulte [docs/DOCKER_HUB.md](./docs/DOCKER_HUB.md#desenvolvimento-local).

### Estrutura de Volumes

Os seguintes volumes são criados como bind mounts na pasta onde o `docker-compose.yml` está localizado:

- `./uploads` - Arquivos enviados pelos usuários
- `./.env` - Configurações do backend (deve ser criado antes de subir o compose)
- `postgres_data` - Dados do PostgreSQL (volume nomeado)

> 💡 **Nota sobre permissões:** Se encontrar erros de permissão ao salvar arquivos, você pode precisar ajustar o UID/GID no `docker-compose.yml`. Descomente a linha `user: "1000:1000"` e ajuste conforme necessário.

---

## ⚙️ Configuração .env

> ⚠️ **IMPORTANTE:** O arquivo `.env` **DEVE ser criado antes** de subir o docker-compose. Ele deve estar na mesma pasta onde está o `docker-compose.yml` (raiz do projeto ou pasta `execution`).

O script `init-env.js`:
- Preenche o arquivo `.env` com valores padrão se estiver vazio
- Gera um `JWT_SECRET` aleatório automaticamente se não existir
- Cria um template básico se `.env.example` não estiver disponível

Após a primeira execução, você pode editar o arquivo `./.env` para configurar os serviços de notificação (SMTP, WhatsApp, etc.).

### Variáveis Principais

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `SMTP_USER` | Email do remetente (SMTP) | Sim (para emails) |
| `SMTP_PASS` | Senha de app do email | Sim (para emails) |
| `WHATSAPP_WEBHOOK_URL` | URL do webhook n8n | Sim (para WhatsApp) |
| `JWT_SECRET` | Chave secreta JWT | Não (gerado automaticamente) |

### Configuração do Webhook WhatsApp

O webhook do WhatsApp deve seguir o formato documentado em [docs/WHATSAPP_WEBHOOK.md](./docs/WHATSAPP_WEBHOOK.md).

**Resumo:**
- URL do webhook configurada em `WHATSAPP_WEBHOOK_URL`
- Payload enviado: `{ telefone, mensagem, tipo, demanda, timestamp }`
- Formato do telefone: apenas dígitos (ex: `5561999999999`)

> ⚠️ **Importante:** Nunca commite o arquivo `.env` com credenciais reais!

---

## 📁 Estrutura do Projeto

```
demand-flow/
├── frontend/               # Frontend React
│   ├── src/                # Código fonte
│   │   ├── components/     # Componentes UI
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Serviços (API)
│   │   ├── contexts/       # Context API
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utilitários
│   ├── Dockerfile          # Build frontend
│   └── nginx.conf          # Config Nginx
├── backend/                # Backend Node.js
│   ├── prisma/             # Prisma schema e migrations
│   ├── services/           # Serviços (Email, WhatsApp, Auth, Socket)
│   ├── repositories/       # Camada de acesso a dados
│   ├── middlewares/        # Middlewares (auth, errors)
│   ├── server.js           # Servidor principal
│   └── Dockerfile          # Build backend
├── docs/                   # Documentação
└── docker-compose.yml      # Configuração Docker
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/README.md](./docs/README.md) | Índice da documentação e navegação |
| [docs/DOCKER.md](./docs/DOCKER.md) | Guia completo Docker e troubleshooting |
| [docs/DOCKER_HUB.md](./docs/DOCKER_HUB.md) | Build local das imagens Docker |
| [docs/WHATSAPP_WEBHOOK.md](./docs/WHATSAPP_WEBHOOK.md) | Documentação do webhook WhatsApp |
| [docs/FEATURES.md](./docs/FEATURES.md) | Funcionalidades detalhadas |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Histórico de versões |
| [docs/SECURITY.md](./docs/SECURITY.md) | Políticas de segurança |

---

## 🔮 Roadmap - Próximas Features

### Em Planejamento

| Feature | Descrição | Status |
|---------|-----------|--------|
| 📤 Exportação de Relatórios | PDF e Excel do dashboard | Planejado |
| 🔄 Recuperação de Senha | Envio de email com link de recuperação | Planejado |

Detalhes das features em [docs/FEATURES.md](./docs/FEATURES.md#-próximas-funcionalidades)

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, Socket.io Client
- **Backend:** Node.js, Express, PostgreSQL 16, Prisma ORM, Socket.io, JWT, bcrypt
- **Infra:** Docker, Docker Compose, Nginx
- **Notificações:** Nodemailer (SMTP), Webhook (WhatsApp)

---

## 📝 Versão Atual

**v1.3.0** - Março de 2026

Ver [CHANGELOG.md](./docs/CHANGELOG.md) para histórico completo.

---

> **Nota:** Este projeto usa PostgreSQL como banco de dados de produção. As imagens Docker estão disponíveis no Docker Hub: `edpv/demand-flow-backend` e `edpv/demand-flow-frontend`. Para desenvolvimento local, consulte [docs/DOCKER_HUB.md](./docs/DOCKER_HUB.md).
