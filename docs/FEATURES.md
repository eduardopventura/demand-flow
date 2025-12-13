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
- ✅ Ordenação inteligente:
  - **Criadas/Em Andamento**: Data de previsão crescente → Alfabética (ignorando template)
  - **Finalizadas**: Data de finalização decrescente → Alfabética (ignorando template)
- ✅ Limitação de exibição: 15 últimas finalizadas no painel
- ✅ Link "Ver todas" para página completa de finalizadas

---

### 🎨 Templates Customizáveis

Crie modelos reutilizáveis para tipos de demanda:

**Componentes:**
- **Campos de Preenchimento:** Texto, Número, Número Decimal, Data, Arquivo, Dropdown
- **Tempo Médio:** Dias esperados para conclusão (calcula previsão) - obrigatório
- **Tarefas:** Lista pré-definida com dependências
- **Responsáveis:** Por tarefa (opcional)

**Tipos de Campo:**
- `texto` - Input de texto simples
- `numero` - Input numérico (validação para aceitar apenas números)
- `numero_decimal` - Número decimal brasileiro (vírgula, 2 decimais, digitação da direita)
- `data` - Date picker
- `arquivo` - Upload de arquivo com preview
- `dropdown` - Select com opções pré-definidas
- `grupo` - Agrupamento de campos com múltiplas réplicas

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
- **Criadas e Em Andamento:**
  1. Data de previsão crescente (mais próxima primeiro)
  2. Ordem alfabética do nome (ignorando template)
  3. Demandas só com nome do template ficam por último
- **Finalizadas:**
  1. Data de finalização decrescente (mais recente primeiro)
  2. Ordem alfabética do nome (ignorando template)
  3. Demandas só com nome do template ficam por último

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

### 📑 Organização por Abas e Visibilidade Condicional

**Organização por Abas:**
- Agrupamento de campos em abas temáticas nos templates
- Aba "Geral" padrão para garantir integridade
- Interface limpa para formulários extensos
- Configuração visual no editor de templates

**Visibilidade Condicional:**
- Exibição dinâmica de campos baseada em regras
- Operadores suportados: igual, diferente, preenchido, vazio
- Avaliação em tempo real durante o preenchimento
- Ideal para formulários complexos com fluxos variáveis
- **Correção**: Operador "diferente de" ignora campos vazios (não aplica regra)
- **Suporte em Grupos**: Condições funcionam para campos dentro de grupos
- **Campo Valor**: Usa Select quando campo pai é dropdown (ao invés de Input)

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

### 🔒 Regras de Status

**Prevenção de Regressão:**
- ✅ Demandas nunca voltam para status "Criada" após ter outro status
- ✅ Se todas as tarefas não estão concluídas, mantém status atual
- ✅ Lógica: Finalizada → Em Andamento → (mantém) → nunca volta para Criada

---

### 📊 Dashboard de Relatórios

Dashboard completo com métricas avançadas e visualizações:

**Funcionalidades:**
- ✅ Gráficos de demandas por período (buckets mensais)
- ✅ Taxa de cumprimento de prazos
- ✅ Desempenho por responsável (agrupamento por usuário)
- ✅ Tempo médio de conclusão por template
- ✅ Filtros avançados: período, usuário, template, status, prazo
- ✅ KPIs em tempo real: Total, Taxa de Conclusão, Criadas, Em Andamento, Finalizadas, Em Atraso
- ✅ Gráficos interativos: barras, pizza, linhas
- ✅ Top usuários por volume e taxa de conclusão
- ✅ Agrupamento por template com distribuição de status
- ✅ Período customizado com seleção de datas

**Rota:** `/relatorios`

---

### 📄 Página de Finalizadas

Nova página dedicada para consulta completa de demandas finalizadas:

**Funcionalidades:**
- ✅ Lista completa de todas as demandas finalizadas
- ✅ Filtros por busca (nome), template e responsável
- ✅ Ordenação configurável:
  - Data de finalização (crescente/decrescente)
  - Nome (A-Z / Z-A) - ignora nome do template
- ✅ Ordenação secundária alfabética quando ordenar por data
- ✅ Layout em grid responsivo (1/2/3 colunas)
- ✅ Acesso via menu lateral e link no painel

**Rota:** `/finalizadas`

---

### ✅ Indicadores de Validação nas Abas

Sistema visual de validação no modal de criação de demanda:

