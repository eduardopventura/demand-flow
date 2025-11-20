# 🌳 Estrutura do Projeto - Demand Flow

## 📁 Visão Geral

```
demand-flow/
├── 📄 Documentação
│   ├── README.md                    # Getting started
│   ├── IMPROVEMENTS.md              # ✨ Guia de melhorias
│   ├── SECURITY.md                  # 🔒 Guia de segurança
│   ├── CHANGELOG.md                 # 📋 Histórico de versões
│   ├── FILES_CHANGED.md             # 🔧 Lista de mudanças
│   ├── SUMMARY.md                   # 📊 Resumo executivo
│   └── PROJECT_STRUCTURE.md         # 🌳 Este arquivo
│
├── ⚙️ Configuração
│   ├── package.json                 # Dependências
│   ├── tsconfig.json                # ✅ TypeScript strict
│   ├── vite.config.ts               # Vite config
│   ├── tailwind.config.ts           # Tailwind CSS
│   ├── postcss.config.js            # PostCSS
│   ├── eslint.config.js             # ESLint
│   └── components.json              # shadcn/ui
│
└── src/                             # Código fonte
    │
    ├── 📦 types/                    # ✨ NOVO - Tipos centralizados
    │   └── index.ts                 # Enums e Interfaces
    │       ├── StatusDemanda enum
    │       ├── Prioridade enum
    │       ├── TipoCampo enum
    │       ├── Usuario interface
    │       ├── Template interface
    │       ├── Demanda interface
    │       └── DataContextType
    │
    ├── 📦 constants/                # ✨ NOVO - Constantes
    │   └── index.ts
    │       ├── STORAGE_KEYS
    │       ├── STATUS_CONFIG
    │       ├── PRIORIDADE_CONFIG
    │       ├── NAVIGATION_ITEMS
    │       ├── CHART_COLORS
    │       └── FIELD_TYPE_OPTIONS
    │
    ├── 📦 services/                 # ✨ NOVO - Services
    │   └── storage.service.ts       # StorageService singleton
    │       ├── getUsuarios()
    │       ├── setUsuarios()
    │       ├── getTemplates()
    │       ├── setTemplates()
    │       ├── getDemandas()
    │       ├── setDemandas()
    │       ├── clearAll()
    │       └── hasData()
    │
    ├── 📦 schemas/                  # ✨ NOVO - Validações
    │   └── validation.schemas.ts    # Schemas Zod
    │       ├── usuarioSchema
    │       ├── templateSchema
    │       ├── demandaSchema
    │       ├── campoPreenchimentoSchema
    │       ├── tarefaSchema
    │       └── validateDemandaFields()
    │
    ├── 📦 hooks/                    # Custom hooks
    │   ├── use-mobile.tsx           # Hook mobile detection
    │   ├── use-toast.ts             # Hook toast
    │   ├── useDebounce.ts           # ✨ NOVO - Debouncing
    │   ├── useLocalStorage.ts       # ✨ NOVO - localStorage
    │   └── useConfirm.ts            # ✨ NOVO - Confirmações
    │
    ├── 📦 utils/                    # ✨ NOVO - Utilitários
    │   └── errorHandling.ts
    │       ├── AppError class
    │       ├── handleError()
    │       ├── safeJSONParse()
    │       ├── validateRequiredFields()
    │       └── retry()
    │
    ├── 📦 contexts/                 # React Context
    │   └── DataContext.tsx          # 🔧 REFATORADO
    │       ├── useData hook
    │       ├── DataProvider
    │       └── CRUD operations
    │
    ├── 📦 components/               # Componentes React
    │   │
    │   ├── ErrorBoundary.tsx        # ✨ NOVO - Error boundary
    │   ├── Layout.tsx               # Layout principal
    │   ├── NavLink.tsx              # Link de navegação
    │   │
    │   ├── kanban/                  # Componentes Kanban
    │   │   ├── DemandaCard.tsx      # 🔧 OTIMIZADO - React.memo
    │   │   └── KanbanColumn.tsx     # 🔧 OTIMIZADO - React.memo
    │   │
    │   ├── modals/                  # Modais
    │   │   ├── NovaDemandaModal.tsx
    │   │   ├── DetalhesDemandaModal.tsx
    │   │   └── EditorTemplateModal.tsx
    │   │
    │   └── ui/                      # shadcn/ui components
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── ... (20+ componentes)
    │       └── toaster.tsx
    │
    ├── 📦 pages/                    # Páginas
    │   ├── Index.tsx                # Página inicial (não usado)
    │   ├── PainelDemandas.tsx       # 🔧 OTIMIZADO - useMemo/useCallback
    │   ├── Templates.tsx            # Gerenciamento de templates
    │   ├── Usuarios.tsx             # Gerenciamento de usuários
    │   ├── Relatorios.tsx           # Relatórios e gráficos
    │   └── NotFound.tsx             # Página 404
    │
    ├── 📦 lib/                      # Bibliotecas auxiliares
    │   └── utils.ts                 # Utilitários UI (cn, etc)
    │
    ├── 🎨 Estilos
    │   ├── index.css                # Estilos globais
    │   └── App.css                  # Estilos do App
    │
    └── 🚀 Entry Points
        ├── main.tsx                 # Entry point React
        ├── App.tsx                  # 🔧 ATUALIZADO - ErrorBoundary
        └── vite-env.d.ts            # Vite types
```

