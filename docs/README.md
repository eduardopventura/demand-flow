# 📚 Documentação - Demand Flow

> **Documentação organizada e consolidada - Última atualização: v2.5.0**

---

## 🎯 Início Rápido

| Documento | Descrição | Para Quem |
|-----------|-----------|-----------|
| **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** ⭐ | Setup rápido e referência diária | Todos |
| **[FEATURES.md](./FEATURES.md)** | Funcionalidades do sistema | Usuários |
| **[releases/v2.5.0/](./releases/v2.5.0/)** 🆕 | Documentação da versão atual | Todos |

---

## 📦 Releases e Versões

### **[releases/](./releases/)** - Documentação de Versões

Documentação completa de cada versão do sistema.

**Versão Atual: v2.5.0** (24/11/2025)
- [CHANGELOG](./releases/v2.5.0/CHANGELOG.md) - Detalhes técnicos
- [RELEASE_NOTES](./releases/v2.5.0/RELEASE_NOTES.md) - Guia do usuário  
- [SUMMARY](./releases/v2.5.0/SUMMARY.md) - Resumo executivo
- [DOCUMENTATION_INDEX](./releases/v2.5.0/DOCUMENTATION_INDEX.md) - Índice completo

[Ver Todas as Versões →](./releases/)

---

## 📖 Guias Principais

### 🚀 [QUICK_GUIDE.md](./QUICK_GUIDE.md)
**Para: Primeiros passos e referência diária**

- Quick Start (setup em 3 passos)
- Comandos rápidos (prod e dev)
- Configuração (IP, portas, ambientes)
- Troubleshooting rápido
- Casos de uso comuns

**Quando ler**: Primeiro contato, referência diária

---

### 🎯 [FEATURES.md](./FEATURES.md)
**Para: Conhecer as funcionalidades do sistema**

- Sistema de Prazos (v2.4.0)
- Indicadores visuais coloridos
- Controle de datas
- Templates e tarefas
- Quadro Kanban
- Relatórios

**Quando ler**: Entender o que o sistema faz, onboarding de usuários

---

### 🐳 [DOCKER.md](./DOCKER.md)
**Para: Tudo sobre Docker**

- Arquitetura dos containers
- Comandos avançados
- Troubleshooting detalhado
- Rebuild e manutenção
- Deploy em servidor
- Monitoramento

**Quando ler**: Setup avançado, problemas com Docker, deploy

---

### 🌐 [DOMAIN_FIX.md](./DOMAIN_FIX.md)
**Para: Correção de CORS/Proxy ao usar domínio**

- Problema: Funciona via IP mas não via domínio
- Solução: Nginx Proxy + API adaptativa
- CORS e Mixed Content resolvidos
- Troubleshooting HTTPS
- Checklist completo

**Quando ler**: Se tiver problemas ao acessar via domínio custom

---

### 📦 [IMPLEMENTATION.md](./IMPLEMENTATION.md)
**Para: Detalhes técnicos e histórico**

- Arquitetura completa
- Evolução do código (v1.0 → v2.5)
- Stack tecnológica
- Decisões de design
- Métricas e melhorias

**Quando ler**: Onboarding técnico, entender decisões arquiteturais

---

### 🔄 [MIGRATION.md](./MIGRATION.md)
**Para: Migração futura para PostgreSQL**

- Estratégia de migração
- O que muda / O que não muda
- Prisma schema
- Docker com PostgreSQL
- Autenticação JWT
- Plano passo a passo

**Quando ler**: Planejamento de upgrade para produção

---

## 📄 Arquivos na Raiz do Projeto

### [../README.md](../README.md)
Overview geral do projeto, quick start, stack tecnológica

### [../VERSAO_ATUAL.txt](../VERSAO_ATUAL.txt)
Informação rápida da versão atual e mudanças principais

### [../CHANGELOG.md](../CHANGELOG.md)
Histórico completo de todas as versões

### [../SECURITY.md](../SECURITY.md)
Considerações de segurança e boas práticas

---

## 🎯 Recomendações de Leitura

