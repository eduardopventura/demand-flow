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

### 🔐 Sistema de Autenticação e Segurança

**Autenticação Completa:**
- ✅ Login com email/senha
- ✅ JWT (JSON Web Tokens) para sessões
- ✅ Hash de senhas com bcrypt
- ✅ Proteção de rotas no frontend e backend
- ✅ Middleware de autenticação
- ✅ Interceptação de 401 com logout automático
- ✅ Página de login funcional

**Segurança:**
- ✅ Senhas hasheadas no banco de dados
- ✅ Tokens JWT com expiração configurável
- ✅ Validação de tokens em todas as rotas protegidas
- ✅ Rotas públicas e protegidas bem definidas

---

### 🗄️ Banco de Dados PostgreSQL

**Migração Completa:**
- ✅ PostgreSQL 16 como banco de dados principal
- ✅ Prisma ORM para acesso aos dados
- ✅ Schema relacional otimizado
- ✅ Migrations e seeds automatizados
- ✅ Relacionamentos e foreign keys configurados
- ✅ Volume Docker para persistência

**Estrutura:**
- ✅ Tabelas: Usuario, Template, Demanda, TarefaStatus, Acao, CampoPreenchido, Cargo
- ✅ Timestamps automáticos (created_at, updated_at)
- ✅ Soft deletes quando aplicável
- ✅ Índices para performance

---

### 👔 Sistema de Cargos e Permissões

**Gerenciamento de Cargos:**
- ✅ Página dedicada `/cargos` para gerenciamento
- ✅ Cargos em tabela PostgreSQL (não hardcoded)
- ✅ Salvar em lote (criar/renomear/excluir/permissões)
- ✅ Reassignment obrigatório ao excluir cargo com usuários

**Permissões (v1):**
- ✅ Acesso Templates
- ✅ Acesso Ações
- ✅ Acesso Usuários (inclui página de Cargos)
- ✅ Deletar Demandas
- ✅ Cargo Disponível Como Responsável
- ✅ Usuários Disponíveis como Responsáveis

**Regras Globais:**
- ✅ Páginas sempre liberadas: Painel de Demandas, Relatórios, Finalizadas
- ✅ Redirecionamento para Painel quando sem permissão (sem erro)
- ✅ Validação de permissões no frontend e backend (403)
- ✅ Menu lateral ocultando itens conforme permissões

---

### ⚡ Sincronização em Tempo Real (WebSockets)

**Socket.io Integrado:**
- ✅ Conexão WebSocket autenticada via JWT
- ✅ Sincronização automática entre múltiplos usuários
- ✅ Atualização em tempo real do Kanban sem refresh
- ✅ Reconexão automática em caso de queda

**Eventos em Tempo Real:**
- ✅ `demanda:created` - Nova demanda criada
- ✅ `demanda:updated` - Demanda atualizada
- ✅ `demanda:deleted` - Demanda deletada
- ✅ Merge por campo (PATCH por delta) para evitar sobrescritas

**Benefícios:**
- ✅ Múltiplos usuários vendo mudanças instantaneamente
- ✅ Sem necessidade de refresh manual
- ✅ Resolução de conflitos em edições concorrentes

---

### 📝 Controle de Responsáveis e Auditoria

**Atualização Automática:**
- ✅ Responsáveis de tarefas atualizados automaticamente ao salvar demanda
- ✅ Respeito à escolha manual de responsável
- ✅ Atualização baseada no usuário logado

**Rastreabilidade:**
- ✅ Campo `modificado_por_id` em todas as demandas
- ✅ Indicador discreto de último modificador no footer
- ✅ Histórico de modificações rastreável

---

### 🔌 API REST

