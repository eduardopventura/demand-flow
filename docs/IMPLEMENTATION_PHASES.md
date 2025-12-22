# 🚀 Plano de Implementação - Versão 1.0

Este documento define as fases principais para migração do Demand Flow para versão 1.0, incluindo PostgreSQL, autenticação completa, registro de usuário finalizador e WebSockets.

---

## 📋 Visão Geral

O projeto será migrado de JSON-Server para uma arquitetura completa de produção em 5 fases sequenciais:

1. **Fase 1**: Migração PostgreSQL (Fundação)
2. **Fase 2**: Login Completo (Autenticação)
3. **Fase 3**: Controle de Responsáveis e Auditoria (Auditoria)
4. **Fase 4**: Sistema de Cargos e Permissões (Controle de Acesso)
5. **Fase 5**: WebSockets (Tempo Real)

---

## ✅ Fases de Implementação

### [x] Fase 1: Migração PostgreSQL
**Status**: ✅ Concluída  
**Prioridade**: 🔴 Crítica  
**Complexidade**: Alta  
**Duração Estimada**: 2 semanas  
**Data de Conclusão**: 15/12/2024

**Objetivo**: Substituir JSON-Server por PostgreSQL com Prisma, estabelecendo a base de dados para produção.

**Principais Tarefas**:
- ✅ Setup do banco PostgreSQL no Docker Compose
- ✅ Criação do schema e migrations
- ✅ Migração de todos os serviços para Prisma
- ✅ Scripts de migração de dados

**Documentação**: [docs/implementation/PHASE_1_POSTGRESQL.md](./implementation/PHASE_1_POSTGRESQL.md)

---

### [x] Fase 2: Login Completo
**Status**: ✅ Concluída  
**Prioridade**: 🟠 Alta  
**Complexidade**: Média  
**Duração Estimada**: 1 semana  
**Data de Conclusão**: 15/12/2024

**Objetivo**: Implementar autenticação completa com JWT, hash de senhas e proteção de rotas.

**Principais Tarefas**:
- ✅ Backend: Auth service com bcrypt e JWT
- ✅ Backend: Middleware de autenticação
- ✅ Frontend: AuthContext e rotas protegidas
- ✅ Migração de senhas existentes
- ✅ Página de login funcional
- ✅ Proteção de rotas no frontend e backend

**Documentação**: [docs/implementation/PHASE_2_AUTH.md](./implementation/PHASE_2_AUTH.md)

---

### [x] Fase 3: Controle de Responsáveis e Auditoria
**Status**: ✅ Concluída  
**Prioridade**: 🟡 Média  
**Complexidade**: Média  
**Duração Estimada**: 4-5 dias  
**Data de Conclusão**: 20/12/2024

**Objetivo**: Implementar controle automático de responsáveis de tarefas baseado no usuário logado e adicionar rastreabilidade de modificações nas demandas.

**Principais Tarefas**:
- ✅ Atualizar schema: adicionar campos `modificado_por_id` em Demanda
- ✅ Backend: verificar e atualizar responsáveis de tarefas ao salvar demanda
- ✅ Backend: registrar último usuário que modificou a demanda
- ✅ Frontend: exibir indicador discreto de último modificador no footer
- ✅ Garantir que notificações sejam acionadas após validação de responsáveis

**Documentação**: [docs/implementation/PHASE_3_TASK_USER.md](./implementation/PHASE_3_TASK_USER.md)

---

### [x] Fase 4: Sistema de Cargos e Permissões
**Status**: ✅ Concluída  
**Prioridade**: 🟠 Alta  
**Complexidade**: Alta  
**Duração Estimada**: 1-2 semanas  
**Data de Conclusão**: 18/12/2025

**Objetivo**: Implementar **cargos em tabela** (PostgreSQL/Prisma) e **controle de acesso por cargo** (por página e ação), com uma **página dedicada de Cargos** e regras de redirecionamento para evitar “erro de sistema” quando não houver acesso.

**Escopo de Permissões (v1)**:
- Acesso Templates
- Acesso Ações
- Acesso Usuários (inclui página de Cargos)
- Deletar Demandas
- Cargo Disponível Como Responsável
- Usuários Disponíveis como Responsáveis

