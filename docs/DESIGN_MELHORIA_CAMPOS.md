# Design Doc: Melhorias na Gestão de Campos e Visualização

> **Status:** ✅ Implementado na versão 2.7.0 (Dez/2025)

Este documento detalha as decisões de design e implementação para duas novas funcionalidades principais: **Visibilidade Condicional de Campos** e **Organização por Abas**.

O objetivo é resolver a complexidade visual e de navegação em demandas que possuem muitos campos (ex: "Gerar Contrato", "Teste Diagnóstico"), melhorando a experiência do usuário sem comprometer a estrutura de dados existente.

## 1. Visibilidade Condicional de Campos

Permitir que campos sejam exibidos ou ocultados dinamicamente com base no valor de outros campos.

### 1.1. Modelo de Dados

Será adicionada uma propriedade `condicao_visibilidade` à interface `CampoPreenchimento` no arquivo `src/types/index.ts`.

```typescript
export interface CondicaoVisibilidade {
  campo_id: string;        // ID do campo do qual este depende
  operador: "igual" | "diferente" | "preenchido" | "vazio";
  valor?: string;          // Valor para comparação (ex: "Sim", "Não")
}

export interface CampoPreenchimento {
  // ... campos existentes ...
  condicao_visibilidade?: CondicaoVisibilidade;
}
```

### 1.2. Regras de Negócio e UX

1.  **Avaliação em Tempo Real:** A visibilidade deve ser reavaliada a cada alteração no formulário, **antes** do salvamento no backend. O usuário deve ver o campo aparecer/desaparecer instantaneamente.
2.  **Configuração no Template:**
    *   No modal de edição de template, cada campo terá uma opção "Adicionar Condição".
    *   Ao ativar, o usuário seleciona:
        *   Qual campo "pai" controla a visibilidade (dropdown com outros campos do template).
        *   A condição (ex: "Igual a").
        *   O valor esperado (se o campo pai for dropdown, mostrar as opções dele; se for boolean/checkbox, mostrar Sim/Não; se for texto, input livre).
3.  **Limpeza de Dados:** Quando um campo é ocultado pela condição, seu valor deve ser limpo ou ignorado no salvamento para evitar inconsistências.

## 2. Organização por Abas

Organizar os campos da demanda em abas categorizadas para facilitar a visualização e foco.

### 2.1. Modelo de Dados

O `Template` passará a ter uma definição de abas, e cada `CampoPreenchimento` saberá a quais abas pertence.

```typescript
export interface AbaTemplate {
  id: string;
  nome: string;
  ordem: number; // Para ordenação visual
}

export interface Template {
  // ... campos existentes ...
  abas: AbaTemplate[];
}

export interface CampoPreenchimento {
  // ... campos existentes ...
  abas_ids: string[]; // Um campo pode aparecer em múltiplas abas
}
```

### 2.2. UX de Configuração (Editor de Template)

1.  **Gerenciamento de Abas:**
    *   Haverá uma nova seção "Gerenciar Abas" no topo do editor.
    *   **Aba Padrão:** Todo template nasce com uma aba "Geral". Esta aba não pode ser excluída, mas pode ser renomeada.
    *   **Adicionar/Remover:** Botões simples para criar novas abas e excluir existentes (com validação se houver campos órfãos).
    
2.  **Associação Campo-Aba:**
    *   Dentro do card de edição de cada campo, haverá um componente (ex: MultiSelect ou Checkboxes) para selecionar em quais abas aquele campo deve aparecer, deve sempre existir no topo dessa lista a opção "Todas" que se refere a todas as abas.
    *   **Facilitador:** Ao criar um campo novo, ele já vem marcado na aba "Geral" por padrão.

### 2.3. UX de Visualização (Demanda)

1.  **Modal de Detalhes / Nova Demanda:**
    *   Os campos não serão mais listados em uma única coluna infinita.
    *   Será usado um componente de **Tabs** (Abas) no topo da seção de campos.
    *   Ao clicar em uma aba, apenas os campos associados a ela (e que satisfaçam suas condições de visibilidade) serão renderizados.
2.  **Campos Gerais:** Campos que pertencem a múltiplas abas aparecem em todas elas. Isso é útil para campos-chave como "Nome do Cliente" que podem ser necessários para contexto em várias etapas.
3.  **Tarefas e Abas:** Por enquanto, as tarefas continuam em sua própria seção separada. *Decisão atual: Manter tarefas visíveis sempre, abaixo das abas de dados, pois são o core do fluxo.*

## 3. Estratégia de Migração

Para garantir consistência e evitar lógica de "fallback" complexa no frontend, a migração será feita diretamente nos dados:

1.  **Atualização do `db.json`:** Será criado/executado um script (ou edição manual guiada) para percorrer todos os templates no `db.json`.
2.  **Regra de Migração:**
    *   Para cada template, criar a propriedade `abas` contendo uma única aba: `{ id: "geral", nome: "Geral", ordem: 0 }`.
    *   Para cada campo deste template, adicionar `abas_ids: ["geral"]`.
3.  **Resultado:** O frontend não precisará lidar com templates "sem abas". Todos os templates, novos ou legados, seguirão estritamente a nova interface.

## 4. Próximos Passos (Implementação)

1.  Atualizar interfaces TypeScript em `src/types/index.ts`.
2.  Atualizar `EditorTemplateModal` para suportar criação de abas e configuração de campos (abas + condicional).
3.  Atualizar `NovaDemandaModal` e `DetalhesDemandaModal` para:
    *   Renderizar abas.
    *   Filtrar campos por aba selecionada.
    *   Aplicar lógica de visibilidade condicional em tempo real.
