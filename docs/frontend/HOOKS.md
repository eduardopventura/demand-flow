# Custom Hooks

Hooks personalizados para gerenciamento de estado e lógica de formulários.

## useGrupoReplicas

Gerencia a quantidade de réplicas de grupos de campos e os valores associados.

### Retorno

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `grupoReplicas` | `Record<string, number>` | Mapa de grupoId -> quantidade |
| `handleReplicaChange` | `Function` | Atualiza quantidade de réplicas |
| `initializeReplicas` | `Function` | Inicializa réplicas de campos |
| `setGrupoReplicas` | `Dispatch` | Setter direto |

### Exemplo

```tsx
import { useGrupoReplicas } from "@/hooks/useGrupoReplicas";

const { grupoReplicas, handleReplicaChange, initializeReplicas } = useGrupoReplicas();

// Inicializar baseado em template
useEffect(() => {
  if (template) {
    const { replicas, valores } = initializeReplicas(
      template.campos_preenchimento,
      demanda?.campos_preenchidos
    );
    setGrupoReplicas(replicas);
    setCamposValores(valores);
  }
}, [template]);
```

---

## useCamposForm

Gerencia estado de formulário de campos, incluindo visibilidade condicional e validação.

### Opções

| Opção | Tipo | Descrição |
|-------|------|-----------|
| `template` | `Template \| null` | Template selecionado |
| `initialValues` | `Record<string, string>` | Valores iniciais |

### Retorno

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `camposValores` | `Record<string, string>` | Valores dos campos |
| `setCamposValores` | `Dispatch` | Setter de valores |
| `handleCampoChange` | `Function` | Atualiza um campo |
| `getCamposVisiveis` | `Function` | Retorna campos visíveis para uma aba |
| `abas` | `AbaTemplate[]` | Abas do template |
| `abaAtiva` | `string` | Aba atual |
| `setAbaAtiva` | `Dispatch` | Setter de aba ativa |
| `validarCamposObrigatorios` | `Function` | Valida campos obrigatórios |

### Exemplo

```tsx
import { useCamposForm } from "@/hooks/useCamposForm";

const {
  camposValores,
  handleCampoChange,
  getCamposVisiveis,
  abas,
  abaAtiva,
  setAbaAtiva,
  validarCamposObrigatorios
} = useCamposForm({ template: templateSelecionado });

// Renderizar campos da aba ativa
const camposVisiveis = getCamposVisiveis(abaAtiva);

// Validar antes de submeter
const { valido, camposFaltando } = validarCamposObrigatorios(grupoReplicas);
if (!valido) {
  toast.error(`Campos faltando: ${camposFaltando.join(", ")}`);
  return;
}
```

