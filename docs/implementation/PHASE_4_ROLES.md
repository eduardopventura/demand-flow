# Fase 4: Sistema de Cargos e Permissões (Simplificado)

**Status**: ✅ Concluída  
**Prioridade**: 🟠 Alta  
**Complexidade**: Média  
**Duração Estimada**: 4-7 dias

**Dependências**: Fase 2 (Login) e Fase 3 (Controle de Responsáveis) concluídas.

---

## 🎯 Objetivo

Implementar **cargos persistidos no banco** (tabela `Cargo`) e **permissões por cargo** para:

- Controlar acesso às páginas **Templates**, **Ações**, **Usuários** e **Cargos**
- Controlar a ação de **Deletar Demandas**
- Controlar quem aparece como **responsável** (cargo e usuários)
- Garantir que “sem acesso” **não seja erro do sistema**: no frontend deve **redirecionar para o Painel de Demandas (`/`)**

---

## ✅ Escopo (v1)

### Páginas sempre liberadas (acesso total)

Independentemente do cargo, **todos os usuários** têm acesso total a:

- **Painel de Demandas** (`/`)
- **Relatórios** (`/relatorios`)
- **Finalizadas** (`/finalizadas`)

### Páginas controladas por permissão

- **Templates** (`/templates`) → requer `acesso_templates`
- **Ações** (`/acoes`) → requer `acesso_acoes`
- **Usuários** (`/usuarios`) → requer `acesso_usuarios`
- **Cargos** (`/cargos`) → requer `acesso_usuarios` (cargo é gerenciado a partir de Usuários)

### Ações controladas por permissão

- **Deletar demandas** (ex: `DELETE /api/demandas/:id`) → requer `deletar_demandas`

---

## 🔐 Permissões (lista única + descrições)

As permissões do cargo são exatamente estas (todas booleanas):

1. **Acesso Templates** (`acesso_templates`)  
   Permite acessar pagina de template de forma completa

2. **Acesso Ações** (`acesso_acoes`)  
   Permite acessar pagina de ações de forma completa

3. **Acesso Usuarios** (`acesso_usuarios`)  
   Permite acessar pagina de usuarios e cargo de forma completa

4. **Deletar Demandas** (`deletar_demandas`)  
   Permite deletar demandas do sistema

5. **Cargo Disponivel Como Responsavel** (`cargo_disponivel_como_responsavel`)  
   Este cargo deve aparecer na lista de responsaveis nas tarefas

6. **Usuarios Disponiveis como Responsaveis** (`usuarios_disponiveis_como_responsaveis`)  
   Usuarios desse cargo devem aparecer na lista de responsaveis tanto demandas como tarefas

---

## 🗄️ Banco de Dados (Prisma/PostgreSQL)

### Mudanças no schema

Objetivo: sair de `Usuario.cargo` (string) e passar a persistir cargos em tabela.

#### 1) Criar tabela `Cargo`

- `id` (UUID)
- `nome` (string, unique)
- 6 colunas booleanas (permissões)
- `created_at`, `updated_at`

#### 2) Atualizar `Usuario`

- Remover (ou deprecate) `cargo: String?`
- Adicionar:
  - `cargo_id: String` (FK → `Cargo.id`)
  - relação `cargo: Cargo`

#### 3) Atualizar `TarefaStatus`

Hoje existe `cargo_responsavel: String?` para quando `responsavel_id` é null.

Para não quebrar quando um cargo for renomeado, migrar para:

- `cargo_responsavel_id: String?` (FK → `Cargo.id`)
- relação `cargo_responsavel: Cargo?`

> Regra: `responsavel_id` e `cargo_responsavel_id` são alternativas; a UI escolhe uma opção.

### Exemplo de models (referência)

