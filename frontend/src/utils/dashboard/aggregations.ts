/**
 * Dashboard Aggregations - Funções de agregação para métricas e gráficos
 */

import type { Demanda, Usuario, Template } from "@/types";
import { StatusDemanda } from "@/types";

// ============================================
// TIPOS PARA MÉTRICAS E GRÁFICOS
// ============================================

export interface DashboardKPIs {
  total: number;
  criadas: number;
  emAndamento: number;
  finalizadas: number;
  taxaConclusao: number; // Percentual (0-100) - mantido para compatibilidade
  taxaConclusaoNoPrazo: number; // Percentual (0-100) - finalizadas no prazo / total finalizadas
  emAtraso: number;
  tempoMedioConclusao: number; // Em dias
}

export interface BucketMensal {
  mes: string; // Label para exibição (ex: "jan/2024")
  mesKey: string; // Chave para ordenação (ex: "2024-01")
  criadas: number;
  concluidas: number;
  emAndamento: number;
}

export interface AgrupamentoPorTemplate {
  templateId: string;
  nome: string;
  total: number;
  finalizadas: number;
  taxa: number;
}

export interface AgrupamentoPorUsuario {
  usuarioId: string;
  nome: string;
  total: number;
  finalizadas: number;
  finalizadasNoPrazo: number; // Finalizadas com prazo=true
  taxa: number; // Taxa de conclusão geral (finalizadas/total)
  taxaConclusaoNoPrazo: number; // Taxa de conclusão no prazo (finalizadas no prazo / total finalizadas)
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Formata nome do usuário: primeiro nome + iniciais dos demais
 * Ex: "Cristina de Souza Patricio Ventura" -> "Cristina S.P.V"
 * Ex: "Hélio Ramos Ventura" -> "Hélio R.V"
 */
export function formatarNomeUsuario(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/);
  if (partes.length === 0) return nomeCompleto;
  if (partes.length === 1) return partes[0];
  
  const primeiroNome = partes[0];
  const iniciais = partes.slice(1)
    .filter(p => p.length > 0)
    .map(p => p[0].toUpperCase())
    .join(".");
  
  return iniciais ? `${primeiroNome} ${iniciais}` : primeiroNome;
}

// ============================================
// FUNÇÕES DE CÁLCULO DE KPIS
// ============================================

/**
 * Calcula todas as KPIs do dashboard
 */
export function computeKPIs(demandas: Demanda[]): DashboardKPIs {
  const total = demandas.length;
  const criadas = demandas.filter(d => d.status === StatusDemanda.CRIADA).length;
  const emAndamento = demandas.filter(d => d.status === StatusDemanda.EM_ANDAMENTO).length;
  const finalizadas = demandas.filter(d => d.status === StatusDemanda.FINALIZADA).length;
  
  // Taxa de conclusão geral (evitar divisão por zero)
  const taxaConclusao = total > 0 
    ? parseFloat(((finalizadas / total) * 100).toFixed(1)) 
    : 0;
  
  // Taxa de conclusão no prazo: finalizadas com prazo=true / total finalizadas
  const finalizadasNoPrazo = demandas.filter(d => 
    d.status === StatusDemanda.FINALIZADA && d.prazo === true
  ).length;
  
  const taxaConclusaoNoPrazo = finalizadas > 0
    ? parseFloat(((finalizadasNoPrazo / finalizadas) * 100).toFixed(1))
    : 0;
  
  // Em atraso: prazo=false E não finalizada
  const emAtraso = demandas.filter(d => 
    d.prazo === false && d.status !== StatusDemanda.FINALIZADA
  ).length;
  
  // Tempo médio de conclusão (somente finalizadas com data_finalizacao)
  const demandasFinalizadasComData = demandas.filter(d => 
    d.status === StatusDemanda.FINALIZADA && d.data_finalizacao
  );
  
  let tempoMedioConclusao = 0;
  if (demandasFinalizadasComData.length > 0) {
    const somaTempos = demandasFinalizadasComData.reduce((acc, d) => {
      const criacao = new Date(d.data_criacao);
      const finalizacao = new Date(d.data_finalizacao!);
      const diffMs = finalizacao.getTime() - criacao.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return acc + Math.max(dias, 0); // Evitar valores negativos
    }, 0);
    tempoMedioConclusao = parseFloat((somaTempos / demandasFinalizadasComData.length).toFixed(1));
  }
  
  return {
    total,
    criadas,
    emAndamento,
    finalizadas,
    taxaConclusao,
    taxaConclusaoNoPrazo,
    emAtraso,
    tempoMedioConclusao,
  };
}

// ============================================
// FUNÇÕES DE BUCKETS MENSAIS
// ============================================

/**
 * Formata data para label de mês (ex: "jan/2024")
 */
function formatarMesLabel(date: Date): string {
  return date.toLocaleDateString("pt-BR", { 
    month: "short", 
    year: "numeric" 
  }).replace(". de ", "/").replace(".", "");
}

/**
 * Gera chave de mês para ordenação (ex: "2024-01")
 */
