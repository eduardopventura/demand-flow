# 🚀 Demand Flow - Sistema de Gerenciamento de Demandas

Sistema completo de gerenciamento de demandas com interface Kanban, templates customizáveis e controle de tarefas.

**100% dockerizado e pronto para produção!** 🐳

---

## 📋 Sobre o Projeto

O Demand Flow é uma solução moderna para gerenciamento de processos e demandas, oferecendo:

- **Quadro Kanban** interativo (Drag & Drop)
- **Templates Dinâmicos** para diferentes tipos de processos
- **Gestão de Tarefas** com dependências e responsáveis
- **Controle de Prazos** visual e intuitivo
- **Relatórios** automáticos de desempenho

## 🛠️ Stack Tecnológico

- **Frontend:** React 18, TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend:** JSON-Server (MVP), Express
- **Infraestrutura:** Docker, Docker Compose, Nginx

## 📚 Documentação

Toda a documentação técnica detalhada encontra-se na pasta `docs/`:

- **[Guia Rápido](./docs/QUICK_GUIDE.md)** - Como começar em 5 minutos
- **[Guia Docker](./docs/DOCKER.md)** - Comandos e configuração de containers
- **[Migração](./docs/MIGRATION.md)** - Upgrade para PostgreSQL
- **[Arquitetura](./docs/IMPLEMENTATION.md)** - Detalhes de implementação

## 🚀 Quick Start (Desenvolvimento)

Para rodar o ambiente de desenvolvimento com hot-reload:

```bash
./scripts/start.sh dev
```

Acesse:
- **Frontend:** http://localhost:3061
- **Backend:** http://localhost:3001

## 🔒 Segurança

Verifique **[SECURITY.md](./docs/SECURITY.md)** para detalhes sobre a implementação atual de segurança e roadmap.

## 📝 Changelog

Acompanhe as mudanças em **[CHANGELOG.md](./docs/CHANGELOG.md)**.

---

> **Nota:** Este projeto foi desenvolvido com foco em simplicidade e deploy rápido via Docker.
