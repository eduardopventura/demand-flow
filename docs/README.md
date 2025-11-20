# 📚 Documentação - Demand Flow

> **Documentação organizada e consolidada v2.3.0**

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

### 🌐 [DOMAIN_FIX.md](./DOMAIN_FIX.md) ⭐ NOVO
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
- Evolução do código (v1.0 → v2.3)
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

## 📄 Arquivos na Raiz

### [../README.md](../README.md)
Overview geral do projeto, quick start, stack

### [../CHANGELOG.md](../CHANGELOG.md)
Histórico de versões e mudanças

### [../SECURITY.md](../SECURITY.md)
Considerações de segurança, boas práticas

### [../MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)
(Duplicado em `docs/MIGRATION.md` para consistência)

---

## 🗂️ Estrutura Completa

```
demand-flow/
├── README.md                  ⭐ Comece aqui
├── CHANGELOG.md               📝 Histórico de versões
├── SECURITY.md                🔒 Segurança
├── MIGRATION_GUIDE.md         🔄 Migração (duplicado)
│
├── docs/                      📚 Documentação organizada
│   ├── README.md             📖 Este arquivo
│   ├── QUICK_GUIDE.md        ⚡ Referência rápida
│   ├── DOCKER.md             🐳 Guia Docker completo
│   ├── IMPLEMENTATION.md     📦 Histórico técnico
│   ├── MIGRATION.md          🔄 Migração PostgreSQL
│   │
│   └── archive/              🗄️ Documentos antigos
│       ├── API_INTEGRATION.md
│       ├── DOCKER_FIX.md
│       ├── DOCKER_GUIDE.md
│       ├── DOCKER_MVP.md
│       ├── IMPLEMENTATION_SUMMARY.md
│       ├── IMPROVEMENTS.md
│       ├── SIMPLIFICATION.md
│       ├── MIGRATION_COMPLETED.md
│       ├── QUICK_START.md
│       ├── QUICK_REFERENCE.md
│       ├── CONFIG.md
│       └── ... (referência histórica)
│
├── src/                       💻 Código fonte
├── backend/                   🔧 Backend JSON-Server
└── scripts/                   🛠️ Utilitários
```

---

## 🎯 Fluxo de Leitura Recomendado

### Novo no Projeto

1. **[../README.md](../README.md)** - Overview
2. **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** - Setup e primeiros passos
3. **[DOCKER.md](./DOCKER.md)** - Se tiver problemas
4. **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Entender arquitetura

### Desenvolvedor Ativo

- **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** - Referência diária
- **[../CHANGELOG.md](../CHANGELOG.md)** - Ver mudanças recentes
- **[DOCKER.md](./DOCKER.md)** - Troubleshooting

### Planejamento de Upgrade

- **[MIGRATION.md](./MIGRATION.md)** - Migração PostgreSQL
- **[../SECURITY.md](../SECURITY.md)** - Segurança
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Entender estado atual

---

## 📊 Consolidação

Esta estrutura consolidou **15+ arquivos .md dispersos** em **4 guias principais**:

| Antes | Depois | Benefício |
|-------|--------|-----------|
| 15 arquivos .md na raiz | 4 em `docs/` | Organização |
| Informação duplicada | Consolidada | Clareza |
| Difícil de navegar | Estrutura clara | Produtividade |
| Múltiplos guias Docker | 1 guia completo | Simplicidade |
| Histórico espalhado | 1 arquivo implementação | Contexto |

### Arquivos Consolidados

**DOCKER.md** ← 
- DOCKER_MVP.md
- DOCKER_GUIDE.md
- DOCKER_FIX.md
- REBUILD_FORCE.md

**IMPLEMENTATION.md** ←
- API_INTEGRATION.md
- IMPLEMENTATION_SUMMARY.md
- IMPROVEMENTS.md
- SIMPLIFICATION.md
- MIGRATION_COMPLETED.md
- SUMMARY.md

**QUICK_GUIDE.md** ←
- QUICK_START.md
- QUICK_REFERENCE.md
- CONFIG.md

**MIGRATION.md** ←
- MIGRATION_GUIDE.md (mantido na raiz também)

---

## 🔍 Busca Rápida

### Como fazer X?

| Tarefa | Documento |
|--------|-----------|
| Subir aplicação | [QUICK_GUIDE.md](./QUICK_GUIDE.md) |
| Mudar IP | [QUICK_GUIDE.md](./QUICK_GUIDE.md) → Configuração |
| Ambiente dev | [QUICK_GUIDE.md](./QUICK_GUIDE.md) → Comandos |
| Container não inicia | [DOCKER.md](./DOCKER.md) → Troubleshooting |
| Erro de conexão | [DOCKER.md](./DOCKER.md) → Troubleshooting |
| Entender arquitetura | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| Ver histórico | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| Migrar para PostgreSQL | [MIGRATION.md](./MIGRATION.md) |
| Segurança | [../SECURITY.md](../SECURITY.md) |

---

## ✨ Novidades v2.3.0

- ✅ Documentação consolidada (15 → 4 arquivos)
- ✅ Estrutura organizada (`docs/`)
- ✅ Arquivos antigos preservados (`docs/archive/`)
- ✅ Guias focados e completos
- ✅ Navegação clara
- ✅ Zero duplicação de conteúdo

---

## 🆘 Ajuda

**Não encontrou o que precisa?**

1. Consultar [QUICK_GUIDE.md](./QUICK_GUIDE.md) → seção Troubleshooting
2. Ver [DOCKER.md](./DOCKER.md) → seção Troubleshooting
3. Verificar [archive/](./archive/) → documentos antigos (referência histórica)

**Quer contribuir com a documentação?**

1. Manter estrutura de 4 guias principais
2. Evitar duplicação
3. Atualizar este README se adicionar novos docs
4. Preservar arquivos antigos em `archive/`

---

**Versão**: 2.3.0  
**Última atualização**: 2025-11-19  
**Status**: Documentação consolidada e organizada ✅