### Novo no Projeto?
**Sequência:**
1. [../README.md](../README.md) (5 min) - Overview
2. [../VERSAO_ATUAL.txt](../VERSAO_ATUAL.txt) (1 min) - Versão atual
3. [QUICK_GUIDE.md](./QUICK_GUIDE.md) (10 min) - Setup
4. [FEATURES.md](./FEATURES.md) (5 min) - Funcionalidades
5. [releases/v2.5.0/RELEASE_NOTES.md](./releases/v2.5.0/RELEASE_NOTES.md) (15 min) - Últimas mudanças

**Total: ~35 minutos para estar produtivo**

---

### Conhece o Projeto e Quer Saber as Novidades?
**Sequência rápida:**
1. [../VERSAO_ATUAL.txt](../VERSAO_ATUAL.txt) (1 min)
2. [releases/v2.5.0/RELEASE_NOTES.md](./releases/v2.5.0/RELEASE_NOTES.md) (5 min)

**Total: ~6 minutos**

---

### Referência Diária?
**Documento principal:**
- [QUICK_GUIDE.md](./QUICK_GUIDE.md)

**Marcar como favorito** no seu editor

---

### Troubleshooting?
**90% dos problemas:**
1. [QUICK_GUIDE.md](./QUICK_GUIDE.md) - Seção Troubleshooting
2. [DOCKER.md](./DOCKER.md) - Troubleshooting detalhado

**Problemas com domínio custom:**
- [DOMAIN_FIX.md](./DOMAIN_FIX.md)

---

### Desenvolvimento e Manutenção?
**Documentos técnicos:**
- [releases/v2.5.0/CHANGELOG.md](./releases/v2.5.0/CHANGELOG.md) - Detalhes técnicos
- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Arquitetura
- [MIGRATION.md](./MIGRATION.md) - Plano futuro (PostgreSQL)

---

### Gestão e Apresentações?
**Resumos executivos:**
- [releases/v2.5.0/SUMMARY.md](./releases/v2.5.0/SUMMARY.md) - Métricas e impactos
- [releases/](./releases/) - Histórico de versões

---

## 🏗️ Estrutura da Documentação

```
docs/
├── README.md              ← Você está aqui (índice principal)
│
├── 📖 Guias de Uso
│   ├── QUICK_GUIDE.md     ⭐ Setup e referência diária
│   ├── FEATURES.md        Funcionalidades do sistema
│   └── DOMAIN_FIX.md      Fix domínio custom
│
├── 🔧 Guias Técnicos
│   ├── DOCKER.md          Docker e containers
│   ├── IMPLEMENTATION.md  Arquitetura e decisões
│   └── MIGRATION.md       Plano PostgreSQL
│
└── 📦 Releases
    └── releases/
        ├── README.md           Histórico de versões
        └── v2.5.0/             ⭐ Versão atual
            ├── CHANGELOG.md            Detalhes técnicos
            ├── RELEASE_NOTES.md        Guia do usuário
            ├── SUMMARY.md              Resumo executivo
            └── DOCUMENTATION_INDEX.md  Índice completo
```

---

## 💡 Dicas de Navegação

1. **Use Ctrl+F** (ou Cmd+F) para buscar nos documentos
2. **Comece pelo README principal** no topo do projeto
3. **Use QUICK_GUIDE.md** como referência diária
4. **Consulte releases/** para ver mudanças de versões
5. **Marque como favorito** os documentos que você mais usa

---

## 📊 Estatísticas da Documentação

- **Guias de Uso:** 3 documentos
- **Guias Técnicos:** 3 documentos  
- **Releases Documentadas:** 1 versão (v2.5.0)
- **Total:** ~3,500 linhas de documentação organizada

---

## 🔄 Histórico de Organização

- **v2.5.0** (24/11/2025): Estrutura de releases criada, archive removido
- **v2.3.1** (19/11/2025): Consolidação inicial, criação de docs/
- **v2.3.0** (Nov/2025): Primeira organização da documentação

---

**Última Atualização**: 24/11/2025  
**Versão**: 2.5.0  
**Status**: Documentação Completa e Organizada ✅
