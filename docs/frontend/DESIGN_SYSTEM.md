# Design System - Frontend

Este documento define os padrões visuais e de design para o frontend do Demand Flow. Todos os componentes e páginas devem seguir estes padrões.

---

## 🎨 Sistema de Cores

### Variáveis CSS (HSL)

Todas as cores são definidas em `frontend/src/index.css` usando variáveis CSS HSL. **NUNCA** use cores hardcoded - sempre use as variáveis do design system.

#### Cores Principais

- **Primary**: `hsl(var(--primary))` - Azul principal (#3B82F6)
- **Secondary**: `hsl(var(--secondary))` - Cinza claro
- **Accent**: `hsl(var(--accent))` - Destaque (mesma cor do primary)
- **Muted**: `hsl(var(--muted))` - Fundos sutis

#### Cores Semânticas

- **Success**: `hsl(var(--success))` - Verde para sucesso
- **Warning**: `hsl(var(--warning))` - Amarelo para avisos
- **Destructive**: `hsl(var(--destructive))` - Vermelho para ações destrutivas

#### Cores de Contexto

- **Background**: `hsl(var(--background))` - Fundo principal
- **Foreground**: `hsl(var(--foreground))` - Texto principal
- **Card**: `hsl(var(--card))` - Fundo de cards
- **Border**: `hsl(var(--border))` - Bordas

#### Cores Kanban

- **Created**: `hsl(var(--kanban-created))` - Fundo da coluna "Criada"
- **Progress**: `hsl(var(--kanban-progress))` - Fundo da coluna "Em Andamento"
- **Finished**: `hsl(var(--kanban-finished))` - Fundo da coluna "Finalizada"

#### Cores Sidebar

- **Sidebar Background**: `hsl(var(--sidebar-background))`
- **Sidebar Foreground**: `hsl(var(--sidebar-foreground))`
- **Sidebar Primary**: `hsl(var(--sidebar-primary))`

### Uso de Cores

```tsx
// ✅ Correto - usar variáveis CSS
<div className="bg-primary text-primary-foreground">
<div className="bg-success/10 border-success/30">
<div className="text-muted-foreground">

// ❌ Errado - cores hardcoded
<div className="bg-blue-500">
<div style={{ color: '#3B82F6' }}>
```

---

## 📐 Espaçamento e Layout

### Padding e Margin

Use as classes do Tailwind seguindo a escala padrão:

- `p-1` = 0.25rem (4px)
- `p-2` = 0.5rem (8px)
- `p-4` = 1rem (16px)
- `p-6` = 1.5rem (24px)
- `p-8` = 2rem (32px)

### Border Radius

- **Padrão**: `rounded-md` (0.375rem / 6px)
- **Cards**: `rounded-lg` (0.5rem / 8px)
- **Botões**: `rounded-md`
- **Inputs**: `rounded-md`
- **Modais**: `rounded-lg` ou `rounded-xl`

---

## 🎭 Componentes de Modais

### Dialog/AlertDialog - Estrutura Base

Todos os modais seguem uma estrutura consistente:

#### DialogContent

```tsx
<DialogContent className="p-0 gap-0 shadow-xl max-h-[90vh] flex flex-col">
```

- `p-0`: Sem padding no container principal
- `gap-0`: Sem gap entre elementos
- `shadow-xl`: Sombra forte para destaque
- `max-h-[90vh]`: Limita altura máxima
- `flex flex-col`: Layout flexível vertical

#### DialogHeader

```tsx
<DialogHeader className="px-6 py-4 border-b bg-muted/30">
  <DialogTitle>Título do Modal</DialogTitle>
</DialogHeader>
```

- `px-6 py-4`: Padding interno consistente
- `border-b`: Borda inferior para separação
- `bg-muted/30`: Fundo sutil para diferenciação

#### Corpo do Modal

```tsx
<div className="flex-1 overflow-y-auto px-6 py-4">
  {/* Conteúdo aqui */}
</div>
```

- `flex-1`: Ocupa espaço disponível
- `overflow-y-auto`: Scroll vertical quando necessário
- `px-6 py-4`: Padding consistente

#### DialogFooter

```tsx
<DialogFooter className="px-6 py-4 border-t bg-muted/30">
  {/* Botões aqui */}
</DialogFooter>
```

- `px-6 py-4`: Padding consistente
- `border-t`: Borda superior para separação
- `bg-muted/30`: Fundo sutil

### Organização do Conteúdo

#### Cards de Seção

Agrupe seções relacionadas em cards:

```tsx
<div className="p-4 rounded-lg border bg-card space-y-4">
  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
    Título da Seção
  </h3>
  {/* Conteúdo da seção */}
</div>
```

#### Elementos Informativos/Metadados

Use fundo sutil com borda tracejada:

```tsx
<div className="p-3 rounded-md bg-muted/30 border border-dashed">
  <p className="text-sm text-muted-foreground">Informação</p>
</div>
```

#### Tarefas Concluídas

Indicador visual para tarefas concluídas:

```tsx
<div className="bg-green-500/5 border-green-500/30 rounded-md p-3">
  {/* Tarefa concluída */}
</div>
```

### Seleção de Abas/Tags em Formulários

Use chips/badges ao invés de botões para evitar hover confuso:

```tsx
<div className="rounded-full border transition-colors bg-primary text-primary-foreground border-primary">
  {/* Aba ativa */}
</div>

<div className="rounded-full border transition-colors bg-background text-muted-foreground border-border">
  {/* Aba inativa */}
</div>
```

**Estados**:
- **Ativo**: `bg-primary text-primary-foreground border-primary`
- **Inativo**: `bg-background text-muted-foreground border-border`
- Sem hover forte - apenas `transition-colors`

### AlertDialog sem AlertDialogDescription

Quando não usar `AlertDialogDescription`, coloque o texto descritivo separado:

```tsx
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
  </AlertDialogHeader>
  <div className="px-6 py-4">
    <p className="text-sm text-muted-foreground">
      Texto descritivo aqui
    </p>
  </div>
  <AlertDialogFooter>
    {/* Botões */}
  </AlertDialogFooter>
</AlertDialogContent>
```

---

## 📱 Responsividade

### Breakpoints

- **Mobile**: `< 640px` (default - mobile-first)
- **Tablet**: `sm: >= 640px`
- **Desktop**: `md: >= 768px`, `lg: >= 1024px`

### Padrão Mobile-First

Sempre comece pelo mobile e adicione breakpoints maiores:

```tsx
// ✅ Correto - mobile-first
<div className="flex flex-col md:flex-row">
<div className="w-full md:w-1/2 lg:w-1/3">
<div className="text-sm md:text-base lg:text-lg">

// ❌ Errado - desktop-first
<div className="flex-row md:flex-col">
```

### Componentes Responsivos

- **Modais**: Full screen no mobile, tamanho fixo no desktop
- **Tabelas**: Scroll horizontal no mobile, layout completo no desktop
- **Formulários**: Coluna única no mobile, múltiplas colunas no desktop

---

## 🎯 Componentes UI Base (shadcn/ui)

### Botões

Use as variantes padrão do componente Button:

- `default`: Botão primário
- `destructive`: Ações destrutivas
- `outline`: Botões secundários
- `ghost`: Botões sem fundo
- `link`: Links estilizados como botões

```tsx
<Button variant="default" size="default">Salvar</Button>
<Button variant="destructive" size="sm">Excluir</Button>
<Button variant="outline">Cancelar</Button>
```

### Inputs

Todos os inputs seguem o padrão shadcn/ui:

```tsx
<Input 
  type="text" 
  placeholder="Digite aqui..."
  className="w-full"
/>
```

### Cards

Use o componente Card para agrupar conteúdo:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
</Card>
```

---

## 🔤 Tipografia

### Tamanhos de Fonte

- **xs**: `text-xs` (0.75rem / 12px)
- **sm**: `text-sm` (0.875rem / 14px)
- **base**: `text-base` (1rem / 16px) - padrão
- **lg**: `text-lg` (1.125rem / 18px)
- **xl**: `text-xl` (1.25rem / 20px)
- **2xl**: `text-2xl` (1.5rem / 24px)

### Pesos de Fonte

- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Títulos de Seção

```tsx
<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
  TÍTULO DA SEÇÃO
</h3>
```

---

## 🎨 Estados Visuais

### Estados de Interação

- **Hover**: Use `hover:` prefix do Tailwind
- **Focus**: Use `focus-visible:` para acessibilidade
- **Disabled**: Use `disabled:` ou `disabled:opacity-50`

### Estados de Loading

```tsx
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Carregando...
</Button>
```

### Estados de Erro

```tsx
<div className="text-destructive text-sm">
  Mensagem de erro
</div>
```

---

## 📋 Checklist de Design

Antes de finalizar um componente, verifique:

- [ ] Usa variáveis CSS do design system (não cores hardcoded)
- [ ] Segue a estrutura de modais (se aplicável)
- [ ] É responsivo (mobile-first)
- [ ] Usa componentes shadcn/ui quando possível
- [ ] Espaçamento consistente (p-4, p-6, etc)
- [ ] Border radius consistente (rounded-md, rounded-lg)
- [ ] Estados visuais definidos (hover, focus, disabled)
- [ ] Acessibilidade (labels, aria-labels, focus visible)

---

## 📚 Referências

- **Design System**: `frontend/src/index.css`
- **Tailwind Config**: `frontend/tailwind.config.ts`
- **Componentes UI**: `frontend/src/components/ui/`
- **shadcn/ui Docs**: https://ui.shadcn.com/

---

**Última atualização**: Dezembro 2024