**Regras Globais (v1)**:
- Páginas **sempre liberadas** para todos: **Painel de Demandas**, **Relatórios**, **Finalizadas**
- Se tentar acessar página sem permissão: **redirecionar para Painel de Demandas** (sem quebrar UI)

**Principais Tarefas**:
- Atualizar banco/schema: criar tabela `Cargo` com permissões e migrar `Usuario` para `cargo_id` (FK)
- Criar página `Cargos` (rota dedicada) acessada por botão dentro da página `Usuários`, com botão de voltar
- Implementar UI de cargos com **Salvar em lote** (criar/renomear/excluir/permissões)
- Aplicar controle de acesso no frontend e backend (sem tratar “sem permissão” como erro do sistema)
- Seed inicial: criar cargo **Operador** com todos os acessos e atribuir a todos usuários atuais

**Documentação**: [docs/implementation/PHASE_4_ROLES.md](./implementation/PHASE_4_ROLES.md)

---

### [x] Fase 5: WebSockets
**Status**: ✅ Concluída  
**Prioridade**: 🟡 Média  
**Complexidade**: Alta  
**Duração Estimada**: 1-2 semanas  
**Data de Conclusão**: 18/12/2025

**Objetivo**: Sincronização em tempo real entre usuários via WebSockets (Socket.io).

**Principais Tarefas**:
- ✅ Backend: Integração Socket.io no `backend/server.js` (HTTP server + Socket.io)
- ✅ Backend: Autenticação de sockets via JWT (handshake)
- ✅ Backend: Emissão de eventos em mudanças de demandas e tarefas
- ✅ Frontend: Cliente Socket.io e atualização automática do `DataContext`
- ✅ Proxy `/socket.io` configurado (Nginx e Vite) para same-origin
- ✅ Correção de renderização no Kanban para refletir mudanças sem refresh
- ✅ Mitigação de conflito: merge por campo (PATCH por delta) para evitar sobrescritas em edições concorrentes

**Documentação**: [docs/implementation/PHASE_5_WEBSOCKETS.md](./implementation/PHASE_5_WEBSOCKETS.md)

---

## 🔄 Dependências entre Fases

```
PostgreSQL (Fase 1)
    ↓
Login (Fase 2) ──→ Controle Responsáveis (Fase 3)
    ↓
Sistema de Cargos (Fase 4)
    ↓
WebSockets (Fase 5)
```

**Ordem Obrigatória**:
- Fase 1 deve ser completada antes de todas as outras
- Fase 2 deve ser completada antes da Fase 3 (precisa de autenticação)
- Fase 3 deve ser completada antes da Fase 4 (precisa de controle de usuários)
- Fase 4 antes da Fase 5 é **recomendado** para controle de acesso em WebSockets, mas a Fase 5 foi implementada sem a Fase 4 por hora (sem bloqueios por cargo no canal de eventos)

---

## 📊 Progresso Geral

| Fase | Status | Progresso |
|------|--------|-----------|
| Fase 1: PostgreSQL | ✅ Concluída | 100% |
| Fase 2: Login | ✅ Concluída | 100% |
| Fase 3: Controle Responsáveis | ✅ Concluída | 100% |
| Fase 4: Sistema de Cargos | ✅ Concluída | 100% |
| Fase 5: WebSockets | ✅ Concluída | 100% |

**Progresso Total**: 100% (5/5 fases concluídas)

---

## 🎯 Critérios de Sucesso

### Fase 1 - PostgreSQL
- [x] Banco PostgreSQL rodando no Docker ✅
- [x] Todas as entidades migradas para Prisma ✅
- [x] Todas as rotas funcionando com PostgreSQL ✅
- [x] Script de migração de dados criado ✅
- [x] Testes de integridade passando ✅

