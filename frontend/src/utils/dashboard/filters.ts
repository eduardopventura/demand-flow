/**
 * Dashboard Filters - Tipos e funções para filtragem de demandas no dashboard
 */

import type { Demanda, StatusDemanda } from "@/types";

// Tipos de período pré-definidos
export type PeriodoPreset = "3" | "6" | "12" | "all" | "custom";

// Filtro de prazo
export type FiltroPrazo = "all" | "dentro" | "atrasado";

// Interface completa de filtros do dashboard
export interface DashboardFilters {
  // Período
  periodoPreset: PeriodoPreset;
  dataInicio: Date | null; // Para período customizado
  dataFim: Date | null; // Para período customizado
  
  // Filtros de entidade
  usuarioId: string | null; // null = todos
  templateId: string | null; // null = todos
  
  // Filtros de status (múltiplos permitidos, vazio = todos)
  status: StatusDemanda[];
  
  // Filtro de prazo
  prazo: FiltroPrazo;
}

// Estado inicial dos filtros (padrão)
export const DEFAULT_FILTERS: DashboardFilters = {
  periodoPreset: "6",
  dataInicio: null,
  dataFim: null,
  usuarioId: null,
  templateId: null,
  status: [],
  prazo: "all",
};

/**
 * Calcula a data de corte baseada no período preset
 */
export function getDataCortePeriodo(preset: PeriodoPreset, customInicio?: Date | null): Date | null {
  if (preset === "all") return null;
  if (preset === "custom") return customInicio || null;
  
  const meses = parseInt(preset);
  const data = new Date();
  data.setMonth(data.getMonth() - meses);
  data.setHours(0, 0, 0, 0);
  return data;
}

/**
 * Calcula a data fim para período customizado
 */
export function getDataFimPeriodo(preset: PeriodoPreset, customFim?: Date | null): Date | null {
  if (preset === "all") return null;
  if (preset === "custom") return customFim || null;
  
  // Para presets, a data fim é "hoje" (final do dia)
  const data = new Date();
  data.setHours(23, 59, 59, 999);
  return data;
}

/**
 * Aplica todos os filtros nas demandas
 * Função pura e testável
 */
export function applyDashboardFilters(
  demandas: Demanda[],
  filters: DashboardFilters
): Demanda[] {
  let resultado = [...demandas];
  
  // 1. Filtro por período
  const dataCorte = getDataCortePeriodo(filters.periodoPreset, filters.dataInicio);
  const dataFim = getDataFimPeriodo(filters.periodoPreset, filters.dataFim);
  
  if (dataCorte) {
    resultado = resultado.filter(d => {
      const dataCriacao = new Date(d.data_criacao);
      return dataCriacao >= dataCorte;
    });
  }
  
  if (dataFim && filters.periodoPreset === "custom") {
    resultado = resultado.filter(d => {
      const dataCriacao = new Date(d.data_criacao);
      return dataCriacao <= dataFim;
    });
  }
  
  // 2. Filtro por usuário responsável
  if (filters.usuarioId) {
    resultado = resultado.filter(d => d.responsavel_id === filters.usuarioId);
  }
  
  // 3. Filtro por template/tipo
  if (filters.templateId) {
    resultado = resultado.filter(d => d.template_id === filters.templateId);
  }
  
  // 4. Filtro por status (múltiplos)
  if (filters.status.length > 0) {
    resultado = resultado.filter(d => filters.status.includes(d.status));
  }
  
  // 5. Filtro por prazo
  if (filters.prazo !== "all") {
    if (filters.prazo === "dentro") {
      // Dentro do prazo: prazo=true OU já finalizada
      resultado = resultado.filter(d => d.prazo === true || d.status === "Finalizada");
    } else if (filters.prazo === "atrasado") {
      // Em atraso: prazo=false E não finalizada
      resultado = resultado.filter(d => d.prazo === false && d.status !== "Finalizada");
    }
  }
  
  return resultado;
}

/**
 * Verifica se há filtros ativos (diferentes do padrão)
 */
export function hasActiveFilters(filters: DashboardFilters): boolean {
  return (
    filters.periodoPreset !== DEFAULT_FILTERS.periodoPreset ||
    filters.usuarioId !== null ||
    filters.templateId !== null ||
    filters.status.length > 0 ||
    filters.prazo !== "all"
  );
}

/**
 * Retorna os filtros resetados para o estado padrão
 */
export function resetFilters(): DashboardFilters {
  return { ...DEFAULT_FILTERS };
}

