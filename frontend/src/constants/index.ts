import { StatusDemanda } from "@/types";

// LocalStorage keys
export const STORAGE_KEYS = {
  USUARIOS: "usuarios",
  TEMPLATES: "templates",
  DEMANDAS: "demandas",
  ACOES: "acoes",
} as const;

// Status configuration for Kanban columns
export const STATUS_CONFIG = {
  [StatusDemanda.CRIADA]: {
    bg: "bg-kanban-created",
    border: "border-primary/20",
    label: "Criada",
  },
  [StatusDemanda.EM_ANDAMENTO]: {
    bg: "bg-kanban-progress",
    border: "border-warning/20",
    label: "Em Andamento",
  },
  [StatusDemanda.FINALIZADA]: {
    bg: "bg-kanban-finished",
    border: "border-success/20",
    label: "Finalizada",
  },
} as const;

// Navigation items
export const NAVIGATION_ITEMS = [
  { name: "Painel de Demandas", href: "/", icon: "LayoutDashboard" },
  { name: "Templates", href: "/templates", icon: "FileText" },
  { name: "Ações", href: "/acoes", icon: "Zap" },
  { name: "Usuários", href: "/usuarios", icon: "Users" },
  { name: "Relatórios", href: "/relatorios", icon: "BarChart3" },
] as const;

// Chart colors
export const CHART_COLORS = [
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(0, 72%, 51%)",
] as const;

// Field type options
export const FIELD_TYPE_OPTIONS = [
  { value: "texto", label: "Texto" },
  { value: "numero", label: "Número" },
  { value: "data", label: "Data" },
  { value: "arquivo", label: "Arquivo" },
  { value: "dropdown", label: "Lista Dropdown" },
] as const;