**Validações Realizadas (15/12/2024)**:
- ✅ PostgreSQL container rodando e saudável
- ✅ Todas as 6 tabelas criadas (Usuario, Template, Demanda, TarefaStatus, Acao, CampoPreenchido)
- ✅ Migration aplicada com sucesso
- ✅ Health check retornando status "healthy" com database "postgresql"
- ✅ Rotas CRUD funcionando (testado: POST e GET /api/usuarios)
- ✅ Prisma Client gerado e funcionando
- ✅ Relacionamentos e foreign keys configurados
- ✅ Script de migração de dados criado e pronto para uso

### Fase 2 - Login
- [x] Senhas hasheadas no banco ✅
- [x] JWT funcionando no backend ✅
- [x] Rotas protegidas com middleware ✅
- [x] Login funcionando no frontend ✅
- [x] Rotas protegidas no frontend ✅

**Validações Realizadas (15/12/2024)**:
- ✅ Dependências bcrypt e jsonwebtoken instaladas
- ✅ Auth service criado com hash, comparação e geração/validação de tokens
- ✅ Auth middleware implementado e aplicado em todas as rotas protegidas
- ✅ Rotas de autenticação: login, register e /me funcionando
- ✅ Senhas migradas para hash bcrypt (script executado)
- ✅ AuthContext criado no frontend com gerenciamento de estado
- ✅ Página de Login implementada com validação Zod
- ✅ ProtectedRoute criado para proteger rotas no frontend
- ✅ API Service atualizado para incluir token em todas requisições
- ✅ Interceptação de 401 implementada com logout automático
- ✅ Indicador de usuário logado e botão de logout no Layout
- ✅ Variáveis JWT_SECRET e JWT_EXPIRES_IN configuradas no docker-compose
- ✅ Testes realizados: login funcionando, rotas protegidas retornando 401 sem token

### Fase 3 - Controle de Responsáveis e Auditoria
- [x] Campo `modificado_por_id` adicionado ao schema Demanda ✅
- [x] Backend verificando e atualizando responsáveis de tarefas ao salvar ✅
- [x] Backend registrando último usuário que modificou demanda ✅
- [x] Frontend exibindo indicador de último modificador no footer ✅
- [x] Notificações sendo acionadas após validação de responsáveis ✅
- [x] Testes validando lógica de atualização de responsáveis ✅

**Validações Realizadas (20/12/2024)**:
- ✅ Migration `add_demanda_modificado_por` criada e aplicada
- ✅ Campo `modificado_por_id` adicionado ao schema com relação para Usuario
- ✅ Backend atualizando responsáveis de tarefas automaticamente quando `concluida` muda
- ✅ Backend respeitando mudança manual de responsável (não sobrescreve)
- ✅ Backend registrando `modificado_por_id` em todas atualizações de demanda
- ✅ Repository incluindo `modificado_por` em todas queries com dados do usuário
- ✅ Frontend exibindo "Modificado por: [Nome]" no footer do modal de demanda
- ✅ Indicador discreto e não intrusivo no footer
- ✅ Notificações acionadas após atualização de responsáveis
- ✅ Logs de debug implementados para rastreamento

### Fase 4 - Sistema de Cargos e Permissões
- [x] Sistema de gerenciamento de cargos implementado ✅
- [x] Cargo `Operador` criado automaticamente com todas permissões habilitadas ✅
- [x] Todos usuários migrados para `cargo_id = Operador` ✅
- [x] Sistema de permissões por cargo funcionando ✅
- [x] Validação de permissões no backend (403) ✅
- [x] Validação de permissões no frontend (redirect para `/`) ✅
- [x] Página `/cargos` com salvar em lote + reassignment obrigatório ao excluir com usuários ✅

