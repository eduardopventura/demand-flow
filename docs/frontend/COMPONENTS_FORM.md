# Componentes de Formulário

Componentes reutilizáveis para formulários de demandas e templates.

## CampoInput

Renderiza campos de preenchimento baseado no tipo definido no template.

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `campo` | `CampoPreenchimento` | Definição do campo do template |
| `value` | `string` | Valor atual do campo |
| `onChange` | `(value: string) => void` | Callback quando o valor muda |
| `showCurrentValue` | `boolean` | Mostrar valor atual (para arquivos) |

### Tipos suportados

- `texto` - Input de texto simples
- `numero` - Input numérico (validação para aceitar apenas números)
- `numero_decimal` - Input numérico decimal brasileiro (vírgula, 2 decimais, digitação da direita)
- `data` - Date picker
- `arquivo` - Upload de arquivo com preview
- `dropdown` - Select com opções pré-definidas

### Exemplo

```tsx
import { CampoInput } from "@/components/form";

<CampoInput
  campo={campo}
  value={camposValores[campo.id_campo] || ""}
  onChange={(valor) => handleCampoChange(campo.id_campo, valor)}
/>
```

---

## ResponsavelSelect

Select combinado para seleção de responsável (cargos + usuários).

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `value` | `string` | ID do responsável selecionado |
| `onValueChange` | `(value: string) => void` | Callback quando a seleção muda |
| `placeholder` | `string` | Texto placeholder |
| `defaultResponsavelId` | `string` | ID do responsável padrão (destacado) |
| `triggerClassName` | `string` | Classes CSS do trigger |
| `includeCargos` | `boolean` | Se deve incluir cargos |

### Exemplo

```tsx
import { ResponsavelSelect } from "@/components/form";

<ResponsavelSelect
  value={responsavelId}
  onValueChange={setResponsavelId}
  placeholder="Selecione um responsável"
/>
```

---

## GrupoCampos

Renderiza grupo de campos com suporte a múltiplas réplicas e condições de visibilidade.

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `grupo` | `CampoPreenchimento` | Definição do grupo |
| `qtdReplicas` | `number` | Quantidade de réplicas |
| `camposValores` | `Record<string, string>` | Valores dos campos |
| `onCampoChange` | `(fieldKey: string, valor: string) => void` | Callback de mudança |
| `onReplicaChange` | `(grupoId: string, qtd: number) => void` | Callback de réplicas |
| `showObrigatorio` | `boolean` | Mostrar indicador de obrigatório |
| `viewMode` | `boolean` | Modo de visualização |

### Funcionalidades

- ✅ Suporte a múltiplas réplicas (até 20)
- ✅ Condições de visibilidade para campos dentro do grupo
- ✅ Avaliação de visibilidade considera valores dos campos da mesma réplica
- ✅ Campos não visíveis não são renderizados

### Exemplo

```tsx
import { GrupoCampos } from "@/components/form";

<GrupoCampos
  grupo={grupo}
  qtdReplicas={grupoReplicas[grupo.id_campo] || 1}
  camposValores={camposValores}
  onCampoChange={handleCampoChange}
  onReplicaChange={handleReplicaChange}
/>
```

