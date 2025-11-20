# 🗄️ Arquivo - Documentação Antiga

> **Documentos históricos preservados para referência**

---

## 📝 Sobre Este Diretório

Este diretório contém a documentação original que foi **consolidada** nos novos guias principais:

- [../QUICK_GUIDE.md](../QUICK_GUIDE.md)
- [../DOCKER.md](../DOCKER.md)
- [../IMPLEMENTATION.md](../IMPLEMENTATION.md)
- [../MIGRATION.md](../MIGRATION.md)

**Não use estes arquivos para referência ativa.** Eles estão aqui apenas para:
- Histórico
- Comparação
- Recuperação de informação específica se necessário

---

## 📚 Arquivos Arquivados

### Documentação Docker (4 arquivos)
- `DOCKER_MVP.md` - Overview inicial do Docker
- `DOCKER_GUIDE.md` - Guia Docker detalhado
- `DOCKER_FIX.md` - Correções de conexão frontend-backend
- `REBUILD_FORCE.md` - Guia de force rebuild

**Consolidados em**: `../DOCKER.md`

---

### Documentação de Implementação (6 arquivos)
- `API_INTEGRATION.md` - Detalhes da integração API
- `IMPLEMENTATION_SUMMARY.md` - Resumo da implementação
- `IMPROVEMENTS.md` - Melhorias v2.0
- `SIMPLIFICATION.md` - Justificativa v2.3.0
- `MIGRATION_COMPLETED.md` - Resumo da migração API
- `SUMMARY.md` - Resumo executivo

**Consolidados em**: `../IMPLEMENTATION.md`

---

### Documentação de Configuração (3 arquivos)
- `QUICK_START.md` - Guia de início rápido
- `QUICK_REFERENCE.md` - Referência de comandos
- `CONFIG.md` - Configuração detalhada

**Consolidados em**: `../QUICK_GUIDE.md`

---

### Outros (2 arquivos)
- `FILES_CHANGED.md` - Lista de arquivos modificados (histórico)
- `PROJECT_STRUCTURE.md` - Estrutura do projeto (histórico)
- `IMPLEMENTATION_v2.3.0.txt` - Resumo executivo v2.3.0

**Informação disponível em**: `../IMPLEMENTATION.md`

---

## ⚠️ Aviso

**NÃO EDITE** arquivos neste diretório. Eles são mantidos como referência histórica apenas.

Para atualizar documentação, edite os arquivos em `docs/`:
- [../QUICK_GUIDE.md](../QUICK_GUIDE.md)
- [../DOCKER.md](../DOCKER.md)
- [../IMPLEMENTATION.md](../IMPLEMENTATION.md)
- [../MIGRATION.md](../MIGRATION.md)

---

## 🔍 Busca em Arquivos Antigos

Se precisar encontrar algo específico nos arquivos antigos:

```bash
# Buscar em todos os arquivos do archive
grep -r "termo_de_busca" docs/archive/

# Buscar apenas em arquivos .md
grep -r "termo_de_busca" docs/archive/*.md

# Listar todos os arquivos
ls -la docs/archive/
```

---

**Data de Arquivamento**: 2025-11-19  
**Versão**: 2.3.1  
**Motivo**: Consolidação da documentação