**Validações Realizadas (18/12/2025)**:
- ✅ Migration `20251218_phase4_roles` criada e aplicada com sucesso
- ✅ Tabela `Cargo` criada com 6 flags de permissão + timestamps
- ✅ Model `Usuario` migrado de `cargo: String?` para `cargo_id: String` (FK)
- ✅ Model `TarefaStatus` migrado de `cargo_responsavel: String?` para `cargo_responsavel_id: String?` (FK)
- ✅ Cargo `Operador` criado com todas permissões `true` no seed da migration
- ✅ Todos usuários existentes atribuídos ao cargo `Operador` automaticamente
- ✅ Middleware `requireCargoPermission` implementado e aplicado nas rotas protegidas
- ✅ Backend retornando 403 (não erro genérico) quando sem permissão
- ✅ Rotas `/api/templates`, `/api/acoes`, `/api/usuarios`, `/api/cargos` protegidas por permissões
- ✅ Rota `DELETE /api/demandas/:id` protegida por `deletar_demandas`
- ✅ API `/api/public/usuarios` e `/api/public/cargos` criadas (auth-only, sem gestão)
- ✅ Repository `CargoRepository` criado com operações CRUD
- ✅ Endpoint `PUT /api/cargos/batch` implementado (salvar em lote transacional)
- ✅ Exclusão de cargo com usuários exige reassignment obrigatório
- ✅ Frontend: `AuthContext` carregando cargo e permissões do usuário logado
- ✅ Frontend: Componente `PermissionRoute` redirecionando para `/` quando sem permissão (sem erro)
- ✅ Frontend: Menu lateral ocultando Templates/Ações/Usuários conforme permissões
- ✅ Frontend: Página `/cargos` implementada com staged + salvar em lote
- ✅ Frontend: Botão "Cargos" adicionado na página `/usuarios` com navegação
- ✅ Frontend: Botão deletar demanda oculto quando `deletar_demandas=false`
- ✅ Frontend: `ResponsavelSelect` filtrando cargos por `cargo_disponivel_como_responsavel`
- ✅ Frontend: `ResponsavelSelect` filtrando usuários por `usuarios_disponiveis_como_responsaveis`
- ✅ Backend: `db.helpers.js` atualizado para trabalhar com `Cargo.id` em vez de strings hardcoded
- ✅ Backend: `demanda.service.js` atualizado para usar `cargo_responsavel_id` (FK)
- ✅ Backend: `notification.service.js` atualizado para resolver cargos via FK
- ✅ Testes realizados: migrations aplicadas, cargo Operador criado, permissões funcionando

### Fase 5 - WebSockets
- [x] Socket.io integrado no backend ✅
- [x] Eventos sendo emitidos em mudanças ✅
- [x] Frontend conectado e recebendo eventos ✅
- [x] Sincronização funcionando entre múltiplos usuários ✅
- [x] Reconexão automática funcionando ✅
- [x] UI refletindo mudanças de demanda sem refresh (corrigido memo do Kanban) ✅
- [x] Mitigação de conflito: merge por campo em updates (patch + apply no backend) ✅

**Validações Realizadas (18/12/2025)**:
- ✅ Conexão WebSocket autenticada via JWT (logs `[WS] Conectado userId=...`)
- ✅ Eventos `demanda:created/updated/deleted` recebidos pelo frontend e aplicados no estado
- ✅ Painel de Demandas atualiza em tempo real sem trocar de página/refresh
- ✅ Teste de concorrência: usuário A altera `observacoes` e usuário B altera um campo; o último save **não** sobrescreve o campo do outro (merge por delta)

---

## 📝 Notas Importantes

### Migração Total (Sem Meio-Termo)
- **NÃO** haverá compatibilidade com JSON-Server após Fase 1
- Migração será completa e direta
- Todos os serviços serão atualizados simultaneamente

### Variáveis de Ambiente
- Variáveis de conexão do banco ficarão **diretas no docker-compose.yml**
- Não usar arquivo `.env` separado para banco (apenas para SMTP/WhatsApp)
- Documentação completa em cada fase

### Qualidade e Testes
- Cada fase deve ser testada completamente antes de avançar
- Rollback plan documentado em cada fase
- Commits pequenos e frequentes

---

## 🔗 Links Úteis

- [Documentação Docker](./DOCKER.md)
- [Documentação de Segurança](./SECURITY.md)
- [Design System Frontend](./frontend/DESIGN_SYSTEM.md)
- [Cursor Rules](../.cursorrules)

---

**Última Atualização**: 18 de Dezembro de 2025  
**Versão do Plano**: 4.1

---

## 📝 Notas da Fase 1

### Problemas Encontrados e Resolvidos

