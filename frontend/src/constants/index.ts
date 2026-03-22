import { STATUS_FIXOS } from "@/types";
import type { ColunaKanban } from "@/types";

// LocalStorage keys
export const STORAGE_KEYS = {
  USUARIOS: "usuarios",
  TEMPLATES: "templates",
  DEMANDAS: "demandas",
  ACOES: "acoes",
} as const;

// Fixed status visual config (for Criada and Finalizada)
const FIXED_STATUS_CONFIG: Record<string, StatusColumnConfig> = {
  [STATUS_FIXOS.CRIADA]: {
    bg: "bg-kanban-created",
    border: "border-primary/20",
    label: "Criada",
  },
  [STATUS_FIXOS.FINALIZADA]: {
    bg: "bg-kanban-finished",
    border: "border-success/20",
    label: "Finalizada",
  },
};

// Palette for intermediate columns
const INTERMEDIATE_PALETTE = [
  { bg: "bg-kanban-progress", border: "border-warning/20" },
  { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300/30" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300/30" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300/30" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-300/30" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", border: "border-teal-300/30" },
];

export interface StatusColumnConfig {
  bg: string;
  border: string;
  label: string;
}

/**
 * Generates status config from dynamic Kanban columns.
 */
export function buildStatusConfig(colunas: ColunaKanban[]): Record<string, StatusColumnConfig> {
  const config: Record<string, StatusColumnConfig> = {};
  let intermediateIdx = 0;

  for (const col of colunas) {
    if (FIXED_STATUS_CONFIG[col.nome]) {
      config[col.nome] = FIXED_STATUS_CONFIG[col.nome];
    } else {
      const palette = INTERMEDIATE_PALETTE[intermediateIdx % INTERMEDIATE_PALETTE.length];
      config[col.nome] = {
        bg: palette.bg,
        border: palette.border,
        label: col.nome,
      };
      intermediateIdx++;
    }
  }

  return config;
}

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


