# Página de Finalizadas

A página de Finalizadas (`/finalizadas`) oferece uma consulta completa de todas as demandas finalizadas do sistema, com filtros avançados e ordenação configurável.

## Acesso

- **Menu Lateral**: Item "Finalizadas" no menu de navegação
- **Painel de Demandas**: Link "Ver todas" na coluna de Finalizadas (quando houver mais de 15)

## Funcionalidades

### Filtros

**1. Busca por Nome**
- Campo de busca que filtra demandas pelo nome
- Busca case-insensitive
- Busca em tempo real conforme digitação

**2. Filtro por Template**
- Dropdown com todos os templates disponíveis
- Opção "Todos os templates" para não filtrar
- Filtra demandas pelo `template_id`

**3. Filtro por Responsável**
- Dropdown com todos os usuários do sistema
- Opção "Todos os responsáveis" para não filtrar
- Filtra demandas pelo `responsavel_id`

**4. Botão Limpar Filtros**
- Aparece quando há filtros ativos
- Limpa todos os filtros de uma vez

### Ordenação

A ordenação é configurável via dropdown com as seguintes opções:

**1. Data (mais recente)**
- Ordena por `data_finalizacao` decrescente
- Ordenação secundária: alfabética (ignorando template)
- Demandas sem data de finalização ficam por último

**2. Data (mais antiga)**
- Ordena por `data_finalizacao` crescente
- Ordenação secundária: alfabética (ignorando template)
- Demandas sem data de finalização ficam por último

**3. Nome (A-Z)**
- Ordena alfabeticamente pelo nome
- Ignora o nome do template (extrai parte após " - ")
- Demandas que só têm nome do template ficam por último

**4. Nome (Z-A)**
- Ordena alfabeticamente inverso pelo nome
- Ignora o nome do template (extrai parte após " - ")
- Demandas que só têm nome do template ficam por último

### Layout

- **Grid Responsivo**: 1 coluna (mobile), 2 colunas (tablet), 3 colunas (desktop)
- **Cards**: Mesmos cards do painel Kanban para consistência visual
- **Contador**: Mostra quantidade de demandas filtradas vs total
- **Estado Vazio**: Mensagem quando não há demandas ou não há resultados com os filtros

## Ordenação Padrão no Painel

No painel de demandas, as finalizadas são ordenadas automaticamente:
1. Data de finalização decrescente (mais recente primeiro)
2. Ordem alfabética do nome (ignorando template)
3. Limitadas a 15 últimas para melhor performance

## Extração do Nome

A função `extrairNomeSemTemplate` extrai apenas a parte relevante do nome:

- **Nome completo**: `"Gerar Contrato - João Silva"`
- **Nome extraído**: `"João Silva"`

- **Nome completo**: `"Gerar Contrato"`
- **Nome extraído**: `null` (fica por último na ordenação alfabética)

## Arquitetura

```
frontend/src/
├── pages/
│   └── Finalizadas.tsx          # Página principal
└── utils/
    └── prazoUtils.ts            # Funções de ordenação
        ├── ordenarDemandasFinalizadas()
        └── extrairNomeSemTemplate()
```

## Integração

A página utiliza:
- `useData()` para acessar demandas, templates e usuários
- `DemandaCard` para exibição consistente
- `DetalhesDemandaModal` para visualização completa
- Funções de ordenação de `prazoUtils.ts`

