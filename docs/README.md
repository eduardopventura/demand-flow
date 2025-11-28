# 📚 Documentação do Projeto

Bem-vindo à documentação técnica do **Demand Flow**. Aqui você encontrará detalhes aprofundados sobre a arquitetura, configuração e desenvolvimento do sistema.

## 📂 Índice de Documentação

### 🚀 Guias Iniciais
- **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** - Guia rápido de instalação e uso
- **[DOCKER.md](./DOCKER.md)** - Guia completo sobre a infraestrutura Docker

### 🏗️ Arquitetura e Implementação
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Visão geral da arquitetura e decisões técnicas
- **[FEATURES.md](./FEATURES.md)** - Detalhamento das funcionalidades implementadas
- **[ESTRUTURA_DOCUMENTACAO.md](./ESTRUTURA_DOCUMENTACAO.md)** - Guia sobre a organização da documentação

### 🔄 Manutenção e Evolução
- **[MIGRATION.md](./MIGRATION.md)** - Guia de migração para PostgreSQL (Futuro)
- **[DOMAIN_FIX.md](./DOMAIN_FIX.md)** - Solução de problemas relacionados a domínios
- **[SECURITY.md](./SECURITY.md)** - Políticas e implementações de segurança

### 📝 Registros
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões e mudanças
- **[VERSAO_ATUAL.txt](./VERSAO_ATUAL.txt)** - Detalhes da versão corrente
- **[releases/](./releases/)** - Notas de lançamento detalhadas por versão

## 🛠️ Comandos Úteis

### Ambiente de Desenvolvimento
```bash
# Iniciar ambiente dev (Hot Reload)
./scripts/start.sh dev

# Parar ambiente dev
docker-compose -f docker-compose.dev.yml down
```

### Ambiente de Produção
```bash
# Iniciar produção
./scripts/start.sh

# Parar produção
docker-compose down
```

## 📐 Padrões de Projeto

- **Commits:** Conventional Commits
- **Branching:** Feature Branch Workflow
- **Código:** ESLint + Prettier (Frontend)
- **Docker:** Multi-stage builds, non-root users

## 🤝 Contribuição

Para contribuir com a documentação:
1. Crie ou edite arquivos dentro da pasta `docs/`
2. Mantenha os links relativos atualizados
3. Siga o padrão Markdown