```
# Autenticação
POST   /api/auth/login            # Login com email/senha
POST   /api/auth/register         # Registro de usuário
GET    /api/auth/me               # Dados do usuário logado

# Recursos Protegidos
GET/POST/PATCH/DELETE  /api/usuarios
GET/POST/PATCH/DELETE  /api/templates
GET/POST/PATCH/DELETE  /api/demandas
GET/POST/PATCH/DELETE  /api/acoes
GET/POST/PATCH/DELETE  /api/cargos

# Endpoints Especiais
POST   /api/demandas/criar        # Com notificações
PATCH  /api/demandas/:id/atualizar # Com notificações
POST   /api/demandas/:id/tarefas/:taskId/executar  # Executa ação
POST   /api/upload                # Upload de arquivos
PUT    /api/cargos/batch          # Salvar cargos em lote
GET    /api/public/usuarios      # Lista pública (auth-only)
GET    /api/public/cargos         # Lista pública (auth-only)
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

### 💾 Autosave e Sincronização

Sistema inteligente de salvamento automático para garantir integridade dos dados e melhor experiência de usuário:

**Funcionalidades:**
- **Salvamento em Tempo Real:** Alterações salvas automaticamente sem necessidade de botão "Salvar".
- **Debounce Inteligente:** Campos de texto salvam após o usuário parar de digitar (1s).
- **Feedback Visual:** Indicador de status ("Salvando...", "Salvo") no topo do modal.
- **Upload Atômico:** Arquivos são salvos imediatamente, garantindo disponibilidade para ações.
- **Sincronização Pré-Ação:** Garante que dados e arquivos estejam persistidos antes de executar webhooks.

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

### 🔄 Recuperação de Senha

**Objetivo:** Permitir que usuários recuperem senhas esquecidas.

**Funcionalidades Planejadas:**
- Envio de email com link de recuperação
- Token de recuperação com expiração
- Página de redefinição de senha
- Validação de token

---

## 📝 Histórico de Versões

### v1.1.0 - 12/01/2026
- Autosave completo em demandas
- Upload imediato de arquivos
- Correção no cálculo de prazos (bug do mesmo dia)

### v1.0.4 - 05/01/2026
- Correção crítica no backend: 'path is not defined' em webhooks

### v1.0.3 - 05/01/2026
- Correção de permissões de templates
- Separação entre leitura (pública) e gestão (restrita) de templates
- Correção no fluxo de criação de demandas para operadores

### v1.0.2 - 22/12/2025
- Correção de Upload e Download de arquivos
- Correção de Timezone e datas duplicadas

### v1.0.0 - 18/12/2025

**Versão 1.0 - Produção Completa**

Esta é uma atualização major que transforma o Demand Flow em um sistema completo de produção com todas as funcionalidades essenciais.

#### ✨ Principais Mudanças

**1. Migração PostgreSQL (Fase 1)**
- ✅ Substituição completa do JSON-Server por PostgreSQL 16
- ✅ Prisma ORM para acesso aos dados
- ✅ Schema relacional otimizado com relacionamentos
- ✅ Migrations e seeds automatizados
- ✅ Volume Docker para persistência

**2. Sistema de Autenticação (Fase 2)**
- ✅ Login completo com email/senha
- ✅ JWT para sessões seguras
- ✅ Hash de senhas com bcrypt
- ✅ Proteção de rotas no frontend e backend
- ✅ Middleware de autenticação
- ✅ Página de login funcional

**3. Controle de Responsáveis e Auditoria (Fase 3)**
- ✅ Atualização automática de responsáveis baseada no usuário logado
- ✅ Campo `modificado_por_id` para rastreabilidade
- ✅ Indicador de último modificador no footer
- ✅ Respeito à escolha manual de responsável

**4. Sistema de Cargos e Permissões (Fase 4)**
- ✅ Cargos em tabela PostgreSQL (não hardcoded)
- ✅ Página dedicada `/cargos` com salvar em lote
- ✅ 6 tipos de permissões configuráveis
- ✅ Controle de acesso por página e ação
- ✅ Redirecionamento inteligente quando sem permissão
- ✅ Filtros de responsáveis baseados em permissões

**5. WebSockets - Tempo Real (Fase 5)**
- ✅ Socket.io integrado no backend
- ✅ Autenticação de sockets via JWT
- ✅ Sincronização em tempo real entre usuários
- ✅ Atualização automática do Kanban sem refresh
- ✅ Merge por campo para evitar sobrescritas
- ✅ Reconexão automática

#### 🔧 Melhorias Técnicas

- ✅ Arquitetura completa de produção
- ✅ Banco de dados relacional robusto
- ✅ Segurança implementada (JWT + bcrypt)
- ✅ Sincronização em tempo real
- ✅ Controle de acesso granular
- ✅ Auditoria de modificações

#### 📊 Impacto

- **Segurança**: Sistema pronto para produção com autenticação real
- **Performance**: Banco relacional otimizado
- **UX**: Sincronização em tempo real melhora experiência colaborativa
- **Escalabilidade**: Arquitetura preparada para crescimento

---

### v0.2.11 - 13/12/2025
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

**Versão:** 1.1.0  
**Última Atualização:** 12/01/2026
