# 🚀 Demand Flow - Sistema de Gerenciamento de Demandas

Sistema completo de gerenciamento de demandas com interface Kanban, templates customizáveis, controle de tarefas e notificações automáticas.

**100% Dockerizado** 🐳

---

## 📋 Sobre o Projeto

O **Demand Flow** é uma solução moderna para gerenciamento de processos e demandas, desenvolvida para facilitar o acompanhamento de tarefas em equipe.

### Principais Funcionalidades

- 📊 **Quadro Kanban** - Interface drag & drop para gerenciar demandas
- 📝 **Templates Dinâmicos** - Modelos reutilizáveis com campos e tarefas personalizados
- ✅ **Gestão de Tarefas** - Com dependências e responsáveis individuais
- 📅 **Controle de Prazos** - Alertas visuais e notificações automáticas
- 🔔 **Notificações** - Email e WhatsApp para responsáveis
- 📈 **Relatórios** - Métricas de desempenho e cumprimento de prazos

---

## 🚀 Quick Start

### Pré-requisitos

- Docker e Docker Compose instalados
- Git

### 1. Clone o repositório

```bash
git clone <seu-repo>
cd demand-flow
```

### 2. Configure as variáveis de ambiente

Crie o arquivo `backend/.env` (veja seção [Configuração .env](#-configuração-env)):

```bash
cp backend/.env.example backend/.env
# Edite o arquivo com suas credenciais
```

### 3. Suba os containers

```bash
docker-compose up -d --build
```

### 4. Acesse a aplicação

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:3060 |
| Backend | http://localhost:3000 |

---

## ⚙️ Configuração .env

O backend requer variáveis de ambiente para os serviços de notificação.

### Criar arquivo `backend/.env`

```env
# ===========================================
# CONFIGURAÇÕES DO SERVIDOR
# ===========================================
NODE_ENV=production
PORT=3000

# ===========================================
# SMTP - EMAIL (Zoho Mail)
# ===========================================
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=seu-email@dominio.com.br
SMTP_PASS=sua-senha-de-app
SMTP_FROM_NAME=Gestor de Demandas
SMTP_FROM_EMAIL=seu-email@dominio.com.br

# ===========================================
# WHATSAPP - WEBHOOK N8N
# ===========================================
WHATSAPP_WEBHOOK_URL=https://seu-n8n.com/webhook/demandas
WHATSAPP_ENABLED=true

# ===========================================
# CONFIGURAÇÕES FUTURAS (PostgreSQL)
# ===========================================
# DATABASE_URL=postgresql://user:password@localhost:5432/demandflow
# JWT_SECRET=sua-chave-secreta
```

### Variáveis Obrigatórias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SMTP_USER` | Email do remetente | `sistema@empresa.com.br` |
| `SMTP_PASS` | Senha de app do email | `abc123xyz` |
| `WHATSAPP_WEBHOOK_URL` | URL do webhook n8n | `https://n8n.empresa.com/webhook/xxx` |

> ⚠️ **Importante:** Nunca commite o arquivo `.env` com credenciais reais!

---

## 🐳 Estrutura Docker

```
┌─────────────────────────────────────────┐
│         Navegador (Cliente)             │
│    http://localhost:3060                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Frontend Container (Nginx)            │
│   - React + Vite build                  │
│   - Proxy /api → backend:3000           │
│   - Porta: 3060 → 80                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Backend Container (JSON-Server)       │
│   - Express + JSON-Server               │
│   - API REST + Lógica de Negócio        │
│   - Notificações (Email + WhatsApp)     │
│   - Porta: 3000                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Volume: backend/db.json               │
│   - Dados persistidos no host           │
└─────────────────────────────────────────┘
```

### Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar containers
docker-compose restart

# Parar tudo
docker-compose down

# Rebuild completo
docker-compose down && docker-compose up -d --build
```

---

## 📁 Estrutura do Projeto

```
demand-flow/
├── src/                    # Frontend React
│   ├── components/         # Componentes UI
│   ├── pages/              # Páginas da aplicação
│   ├── services/           # Serviços (API)
│   ├── contexts/           # Context API
│   ├── hooks/              # Custom hooks
│   ├── types/              # TypeScript types
│   └── utils/              # Utilitários
├── backend/                # Backend Node.js
│   ├── services/           # Serviços (Email, WhatsApp)
│   ├── db.json             # Banco de dados JSON
│   └── server.js           # Servidor principal
├── docs/                   # Documentação
└── docker-compose.yml      # Configuração Docker
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/README.md](./docs/README.md) | Índice da documentação e navegação |
| [docs/DOCKER.md](./docs/DOCKER.md) | Guia completo Docker e troubleshooting |
| [docs/FEATURES.md](./docs/FEATURES.md) | Funcionalidades detalhadas |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Histórico de versões |
| [docs/SECURITY.md](./docs/SECURITY.md) | Políticas de segurança |

---

## 🔮 Roadmap - Próximas Features

### Em Planejamento

| Feature | Descrição | Status |
|---------|-----------|--------|
| 🚫 Sistema de Cancelamento | Cancelar demandas com motivo e histórico | Planejado |
| ⚡ Sistema de Ações | Ações customizadas para tarefas | Planejado |
| 📎 Anexos Reais | Upload de arquivos em demandas | Planejado |
| 📊 Dashboard Reestruturado | Métricas avançadas e gráficos | Planejado |
| 📤 Exportação de Relatórios | PDF e Excel do dashboard | Planejado |
| 🔐 Sistema de Login | Autenticação + PostgreSQL | Planejado |

Detalhes das features em [docs/FEATURES.md](./docs/FEATURES.md#-próximas-funcionalidades)

---

## 🛠️ Stack Tecnológico

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express, JSON-Server
- **Infra:** Docker, Docker Compose, Nginx
- **Notificações:** Nodemailer (SMTP), Webhook (WhatsApp)

---

## 📝 Versão Atual

**v2.6.0** - 06 de Dezembro de 2025

Ver [CHANGELOG.md](./docs/CHANGELOG.md) para histórico completo.

---

> **Nota:** Este projeto usa JSON-Server como banco de dados MVP. Migração para PostgreSQL planejada para versões futuras.
