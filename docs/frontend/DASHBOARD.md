# Dashboard de Relatórios

O dashboard de relatórios (`/relatorios`) oferece uma visão completa das métricas e análises de demandas do sistema.

## Arquitetura

```
frontend/src/
├── pages/
│   └── Relatorios.tsx          # Página principal do dashboard
└── utils/
    └── dashboard/
        ├── index.ts            # Exports centralizados
        ├── filters.ts          # Tipos e funções de filtragem
        └── aggregations.ts     # Funções de cálculo de métricas
```

## Filtros Disponíveis

### Período
- **Últimos 3 meses**: demandas criadas nos últimos 3 meses
- **Últimos 6 meses**: demandas criadas nos últimos 6 meses (padrão)
- **Últimos 12 meses**: demandas criadas nos últimos 12 meses
- **Todo o período**: todas as demandas sem filtro de data
- **Personalizado**: permite selecionar data início e data fim

### Usuário
- Filtra demandas pelo `responsavel_id`
- Opção "Todos os usuários" para não filtrar

### Tipo/Template
- Filtra demandas pelo `template_id`
- Opção "Todos os tipos" para não filtrar

### Status
- **Criada**: demandas no status inicial
- **Em Andamento**: demandas em progresso
- **Finalizada**: demandas concluídas
- Opção "Todos os status" para não filtrar

### Prazo
- **Dentro do prazo**: demandas com `prazo=true` ou já finalizadas
- **Em atraso**: demandas com `prazo=false` E não finalizadas
- Opção "Todos" para não filtrar

## KPIs (Indicadores)

### Total
Quantidade total de demandas após aplicação dos filtros.

### Taxa de Conclusão
```
(demandas finalizadas / total de demandas) × 100
```
Percentual de demandas que foram concluídas.

### Criadas
Quantidade de demandas com status "Criada".

### Em Andamento
Quantidade de demandas com status "Em Andamento".

### Finalizadas
Quantidade de demandas com status "Finalizada".

### Em Atraso
Quantidade de demandas que:
- `prazo = false` (fora do prazo)
- `status ≠ "Finalizada"` (não concluídas)

### Tempo Médio de Conclusão
Média de dias entre `data_criacao` e `data_finalizacao` das demandas finalizadas.

```
Σ (data_finalizacao - data_criacao) / quantidade de finalizadas
```

Considera apenas demandas finalizadas com `data_finalizacao` preenchida.

## Gráficos

### Evolução Temporal (Linha)
- **Eixo X**: meses
- **Linha Azul**: demandas criadas por mês (baseado em `data_criacao`)
- **Linha Verde**: demandas concluídas por mês (baseado em `data_finalizacao`)

### Demandas por Mês (Barras)
- **Barras Azuis**: criadas
- **Barras Amarelas**: em andamento
- **Barras Verdes**: concluídas

### Distribuição por Tipo (Pizza)
Percentual de demandas por template/tipo.

### Top 10 - Demandas por Usuário (Barras Horizontais)
Ranking dos 10 usuários com mais demandas atribuídas.

### Taxa de Conclusão por Usuário (Barras)
Percentual de conclusão por usuário (finalizadas/total × 100).

### Quantidade por Tipo de Demanda (Barras)
Total de demandas por template.

## Tabela de Demandas

Lista as demandas filtradas com as colunas:
- Nome
- Tipo (template)
- Responsável
- Status
- Data de Criação
- Data de Previsão
- Situação do Prazo

**Limite**: mostra até 50 registros na tela. Para ver todos, use o export CSV.

## Exportação CSV

O arquivo CSV exportado inclui:
- ID
- Nome
- Template
- Status
- Responsável
- Data Criação (dd/MM/yyyy)
- Data Previsão (dd/MM/yyyy)
- Data Finalização (dd/MM/yyyy)
- Tempo em dias
- Situação do prazo

**Importante**: o export respeita todos os filtros ativos.

## Tipos TypeScript

### DashboardFilters
```typescript
interface DashboardFilters {
  periodoPreset: "3" | "6" | "12" | "all" | "custom";
  dataInicio: Date | null;
  dataFim: Date | null;
  usuarioId: string | null;
  templateId: string | null;
  status: StatusDemanda[];
  prazo: "all" | "dentro" | "atrasado";
}
```

### DashboardKPIs
```typescript
interface DashboardKPIs {
  total: number;
  criadas: number;
  emAndamento: number;
  finalizadas: number;
  taxaConclusao: number;
  emAtraso: number;
  tempoMedioConclusao: number;
}
```

## Funções Utilitárias

### filters.ts
- `applyDashboardFilters(demandas, filters)`: aplica todos os filtros
- `hasActiveFilters(filters)`: verifica se há filtros ativos
- `resetFilters()`: retorna filtros para o estado padrão
- `getDataCortePeriodo(preset, customInicio?)`: calcula data de corte

### aggregations.ts
- `computeKPIs(demandas)`: calcula todas as métricas
- `computeBucketsMensais(demandas)`: agrupa por mês para gráficos
- `computeAgrupamentoPorTemplate(demandas, templates)`: agrupa por tipo
- `computeAgrupamentoPorUsuario(demandas, usuarios)`: agrupa por usuário
- `getTopUsuariosPorVolume(agrupamento, limit)`: top N usuários
- `getUsuariosPorTaxaConclusao(agrupamento)`: ordena por taxa

## Responsividade

- KPIs: 2 colunas (mobile) → 7 colunas (desktop)
- Gráficos: 1 coluna (mobile) → 2 colunas (desktop)
- Filtros: empilhados (mobile) → inline (desktop)
- Tabela: scroll horizontal em telas pequenas

