# 🎯 Funcionalidades - Demand Flow

## Visão Geral

O Demand Flow é um sistema completo de gerenciamento de demandas com interface Kanban, controle de prazos e templates customizáveis.

---

## 🆕 Novo em v2.6.0 - Data de Previsão Editável e Observações

### 📅 Data de Previsão Inteligente

Cada demanda agora possui uma **Data de Previsão** calculada automaticamente e editável:

```
┌─────────────────────────────────────────────┐
│ Gerar Contrato - Eduardo Ventura            │
│ [Alta] [👤 Eduardo (2)]                     │
│ 📅 Criação: 06/12/2025 | Previsão: 13/12/2025 │  ← Clicável!
└─────────────────────────────────────────────┘
```

**Como funciona:**
1. Ao criar demanda: `data_previsao = data_criacao + tempo_medio (template)`
2. A qualquer momento: Clique na data para editar via calendário
3. Flexibilidade total para ajustes tempestivos

### 📊 Controle Visual de Prazos (Atualizado)

```
🟢 VERDE     - Mais de 1 dia até a previsão
🟡 AMARELO   - Falta 1 dia ou menos (atenção!)
🔴 VERMELHO  - Passou da previsão e não finalizada
```

### 📝 Campo de Observações

Novo campo fixo disponível em todas as demandas:

```
┌─────────────────────────────────────────────┐
│ Observações                           45/100│
│ ┌─────────────────────────────────────────┐ │
│ │ Cliente solicitou urgência. Priorizar  │ │
│ │ antes do feriado.                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- Máximo de 100 caracteres
- Contador em tempo real
- Alerta visual ao atingir limite

### ⚠️ Confirmação ao Reabrir Demandas

Ao mover uma demanda de "Finalizada" para outro status (arrastando ou desmarcando tarefa):

```
┌─────────────────────────────────────────────┐
│ ⚠️ Reabrir Demanda                          │
├─────────────────────────────────────────────┤
│ Esta demanda já foi finalizada. Ao movê-la │
│ para outro status, a data de finalização   │
│ será removida.                              │
│                                             │
│ Tem certeza que deseja continuar?          │
├─────────────────────────────────────────────┤
│            [Cancelar] [Sim, reabrir]       │
└─────────────────────────────────────────────┘
```

---

## 🕐 Sistema de Prazos (v2.4.0+)

### 📊 Controle Visual de Prazos

Cada demanda possui um indicador visual colorido que mostra o status do prazo:

```
🟢 VERDE     - Dentro do prazo (mais de 1 dia)
🟡 AMARELO   - Atenção! (≤1 dia restante)
🔴 VERMELHO  - Atrasado! (passou da previsão)
```

### 🎨 Visual dos Cards

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Gerar Contrato - Eduardo Ventura  ┃  ← Borda colorida (4px)
┃ [Alta] [👤 Eduardo]                ┃  ← Apenas primeiro nome
┃ 📅 14/11/2025 - 21/11/2025        ┃  ← Data criação - finalização
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    🟢 Verde = No prazo
```

### ⏱️ Tempo Médio nos Templates

Ao criar um template, você define o **Tempo Médio** para conclusão:

```
┌─────────────────────────────────┐
│ Nome do Template                │
│ [Gerar Contrato]                │
│                                 │
│ Tempo Médio (dias) *            │
│ [7] dias                        │
│ Número de dias esperado para    │
│ conclusão de demandas           │
│                                 │
│ Prioridade                      │
│ [Alta]                          │
└─────────────────────────────────┘
```

### 📅 Rastreamento Automático de Datas

**Ao criar uma demanda**:
- `data_criacao` = Data/hora atual
- `data_previsao` = `data_criacao` + `tempo_medio` do template
- `prazo` = true (começa verde)
- Borda = 🟢 Verde

**Durante a execução**:
- Sistema calcula dias até a data de previsão
- Data de previsão pode ser editada a qualquer momento!
- Borda muda conforme prazo se aproxima:
  - Mais de 1 dia: 🟢 Verde (tranquilo)
  - 1 dia ou menos: 🟡 Amarelo (atenção!)
  - Passou da previsão: 🔴 Vermelho (atrasado!)

**Ao finalizar**:
- `data_finalizacao` = Data/hora da conclusão
- `prazo` = true (se finalizou antes da previsão) ou false (se atrasado)
- Borda = 🟢 Verde (sucesso) ou 🔴 Vermelho (atrasado)

### 🎯 Exemplo Prático

**Template**: Gerar Contrato (7 dias)

**Cenário 1 - Sucesso**:
```
Criada:     06/12/2025 🟢 (previsão: 13/12/2025)
Em Trabalho: 07/12/2025 🟢
Atenção:    12/12/2025 🟡 (1 dia restante!)
Finalizada: 12/12/2025 🟢 (dentro do prazo!)
```

**Cenário 2 - Atraso**:
```
Criada:     06/12/2025 🟢 (previsão: 13/12/2025)
Em Trabalho: 07/12/2025 🟢
Atenção:    12/12/2025 🟡 (1 dia restante!)
Atrasada:   14/12/2025 🔴 (passou da previsão!)
Finalizada: 16/12/2025 🔴 (fora do prazo!)
```

**Cenário 3 - Previsão Ajustada**:
```
Criada:     06/12/2025 🟢 (previsão: 13/12/2025)
Editada:    07/12/2025 🟢 (previsão alterada para 20/12/2025)
Finalizada: 18/12/2025 🟢 (dentro da nova previsão!)
```