**Funcionalidades:**
- ✅ Asterisco (*) no canto superior direito de cada aba
- ✅ Cor vermelha: há campos obrigatórios não preenchidos na aba
- ✅ Cor verde: todos os campos obrigatórios estão preenchidos
- ✅ Atualização em tempo real conforme o usuário preenche
- ✅ Validação considera campos simples e campos dentro de grupos

---

### 🔌 API REST

```
GET/POST/PATCH/DELETE  /api/usuarios
GET/POST/PATCH/DELETE  /api/templates
GET/POST/PATCH/DELETE  /api/demandas
GET/POST/PATCH/DELETE  /api/acoes

POST   /api/demandas/criar        # Com notificações
PATCH  /api/demandas/:id/atualizar # Com notificações
POST   /api/demandas/:id/tarefas/:taskId/executar  # Executa ação
POST   /api/upload                # Upload de arquivos
POST   /api/auth/login            # Mock authentication
GET    /health                    # Health check
```

---

### ⚡ Sistema de Ações para Tarefas

Permite vincular ações customizáveis a tarefas que executam webhooks externos:

**Funcionalidades:**
- Página dedicada para gerenciamento de ações (`/acoes`)
- Cada ação possui: nome, URL do webhook e campos configuráveis
- Tipos de campos: texto, número, data, arquivo, dropdown
- Associação de ações a tarefas nos templates
- Mapeamento de campos da demanda para parâmetros da ação
- Execução automática de webhooks (n8n, Zapier, etc.)
- Suporte a envio de arquivos via multipart/form-data
- Marcação automática de tarefa como concluída após execução

**Fluxo:**
```
1. Criar ação com campos → 2. Vincular a tarefa no template
3. Mapear campos → 4. Na demanda, preencher campos → 5. Executar
```

---

### 📎 Upload de Arquivos

Sistema de upload de arquivos para demandas:

**Funcionalidades:**
- Novo tipo de campo "arquivo" disponível nos templates
- Upload de arquivos via API com feedback visual (loading)
- Armazenamento local no servidor (`/uploads`)
- Persistência via volume Docker
- Download de arquivos anexados
- Integração com Sistema de Ações (envio via webhook)

---

## 🔮 Próximas Funcionalidades

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

### v0.2.11 (Atual) - 13/12/2025
- Página de Finalizadas com filtros e ordenação
- Indicadores de validação nas abas
- Novo tipo de campo: Número Decimal
- Melhorias na ordenação (ignora nome do template)
- Correções de bugs em condições de visibilidade
- Prevenção de regressão ao status "Criada" (regra de status)
- Remoção de scroll horizontal no Kanban
- Dashboard de Relatórios completo
- Melhorias na infraestrutura Docker

### v0.2.10 - 12/12/2025
- Refatoração de arquitetura e código
- Novos hooks personalizados
- Componentes de formulário reutilizáveis
- Melhorias de performance

### v0.2.9 - 10/12/2025
- Sistema de Ações para Tarefas com webhooks
- Upload de arquivos reais
- Página de gerenciamento de ações
- Mapeamento de campos entre demandas e ações
- Execução de webhooks com suporte a arquivos

### v0.2.8 - 10/12/2025
- Refatoração completa e limpeza de código
- Nova estrutura de pastas (frontend/backend separados)
- Consolidação de lógica de negócio no backend
- Componentes reutilizáveis e schemas atualizados

### v0.2.7 - 10/12/2025
- Organização por abas nos templates
- Visibilidade condicional de campos
- Simplificação do sistema de prioridades
- Melhorias na ordenação

### v0.2.6 - 06/12/2025
- Data de previsão editável
- Tempo médio nos templates
- Campo de observações
- Confirmação ao reabrir demandas

### v0.2.5 - 24/11/2025
- Responsável por tarefa
- Ordenação automática inteligente
- Design limpo dos cards

### v0.2.4 - 21/11/2025
- Sistema de prazos
- Indicadores visuais de prazo
- Rastreamento de datas

### v0.2.3.x - 19/11/2025
- Correções de domínio
- Favicons e PWA
- Organização da documentação

### v0.2.2 - 19/11/2025
- Integração com API
- Backend JSON-Server
- Docker completo

Ver histórico completo em [CHANGELOG.md](./CHANGELOG.md)

---

**Versão:** 0.2.11  
**Última Atualização:** 13/12/2025