```prisma
model Cargo {
  id   String @id @default(uuid())
  nome String @unique

  acesso_templates                    Boolean @default(false)
  acesso_acoes                        Boolean @default(false)
  acesso_usuarios                     Boolean @default(false)
  deletar_demandas                    Boolean @default(false)
  cargo_disponivel_como_responsavel   Boolean @default(false)
  usuarios_disponiveis_como_responsaveis Boolean @default(false)

  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  usuarios Usuario[]
  tarefasComoCargo TarefaStatus[] @relation("TarefaCargoResponsavel")
}

model Usuario {
  id         String @id @default(uuid())
  // ... campos existentes ...

  cargo_id   String
  cargo      Cargo  @relation(fields: [cargo_id], references: [id])

  @@index([cargo_id])
}

model TarefaStatus {
  id                  String @id @default(uuid())
  // ... campos existentes ...
  responsavel_id      String?

  cargo_responsavel_id String?
  cargo_responsavel    Cargo? @relation("TarefaCargoResponsavel", fields: [cargo_responsavel_id], references: [id])

  @@index([cargo_responsavel_id])
}
```

---

## 🌱 Seed / Migração inicial (primeira implementação)

Requisito: na primeira implementação deve existir cargo **Operador** com **todos os acessos**, e **todos os usuários atuais** devem ser atribuídos a ele.

### Regras do seed/migração

- Criar cargo `Operador` com:
  - `acesso_templates = true`
  - `acesso_acoes = true`
  - `acesso_usuarios = true`
  - `deletar_demandas = true`
  - `cargo_disponivel_como_responsavel = true`
  - `usuarios_disponiveis_como_responsaveis = true`
- Migrar todos os usuários existentes para `cargo_id = Operador.id`

---

## 🧭 Frontend — Navegação e UX

### Rotas existentes (referência do app)

- `/` Painel de Demandas
- `/templates`
- `/acoes`
- `/usuarios`
- `/relatorios`
- `/finalizadas`

### Nova rota

- `/cargos` Página dedicada de cargos

### Acesso à página de Cargos

- Dentro de `/usuarios`, adicionar um **botão “Cargos”** que navega para `/cargos`.
- Dentro de `/cargos`, adicionar um **botão “Voltar para Usuários”** que navega para `/usuarios`.

---

## 🧩 Página `Cargos` — Funcionalidades (v1)

### Componentes/elementos

- Botão **Criar Cargo**
- Botão **Salvar** (salva tudo em lote)
- Lista de **cards expansíveis**, 1 por cargo

### Fluxo: Criar Cargo (staged)

- Clique em **Criar Cargo**
- Abre modal simples com:
  - `nome do cargo`
- Ao confirmar:
  - O cargo é criado **somente no estado local (staged)**, ainda não persiste no banco
  - O card do novo cargo aparece na lista e pode ser configurado (checkboxes)

### Fluxo: Expandir/Resumir

Cada card deve ter botão:

- **Expandir** (mostrar permissões)
- **Resumir/Fechar** (ocultar permissões)

### Fluxo: Renomear

- Ação “Renomear” no card
- Pode ser inline (campo editável) ou modal simples
- A mudança fica **staged** até clicar **Salvar**

### Fluxo: Excluir (com reassignment obrigatório)

Se clicar em **Excluir** em um cargo que possui usuários vinculados:

- Deve abrir um modal exigindo escolher **para qual cargo os usuários serão movidos**
- O usuário só consegue confirmar a exclusão se escolher um cargo destino válido (≠ cargo atual)
- Tanto a realocação quanto a exclusão ficam **staged** até clicar **Salvar**

Se o cargo **não tem usuários vinculados**:

- Excluir pode ser marcado como staged diretamente (sem modal), e só efetiva no **Salvar**

### Permissões no card expandido (checkbox)

Mostrar exatamente estas opções:

- Acesso Templates
- Acesso Ações
- Acesso Usuarios
- Deletar Demandas
- Cargo Disponivel Como Responsavel
- Usuarios Disponiveis como Responsaveis

Todas as alterações são **staged** até clicar **Salvar**.

