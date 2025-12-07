# 🎯 Funcionalidades - Demand Flow

## Visão Geral

O Demand Flow é um sistema completo de gerenciamento de demandas com interface Kanban, controle de prazos, templates customizáveis e sistema de notificações.

---

## ✅ Funcionalidades Atuais

### 📋 Quadro Kanban

Interface visual com três colunas para gerenciamento de demandas:

```
┌─────────────┬─────────────┬─────────────┐
│   CRIADA    │ EM ANDAMENTO│  FINALIZADA │
├─────────────┼─────────────┼─────────────┤
│ • Demanda 1 │ • Demanda 3 │ • Demanda 5 │
│ • Demanda 2 │ • Demanda 4 │ • Demanda 6 │
└─────────────┴─────────────┴─────────────┘
```

- ✅ Drag & Drop entre colunas
- ✅ Status atualizado automaticamente
- ✅ Contadores por coluna
- ✅ Indicadores visuais de prazo (verde/amarelo/vermelho)
- ✅ Ordenação automática por prioridade e urgência

---

### 🎨 Templates Customizáveis

Crie modelos reutilizáveis para tipos de demanda:

**Componentes:**
- **Campos de Preenchimento:** Texto, Número, Data, Arquivo, Dropdown
- **Tempo Médio:** Dias esperados para conclusão (calcula previsão)
- **Tarefas:** Lista pré-definida com dependências
- **Responsáveis:** Por tarefa (opcional)

**Exemplo - Template "Gerar Contrato":**
```yaml
Nome: Gerar Contrato
Prioridade: Alta
Tempo Médio: 7 dias

Campos:
  - Nome do Aluno (texto, obrigatório)
  - Tipo de Fidelidade (dropdown)
  - Valor da Matrícula (número)

Tarefas:
  1. Solicitar MOL
  2. Aprovar MOL (depende de #1)
  3. Gerar Contrato (depende de #2)
  4. Assinar Contrato (depende de #3)
```

---

### 📅 Sistema de Prazos

**Data de Previsão:**
- Calculada automaticamente: `data_criação + tempo_médio`
- Editável a qualquer momento (clique no card ou modal)

**Indicadores Visuais:**
```
🟢 VERDE     - Mais de 1 dia até a previsão
🟡 AMARELO   - Falta 1 dia ou menos (atenção!)
🔴 VERMELHO  - Passou da previsão e não finalizada
```

**Ordenação Automática:**
1. Por prioridade (Alta > Média > Baixa)
2. Por prazo restante (mais urgente no topo)

---

### 👥 Gestão de Responsáveis

- **Por Demanda:** Responsável principal
- **Por Tarefa:** Responsável específico (opcional)
- **Visualização no Card:** Lista todos os envolvidos com contagem de tarefas abertas

```
┌─────────────────────────────────────┐
│ Gerar Contrato - João Silva         │
│ 👤 Eduardo (3)                      │
│ 👤 Cristina (1)                     │
│ 📅 06/12/2025 | Previsão: 13/12/2025│
└─────────────────────────────────────┘
```

---

### 📝 Campo de Observações

- Disponível em todas as demandas
- Limite de 100 caracteres
- Contador em tempo real

---

### 🔔 Sistema de Notificações

**Canais:**
- 📧 Email (SMTP)
- 📱 WhatsApp (via webhook n8n)

**Eventos Notificados:**
- Nova demanda atribuída
- Tarefa atribuída a outro usuário
- Tarefa concluída por outro usuário
- Prazo próximo (1 dia antes)

---

### ⚠️ Confirmações de Segurança

- **Reabrir Demanda:** Confirmação ao mover demanda finalizada
- **Desmarcar Tarefa:** Confirmação se demanda já estava finalizada

---

### 📊 Relatórios

- Total de demandas por status
- Demandas por prioridade
- Taxa de conclusão
- Métricas de cumprimento de prazos

---

### 🔌 API REST

```
GET/POST/PATCH/DELETE  /api/usuarios
GET/POST/PATCH/DELETE  /api/templates
GET/POST/PATCH/DELETE  /api/demandas

POST   /api/demandas/criar        # Com notificações
PATCH  /api/demandas/:id/atualizar # Com notificações
POST   /api/auth/login            # Mock authentication
GET    /health                    # Health check
```

---

## 🔮 Próximas Funcionalidades

### 🚫 Sistema de Cancelamento de Demanda

**Objetivo:** Permitir cancelar demandas com registro de motivo e histórico.

**Funcionalidades Planejadas:**
- Botão de cancelar demanda no modal de detalhes
- Campo obrigatório para motivo do cancelamento
- Nova coluna "Cancelada" no Kanban (opcional)
- Histórico de cancelamentos preservado
- Filtro para exibir/ocultar demandas canceladas

---

### ⚡ Sistema de Ações para Tarefas

**Objetivo:** Adicionar ações customizadas que podem ser executadas em tarefas.

**Funcionalidades Planejadas:**
- Definir ações no template (ex: "Enviar Email", "Gerar Documento")
- Ações podem ter parâmetros configuráveis
- Integração com sistemas externos via webhooks
- Log de ações executadas

---

### 📎 Anexo de Arquivos Reais

**Objetivo:** Permitir upload de arquivos em demandas e tarefas.

**Funcionalidades Planejadas:**
- Upload de arquivos (PDF, imagens, documentos)
- Armazenamento local ou em cloud (S3/MinIO)
- Preview de arquivos no modal
- Download de anexos
- Limite de tamanho configurável

---

### 📊 Dashboard de Métricas Reestruturado

**Objetivo:** Dashboard completo com métricas avançadas e visualizações.

**Funcionalidades Planejadas:**
- Gráficos de demandas por período
- Taxa de cumprimento de prazos
- Desempenho por responsável
- Tempo médio de conclusão por template
- Filtros por data, usuário, template
- Comparativo entre períodos

---

### 📤 Exportação de Relatórios do Dashboard

**Objetivo:** Exportar relatórios e métricas em diferentes formatos.

**Funcionalidades Planejadas:**
- Exportação em PDF
- Exportação em Excel/CSV
- Relatórios customizáveis
- Agendamento de relatórios automáticos
- Envio por email

---

### 🔐 Sistema de Login + Migração PostgreSQL

**Objetivo:** Implementar autenticação real e migrar para banco de dados relacional.

**Funcionalidades Planejadas:**

**Autenticação:**
- Login com email/senha
- JWT para sessões
- Bcrypt para senhas
- Níveis de acesso (admin, usuário)
- Recuperação de senha

**Banco de Dados:**
- Migração de JSON-Server para PostgreSQL
- Schema relacional otimizado
- Migrations e seeds
- Backup automatizado

**Infraestrutura:**
- Container PostgreSQL no Docker
- ORM (Prisma ou TypeORM)
- API REST refatorada

---

## 📝 Histórico de Versões

### v2.6.0 (Atual) - 06/12/2025
- Data de previsão editável
- Tempo médio nos templates
- Campo de observações
- Confirmação ao reabrir demandas

### v2.5.0 - 24/11/2025
- Responsável por tarefa
- Ordenação automática inteligente
- Design limpo dos cards

### v2.4.0 - 21/11/2025
- Sistema de prazos
- Indicadores visuais de prazo
- Rastreamento de datas

### v2.3.x - 19/11/2025
- Correções de domínio
- Favicons e PWA
- Organização da documentação

### v2.2.0 - 19/11/2025
- Integração com API
- Backend JSON-Server
- Docker completo

Ver histórico completo em [CHANGELOG.md](./CHANGELOG.md)

---

**Versão:** 2.6.0  
**Última Atualização:** 07/12/2025