function gerarMesKey(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

/**
 * Agrupa demandas por mês de criação e finalização
 * Retorna série temporal para gráficos de linha/barras
 */
export function computeBucketsMensais(demandas: Demanda[]): BucketMensal[] {
  const bucketsMap = new Map<string, BucketMensal>();
  
  // Processar demandas - contar por data de criação
  demandas.forEach(d => {
    const dataCriacao = new Date(d.data_criacao);
    const mesKey = gerarMesKey(dataCriacao);
    const mesLabel = formatarMesLabel(dataCriacao);
    
    if (!bucketsMap.has(mesKey)) {
      bucketsMap.set(mesKey, {
        mes: mesLabel,
        mesKey,
        criadas: 0,
        concluidas: 0,
        emAndamento: 0,
      });
    }
    
    const bucket = bucketsMap.get(mesKey)!;
    bucket.criadas++;
    
    // Contar status atual no mês de criação
    if (d.status === StatusDemanda.EM_ANDAMENTO) {
      bucket.emAndamento++;
    }
  });
  
  // Processar finalizadas - contar por data de finalização
  demandas
    .filter(d => d.status === StatusDemanda.FINALIZADA && d.data_finalizacao)
    .forEach(d => {
      const dataFinalizacao = new Date(d.data_finalizacao!);
      const mesKey = gerarMesKey(dataFinalizacao);
      const mesLabel = formatarMesLabel(dataFinalizacao);
      
      if (!bucketsMap.has(mesKey)) {
        bucketsMap.set(mesKey, {
          mes: mesLabel,
          mesKey,
          criadas: 0,
          concluidas: 0,
          emAndamento: 0,
        });
      }
      
      bucketsMap.get(mesKey)!.concluidas++;
    });
  
  // Ordenar por data (mesKey)
  return Array.from(bucketsMap.values())
    .sort((a, b) => a.mesKey.localeCompare(b.mesKey));
}

// ============================================
// FUNÇÕES DE AGRUPAMENTO
// ============================================

/**
 * Agrupa demandas por template
 */
export function computeAgrupamentoPorTemplate(
  demandas: Demanda[],
  templates: Template[]
): AgrupamentoPorTemplate[] {
  const templateMap = new Map<string, AgrupamentoPorTemplate>();
  
  // Inicializar com templates conhecidos
  templates.forEach(t => {
    templateMap.set(t.id, {
      templateId: t.id,
      nome: t.nome,
      total: 0,
      finalizadas: 0,
      taxa: 0,
    });
  });
  
  // Contar demandas
  demandas.forEach(d => {
    if (!templateMap.has(d.template_id)) {
      // Template desconhecido
      templateMap.set(d.template_id, {
        templateId: d.template_id,
        nome: "Template não encontrado",
        total: 0,
        finalizadas: 0,
        taxa: 0,
      });
    }
    
    const grupo = templateMap.get(d.template_id)!;
    grupo.total++;
    
    if (d.status === StatusDemanda.FINALIZADA) {
      grupo.finalizadas++;
    }
  });
  
  // Calcular taxas e filtrar vazios
  return Array.from(templateMap.values())
    .filter(g => g.total > 0)
    .map(g => ({
      ...g,
      taxa: g.total > 0 ? parseFloat(((g.finalizadas / g.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Agrupa demandas por usuário responsável
 */
export function computeAgrupamentoPorUsuario(
  demandas: Demanda[],
  usuarios: Usuario[]
): AgrupamentoPorUsuario[] {
  const usuarioMap = new Map<string, AgrupamentoPorUsuario>();
  
  // Criar lookup de nomes
  const nomesUsuarios = new Map<string, string>();
  usuarios.forEach(u => nomesUsuarios.set(u.id, u.nome));
  
  // Contar demandas
  demandas.forEach(d => {
    if (!usuarioMap.has(d.responsavel_id)) {
      usuarioMap.set(d.responsavel_id, {
        usuarioId: d.responsavel_id,
        nome: nomesUsuarios.get(d.responsavel_id) || "Usuário não encontrado",
        total: 0,
        finalizadas: 0,
        finalizadasNoPrazo: 0,
        taxa: 0,
        taxaConclusaoNoPrazo: 0,
      });
    }
    
    const grupo = usuarioMap.get(d.responsavel_id)!;
    grupo.total++;
    
    if (d.status === StatusDemanda.FINALIZADA) {
      grupo.finalizadas++;
      if (d.prazo === true) {
        grupo.finalizadasNoPrazo++;
      }
    }
  });
  
  // Calcular taxas
  return Array.from(usuarioMap.values())
    .map(g => ({
      ...g,
      taxa: g.total > 0 ? parseFloat(((g.finalizadas / g.total) * 100).toFixed(1)) : 0,
      taxaConclusaoNoPrazo: g.finalizadas > 0 
        ? parseFloat(((g.finalizadasNoPrazo / g.finalizadas) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Retorna os top N usuários por volume
 */
export function getTopUsuariosPorVolume(
  agrupamento: AgrupamentoPorUsuario[],
  limit: number = 10
): AgrupamentoPorUsuario[] {
  return agrupamento.slice(0, limit);
}

/**
 * Retorna os usuários ordenados por taxa de conclusão no prazo
 */
export function getUsuariosPorTaxaConclusao(
  agrupamento: AgrupamentoPorUsuario[]
): AgrupamentoPorUsuario[] {
  return [...agrupamento].sort((a, b) => b.taxaConclusaoNoPrazo - a.taxaConclusaoNoPrazo);
}