---

## 📊 Legenda

| Símbolo | Significado |
|---------|-------------|
| ✨ NOVO | Arquivo criado na refatoração |
| 🔧 REFATORADO | Arquivo modificado/melhorado |
| 🔧 OTIMIZADO | Performance melhorada |
| 📦 | Pasta/Módulo |
| 📄 | Arquivo de documentação |
| ⚙️ | Arquivo de configuração |
| 🎨 | Arquivo de estilo |
| 🚀 | Entry point |

---

## 🎯 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser/User                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ErrorBoundary                          │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              QueryClientProvider                    │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │             DataProvider                      │  │  │  │
│  │  │  │  ┌────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │         BrowserRouter                   │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │           Routes                  │  │  │  │  │  │
│  │  │  │  │  │  - PainelDemandas                │  │  │  │  │  │
│  │  │  │  │  │  - Templates                     │  │  │  │  │  │
│  │  │  │  │  │  - Usuarios                      │  │  │  │  │  │
│  │  │  │  │  │  - Relatorios                    │  │  │  │  │  │
│  │  │  │  │  └──────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └────────────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DataContext                                │
│                                                                   │
│  State:                      Methods:                            │
│  ├── usuarios[]              ├── addUsuario()                    │
│  ├── templates[]             ├── updateUsuario()                 │
│  └── demandas[]              ├── deleteUsuario()                 │
│                              ├── addTemplate()                    │
│                              ├── updateTemplate()                 │
│                              ├── deleteTemplate()                 │
│                              ├── addDemanda()                     │
│                              ├── updateDemanda()                  │
│                              ├── deleteDemanda()                  │
│                              ├── getTemplate()                    │
│                              └── getUsuario()                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     StorageService                               │
│                                                                   │
│  Methods:                                                        │
│  ├── getUsuarios()          → localStorage                       │
│  ├── setUsuarios()          → localStorage                       │
│  ├── getTemplates()         → localStorage                       │
│  ├── setTemplates()         → localStorage                       │
│  ├── getDemandas()          → localStorage                       │
│  ├── setDemandas()          → localStorage                       │
│  ├── clearAll()             → localStorage                       │
│  └── hasData()              → localStorage                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       localStorage                               │
│                                                                   │
│  Keys:                                                           │
│  ├── "usuarios"    → Usuario[]                                   │
│  ├── "templates"   → Template[]                                  │
│  └── "demandas"    → Demanda[]                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Validação

```
┌─────────────────┐
│  User Input     │
│  (Form)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Zod Schema     │ ← src/schemas/validation.schemas.ts
│  .safeParse()   │
└────────┬────────┘
         │
         ├─── ✅ Valid ───────────────┐
         │                             │
         └─── ❌ Invalid ──────────────┤
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Form Action   │
                              │  or Error      │
                              └────────────────┘
```

---

## 🏗️ Padrões de Arquitetura

### 1. Separation of Concerns
```
types/      → O que são as coisas
constants/  → Valores fixos
services/   → Como fazer as coisas
schemas/    → Como validar as coisas
hooks/      → Lógica reutilizável
components/ → Como mostrar as coisas
pages/      → Onde mostrar as coisas
contexts/   → Como compartilhar as coisas
utils/      → Funções auxiliares
```