1. **OpenSSL no Alpine Linux**: 
   - Problema: Prisma precisava de OpenSSL 1.1 no container Alpine
   - Solução: Adicionado `openssl` e `libc6-compat` no Dockerfile

2. **Migration no Startup**:
   - Problema: Script `start` tentava aplicar migrations antes de criá-las
   - Solução: Removido `prisma migrate deploy` do script `start`, migrations devem ser criadas manualmente primeiro

3. **Prisma Client Generation**:
   - Problema: Prisma Client não estava sendo gerado corretamente
   - Solução: Adicionado `prisma generate` no `postinstall` e no Dockerfile

### Próximos Passos Recomendados

1. Executar script de migração de dados do `db.json` para PostgreSQL
2. Validar todos os dados migrados
3. Testar todas as rotas da API
4. ~~Iniciar Fase 2 (Login Completo)~~ ✅ Concluído

---

## 📝 Notas da Fase 2

### Problemas Encontrados e Resolvidos

1. **Dependência Circular no Frontend**: 
   - Problema: DataContext tentava carregar dados antes da autenticação, causando 401 e disparando logout
   - Solução: DataContext agora verifica `isAuthenticated` antes de fazer requisições

2. **Senhas não Hasheadas na Atualização**:
   - Problema: Ao atualizar senha na página de usuários, senha era salva em texto plano
   - Solução: Helper `frontendToBackend` agora faz hash da senha antes de salvar

3. **Login Case-Sensitive**:
   - Problema: Login "Nubia" (com maiúscula) não funcionava
   - Solução: Busca de login agora é case-insensitive no repository

4. **Erro de Inicialização no Frontend**:
   - Problema: Erro "can't access lexical declaration before initialization"
   - Solução: Reordenação de funções no AuthContext e uso de callback inline no useEffect

### Implementações Realizadas

- ✅ Backend: Auth service completo com bcrypt e JWT
- ✅ Backend: Middleware de autenticação aplicado em todas rotas protegidas
- ✅ Backend: Rotas de autenticação (login, register, /me)
- ✅ Backend: Script de migração/reset de senhas
- ✅ Frontend: AuthContext com gerenciamento completo de autenticação
- ✅ Frontend: Página de Login com validação
- ✅ Frontend: ProtectedRoute para proteger rotas
- ✅ Frontend: API Service com interceptação de 401
- ✅ Frontend: Indicador de usuário logado e logout no Layout

### Próximos Passos Recomendados

1. Configurar JWT_SECRET seguro em produção (gerar com `openssl rand -hex 64`)
2. ~~Iniciar Fase 3 (Controle de Responsáveis e Auditoria)~~ ✅ Concluído

---

## 📝 Notas da Fase 3

### Problemas Encontrados e Resolvidos

1. **Migration no Container Docker**: 
   - Problema: Migration precisa ser executada dentro do container, não na pasta local
   - Solução: Comando correto: `docker exec -it demand-flow-backend npm run prisma:migrate:dev -- --name add_demanda_modificado_por`

2. **Banco de Dados Vazio Após Migration**:
   - Problema: Após migration, banco estava vazio e login não funcionava
   - Solução: Executado script de migração do `db.json` para PostgreSQL e reset de senhas para "123"

3. **Lógica de Atualização de Responsáveis**:
   - Problema: Atualização automática ocorria mesmo quando usuário mudava manualmente o responsável
   - Solução: Lógica ajustada para atualizar apenas quando `concluida` muda, respeitando mudança manual de responsável

4. **Comparação de Estado de Tarefas**:
   - Problema: Comparação entre estado anterior e novo estado não considerava todos os cenários
   - Solução: Lógica refinada para detectar mudanças em `concluida` vs mudança apenas em `responsavel_id`

### Implementações Realizadas

- ✅ Schema Prisma atualizado com campo `modificado_por_id` e relação `modificado_por`
- ✅ Migration criada e aplicada com sucesso
- ✅ Backend: Lógica de atualização automática de responsáveis implementada
- ✅ Backend: Registro de `modificado_por_id` em todas atualizações
- ✅ Backend: Logs de debug detalhados para rastreamento
- ✅ Backend: Repository atualizado para incluir `modificado_por` em todas queries
- ✅ Frontend: Interface `Demanda` atualizada com novos campos
- ✅ Frontend: Indicador "Modificado por" exibido no footer do modal
- ✅ Validação: Funcionalidade testada e funcionando corretamente