---

## 🎯 Core Features

### 📋 Quadro Kanban

Interface visual com três colunas:

```
┌─────────────┬─────────────┬─────────────┐
│   CRIADA    │ EM ANDAMENTO│  FINALIZADA │
├─────────────┼─────────────┼─────────────┤
│ • Demanda 1 │ • Demanda 3 │ • Demanda 5 │
│ • Demanda 2 │ • Demanda 4 │ • Demanda 6 │
└─────────────┴─────────────┴─────────────┘
```

**Funcionalidades**:
- ✅ Drag & Drop entre colunas
- ✅ Status atualizado automaticamente
- ✅ Contadores por coluna
- ✅ Cards coloridos por prioridade
- ✅ **Indicador visual de prazo** 🆕

### 🎨 Templates Customizáveis

Crie templates reutilizáveis para tipos de demanda:

**Componentes**:
1. **Campos de Preenchimento**
   - Texto
   - Número
   - Data
   - Arquivo
   - Dropdown (lista de opções)

2. **Configurações**
   - Nome do template
   - Prioridade padrão (Baixa/Média/Alta)
   - **Tempo esperado** (dias) 🆕
   - Campos obrigatórios
   - Campo que complementa o nome

3. **Tarefas**
   - Lista de tarefas pré-definidas
   - Dependências entre tarefas
   - Ordem customizável (drag & drop)

**Exemplo - Template "Gerar Contrato"**:
```yaml
Nome: Gerar Contrato
Prioridade: Alta
Tempo Esperado: 7 dias

Campos:
  - Nome do Aluno (texto, obrigatório, complementa nome)
  - Tipo de Fidelidade (dropdown)
  - Valor da Matrícula (número)
  - Data do Contrato (data)

Tarefas:
  1. Solicitar MOL
  2. Aprovar MOL (depende de #1)
  3. Gerar Contrato (depende de #2)
  4. Assinar Contrato (depende de #3)
```

### ✅ Controle de Tarefas

**Características**:
- Lista de verificação para cada demanda
- Dependências entre tarefas (tarefa pai/filha)
- Tarefas aparecem somente após pai ser concluída
- Progresso visual (3/7 tarefas)
- Status da demanda atualiza automaticamente:
  - Nenhuma concluída = "Criada"
  - Algumas concluídas = "Em Andamento"
  - Todas concluídas = "Finalizada" + **data_finalizacao** 🆕

### 👥 Gerenciamento de Usuários

**Funcionalidades**:
- Cadastro de usuários
- Atribuição de responsáveis
- Visualização por responsável
- **Exibição otimizada** (apenas primeiro nome nos cards) 🆕

### 📊 Relatórios e Gráficos

**Métricas Disponíveis**:
- Total de demandas
- Demandas por status
- Demandas por prioridade
- Gráficos de desempenho
- Taxa de conclusão
- **Métricas de cumprimento de prazos** 🆕

### 🎯 Priorização

**Níveis**:
- 🔴 Alta
- 🟡 Média
- 🟢 Baixa

**Indicadores Visuais**:
- Badges coloridas
- Ordenação automática
- Filtros por prioridade

---

## 🛠️ Infraestrutura

### 🐳 100% Docker

```bash
# Subir aplicação completa
docker-compose up -d

# Frontend: http://192.168.1.4:3060
# Backend:  http://192.168.1.4:3000
```

### 🔄 API REST Completa

```
GET    /api/usuarios
POST   /api/usuarios
PATCH  /api/usuarios/:id
DELETE /api/usuarios/:id

GET    /api/templates
POST   /api/templates
PATCH  /api/templates/:id
DELETE /api/templates/:id

GET    /api/demandas
POST   /api/demandas
PATCH  /api/demandas/:id
DELETE /api/demandas/:id
```

### 💾 Persistência

- **Produção**: `db.json` (volume Docker)
- **Desenvolvimento**: `db-dev.json` (separado)
- **Fallback**: localStorage (se API cair)

### 🔒 Segurança

**Atual (MVP)**:
- ⚠️ Senhas em texto plano
- ⚠️ Sem autenticação real
- ⚠️ CORS aberto

**Futuro (Produção)**:
- 🔐 JWT authentication
- 🔐 Bcrypt password hashing
- 🔐 HTTPS/SSL
- 🔐 Rate limiting

---

## 🚀 Próximas Funcionalidades

### Curto Prazo
- [ ] Notificações de prazo (email/push)
- [ ] Dashboard de métricas
- [ ] Filtros avançados
- [ ] Exportação de relatórios (PDF/Excel)

### Médio Prazo
- [ ] Comentários nas demandas
- [ ] Anexos de arquivos reais
- [ ] Histórico de alterações
- [ ] Tags e categorias

### Longo Prazo
- [ ] Migração para PostgreSQL
- [ ] WebSockets (atualizações em tempo real)
- [ ] Mobile app
- [ ] Integrações (Slack, Teams)

---

## 📚 Documentação

- **[README.md](../README.md)** - Overview e quick start
- **[CHANGELOG.md](../CHANGELOG.md)** - Histórico de versões
- **[QUICK_GUIDE.md](./QUICK_GUIDE.md)** - Guia rápido de comandos
- **[DOCKER.md](./DOCKER.md)** - Guia Docker completo
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Histórico técnico
- **[MIGRATION.md](./MIGRATION.md)** - Migração PostgreSQL

---

**Versão**: 2.6.0  
**Data**: 2025-12-06  
**Status**: ✅ Produção