### 2. Data Flow
```
User Action
    ↓
Component (validação UI)
    ↓
Zod Schema (validação dados)
    ↓
Context (gerenciamento estado)
    ↓
Service (persistência)
    ↓
localStorage
```

### 3. Type Safety
```
types/index.ts (definição)
    ↓
[Usado em todo o projeto]
    ↓
TypeScript Compiler (verificação)
    ↓
✅ Zero erros de tipo
```

---

## 📈 Crescimento da Estrutura

### Antes (v1.0)
```
src/
├── components/
├── contexts/
├── pages/
└── hooks/ (apenas 2)
```

### Depois (v2.0)
```
src/
├── types/          ✨ NOVO
├── constants/      ✨ NOVO
├── services/       ✨ NOVO
├── schemas/        ✨ NOVO
├── utils/          ✨ NOVO
├── hooks/          (expandido)
├── components/     (otimizado)
├── contexts/       (refatorado)
└── pages/          (otimizado)
```

**+5 novos módulos** organizando o código!

---

## 🎯 Onde Encontrar...

| Preciso de... | Vá para... |
|--------------|-----------|
| Definição de tipos | `src/types/index.ts` |
| Constantes/configs | `src/constants/index.ts` |
| Acesso ao localStorage | `src/services/storage.service.ts` |
| Validar formulário | `src/schemas/validation.schemas.ts` |
| Hook customizado | `src/hooks/` |
| Tratamento de erro | `src/utils/errorHandling.ts` |
| Componente UI | `src/components/ui/` |
| Componente Kanban | `src/components/kanban/` |
| Modal | `src/components/modals/` |
| Página | `src/pages/` |
| Gerenciar estado global | `src/contexts/DataContext.tsx` |

---

## 🚀 Como Adicionar...

### Uma Nova Entidade

1. **Definir tipo** em `src/types/index.ts`:
   ```typescript
   export interface MinhaEntidade {
     id: string;
     nome: string;
     // ...
   }
   ```

2. **Adicionar schema** em `src/schemas/validation.schemas.ts`:
   ```typescript
   export const minhaEntidadeSchema = z.object({
     nome: z.string().min(1),
     // ...
   });
   ```

3. **Adicionar ao service** em `src/services/storage.service.ts`:
   ```typescript
   getMinhasEntidades(): MinhaEntidade[] {
     return this.getItem<MinhaEntidade[]>("minhasEntidades") || [];
   }
   ```

4. **Adicionar ao context** em `src/contexts/DataContext.tsx`:
   ```typescript
   const [minhasEntidades, setMinhasEntidades] = useState<MinhaEntidade[]>(() =>
     storageService.getMinhasEntidades()
   );
   ```

### Um Novo Hook

Criar em `src/hooks/useMeuHook.ts`:
```typescript
import { useState, useEffect } from "react";

export function useMeuHook() {
  // ...
  return { /* ... */ };
}
```

### Uma Nova Página

1. Criar em `src/pages/MinhaPage.tsx`
2. Adicionar rota em `src/App.tsx`:
   ```typescript
   <Route path="minha-page" element={<MinhaPage />} />
   ```

---

## 📚 Documentação por Módulo

### types/
Define todas as interfaces e enums do projeto. É a fonte única da verdade para tipos.

### constants/
Valores que não mudam durante a execução. Evita magic strings e centraliza configurações.

### services/
Camada de abstração para operações de I/O (atualmente localStorage, futuramente API).

### schemas/
Validações runtime com Zod. Garante que dados inválidos não entrem no sistema.

### hooks/
Lógica reutilizável que pode ser compartilhada entre componentes.

### utils/
Funções auxiliares puras que não dependem de React.

### components/
Componentes React divididos em:
- `ui/` - Componentes base (shadcn/ui)
- `kanban/` - Componentes específicos do Kanban
- `modals/` - Componentes de modal
- Raiz - Componentes gerais (Layout, ErrorBoundary)

### contexts/
Gerenciamento de estado global com Context API.

### pages/
Componentes de página que são renderizados pelas rotas.

---

## 🎉 Estrutura Final

Uma estrutura **clara**, **escalável** e **profissional**!

```
✅ Organizada por responsabilidade
✅ Fácil de navegar
✅ Fácil de escalar
✅ Fácil de testar
✅ Fácil de manter
```

**Pronto para crescer! 🚀**