### Comportamento Implementado

- **Atualização Automática**: Quando usuário marca/desmarca tarefa como concluída, responsável atualiza automaticamente para o usuário logado (se diferente)
- **Respeito à Escolha Manual**: Quando usuário apenas muda o responsável da tarefa (sem mudar `concluida`), a escolha é respeitada e não sobrescrita
- **Rastreabilidade**: Todas as modificações em demandas são rastreadas com `modificado_por_id`
- **Indicador Visual**: Footer do modal mostra discretamente quem modificou a demanda pela última vez

### Próximos Passos Recomendados

1. Remover logs de debug após validação completa (opcional)
2. ~~Iniciar Fase 4 (Sistema de Cargos e Permissões)~~ ✅ Concluído

---

## 📝 Notas da Fase 4

### Implementações Realizadas

- ✅ Schema Prisma atualizado: criado model `Cargo` com 6 flags de permissão
- ✅ Migration `20251218_phase4_roles` criada e aplicada com sucesso
- ✅ Tabela `Cargo` com relacionamentos para `Usuario` e `TarefaStatus`
- ✅ Seed automático criando cargo `Operador` com todas permissões e atribuindo a todos usuários
- ✅ Backend: Middleware de permissões (`requireCargoPermission`) implementado
- ✅ Backend: Rotas protegidas por permissões retornando 403 (comportamento esperado)
- ✅ Backend: API de cargos com operação transacional de salvar em lote
- ✅ Backend: Endpoints públicos (`/api/public/*`) para dados básicos usados pela UI
- ✅ Frontend: `AuthContext` carregando cargo e permissões do usuário logado
- ✅ Frontend: Componente `PermissionRoute` redirecionando para `/` quando sem permissão
- ✅ Frontend: Menu lateral ocultando itens conforme permissões
- ✅ Frontend: Página `/cargos` implementada com staged + salvar em lote
- ✅ Frontend: Filtros de responsáveis respeitando flags de permissão de cargo
- ✅ Frontend: Ação de deletar demanda oculta quando sem permissão

### Problemas Encontrados e Resolvidos

1. **Healthcheck do Frontend (IPv6)**:
   - Problema: Container do frontend marcado como unhealthy devido ao healthcheck usando `localhost` (resolvia para IPv6 `::1`)
   - Solução: Configurado Nginx para escutar também em IPv6 (`listen [::]:80 ipv6only=on;`)

2. **Migration de Cargos Legados**:
   - Problema: Script de migração precisava lidar com cargos como strings hardcoded (`'operador'`, `'administrador'`, etc.)
   - Solução: Script atualizado para mapear strings legadas para IDs de cargos reais após criação

3. **Filtro de Responsáveis**:
   - Problema: Selects de responsável mostravam todos os cargos/usuários, independente das flags
   - Solução: `ResponsavelSelect` atualizado para filtrar baseado em `cargo_disponivel_como_responsavel` e `usuarios_disponiveis_como_responsaveis`

### Comportamento Implementado

- **Controle de Acesso**: Páginas protegidas redirecionam para `/` quando sem permissão (sem mostrar erro genérico)
- **Salvar em Lote**: Página de cargos permite criar/renomear/excluir múltiplos cargos e salvar tudo de uma vez (transacional)
- **Reassignment Obrigatório**: Ao excluir cargo com usuários, sistema exige escolher cargo destino válido
- **Filtros de Responsáveis**: Cargos e usuários aparecem nos selects apenas se tiverem flags habilitadas
- **Seed Automático**: Migration cria automaticamente cargo `Operador` com todas permissões e atribui a todos usuários existentes

### Próximos Passos Recomendados

1. Considerar adicionar permissões granulares (ex: editar vs visualizar templates)
2. Implementar auditoria de mudanças de permissões (opcional)
3. Considerar UI para visualizar histórico de mudanças em cargos (opcional)