### Fluxo: Salvar (em lote)

Ao clicar em **Salvar**, persistir em lote:

- Cargos criados (staged)
- Renomes
- Checkboxes alterados
- Exclusões (e reassignment de usuários, quando aplicável)

Se houver erro de validação, mostrar mensagem e **não aplicar parcialmente** (preferir operação transacional no backend).

---

## 🧱 Controle de Acesso (Frontend e Backend)

### 1) Frontend: guard de rotas (não quebrar a UI)

Regra principal: se um usuário tentar abrir uma página sem acesso, o frontend deve:

- **redirecionar para `/`**
- sem exibir “erro” genérico do sistema
- sem criar conflitos na UI (ex: componentes renderizando sem dados esperados)

Aplicar em:

- `/templates` → exige `acesso_templates`
- `/acoes` → exige `acesso_acoes`
- `/usuarios` e `/cargos` → exige `acesso_usuarios`

### 2) Frontend: ocultar/neutralizar ações proibidas

Para ações específicas dentro de páginas (principalmente no Painel):

- Botão/ação de **deletar demanda** deve existir somente se `deletar_demandas` for true

### 3) Backend: proteção de endpoints (regra de negócio, não “bug”)

O backend deve negar o que não for permitido, retornando **403** (sem permissão).

Mapeamento mínimo (v1):

- Endpoints de Templates (`/api/templates/*`) → exigir `acesso_templates`
- Endpoints de Ações (`/api/acoes/*`) → exigir `acesso_acoes`
- Endpoints de Usuários (`/api/usuarios/*`) e Cargos (`/api/cargos/*`) → exigir `acesso_usuarios`
- `DELETE /api/demandas/:id` → exigir `deletar_demandas`

> Importante: o frontend deve tratar 403 como comportamento esperado (não como erro de infraestrutura).

---

## 👥 Filtro de Responsáveis (impacto funcional)

### Listas de responsáveis devem respeitar permissões de cargo

1) **Cargos como responsáveis (tarefas)**  
Um cargo só pode aparecer como opção quando:

- `cargo_disponivel_como_responsavel = true`

2) **Usuários como responsáveis (demandas e tarefas)**  
Um usuário só pode aparecer na lista quando o cargo dele tiver:

- `usuarios_disponiveis_como_responsaveis = true`

> Isso afeta diretamente os selects de responsável usados em demanda/tarefa.

---

## ✅ Critérios de aceite (checklist)

- [ ] Banco possui tabela `Cargo` com as 6 flags e timestamps
- [ ] `Usuario` usa `cargo_id` (FK) e todos os usuários existentes foram migrados para o cargo `Operador`
- [ ] Existe cargo `Operador` com **todas as permissões habilitadas**
- [ ] Rota `/cargos` existe e é acessada via botão em `/usuarios`, com botão de voltar
- [ ] Página Cargos suporta: Criar (staged), Expandir/Resumir, Renomear (staged), Excluir (staged) e Salvar em lote
- [ ] Excluir cargo com usuários exige selecionar cargo destino (reassignment) antes de confirmar
- [ ] Templates/Ações/Usuários/Cargos: sem permissão → redireciona para `/`
- [ ] Painel/Relatórios/Finalizadas: sempre acessíveis
- [ ] Deletar demanda só funciona com `deletar_demandas` (UI + backend)
- [ ] Listas de responsáveis respeitam `cargo_disponivel_como_responsavel` e `usuarios_disponiveis_como_responsaveis`

---

## 🚫 Fora de escopo (v1)

- Não criar “usuário admin padrão”
- Não criar cargos fixos (Admin/Técnico/Operador) — somente seed do Operador inicial
- Não criar tabela separada de permissões (tudo em flags no `Cargo`)
- Não criar permissões para Painel/Relatórios/Finalizadas (sempre liberadas)

---

**Voltar**: [Plano de Implementação](../IMPLEMENTATION_PHASES.md)


