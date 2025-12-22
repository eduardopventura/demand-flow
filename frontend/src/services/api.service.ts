/**
 * API Service Layer
 * 
 * Abstraction layer for API calls
 * Currently uses JSON-Server, ready for PostgreSQL upgrade
 * 
 * Migration Path:
 * - Keep same interface (methods and return types)
 * - Only change implementation details
 * - Add authentication headers
 * - Add error handling middleware
 */

import type { Usuario, Cargo, Template, Demanda, Acao, DemandaUpdatePayload } from "@/types";
import { error as logError } from "@/utils/logger";

/**
 * API Configuration
 * 
 * Sempre usa "/api" como caminho relativo:
 * - Desenvolvimento (Vite): Proxy configurado em vite.config.ts -> http://backend:3000
 * - Produção (Nginx): Proxy configurado em nginx.conf -> http://backend:3000
 * 
 * Ambos os ambientes usam Docker networking com hostname "backend"
 * Fallback localStorage já implementado no DataContext
 */
const API_URL = '/api';
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Obtém token de autenticação do localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Callback para logout quando token expira
 * Será definido pelo AuthContext
 */
let onUnauthorized: (() => void) | null = null;

/**
 * Define callback para logout em caso de 401
 * Usa função para evitar problemas de inicialização
 */
export function setUnauthorizedCallback(callback: () => void) {
  if (typeof callback === 'function') {
    onUnauthorized = callback;
  }
}

/**
 * Generic fetch wrapper with error handling and authentication
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  // Obter token do localStorage
  const token = getAuthToken();
  
  // Preparar headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options?.headers,
  };
  
  // Adicionar token de autenticação se disponível
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Interceptar 401 (não autorizado)
    if (response.status === 401) {
      // Verificar se estamos na página de login - não disparar logout nesse caso
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      
      // Remover token inválido apenas se não estiver na página de login
      if (typeof window !== 'undefined' && !isLoginPage) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        
        // Chamar callback de logout se disponível (apenas se não estiver na página de login)
        if (onUnauthorized && typeof onUnauthorized === 'function') {
          try {
            onUnauthorized();
          } catch (err) {
            logError('Erro ao executar callback de logout:', err);
          }
        }
      }
      
      // Para endpoints de login, não lançar erro genérico - deixar o componente tratar
      if (endpoint.includes('/auth/login')) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciais inválidas');
      }
      
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    // Interceptar 403 (sem permissão) - comportamento esperado
    if (response.status === 403) {
      let errorMessage = "Sem permissão para executar esta ação.";
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {
        // ignore
      }
      const err: any = new Error(errorMessage);
      err.status = 403;
      throw err;
    }

    if (!response.ok) {
      // Tentar extrair mensagem de erro do response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Se não conseguir parsear JSON, usar mensagem padrão
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (err) {
    logError(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

/**
 * API Service
 * 
 * All API calls are centralized here
 * Easy to replace with real backend implementation
 */
export const apiService = {
  // ============================================================================
  // PUBLIC (auth-only) - dados básicos para UI
  // ============================================================================
  async getPublicUsuarios(): Promise<Usuario[]> {
    return fetchAPI<Usuario[]>("/public/usuarios");
  },

  async getPublicCargos(): Promise<Cargo[]> {
    return fetchAPI<Cargo[]>("/public/cargos");
  },

  // ============================================================================
  // USUARIOS
  // ============================================================================
  
  async getUsuarios(): Promise<Usuario[]> {
    return fetchAPI<Usuario[]>("/usuarios");
  },

  async getUsuario(id: string): Promise<Usuario> {
    return fetchAPI<Usuario>(`/usuarios/${id}`);
  },

  async createUsuario(usuario: Omit<Usuario, "id">): Promise<Usuario> {
    return fetchAPI<Usuario>("/usuarios", {
      method: "POST",
      body: JSON.stringify(usuario),
    });
  },

  async updateUsuario(id: string, usuario: Partial<Usuario>): Promise<Usuario> {
    return fetchAPI<Usuario>(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(usuario),
    });
  },

  async deleteUsuario(id: string): Promise<void> {
    return fetchAPI<void>(`/usuarios/${id}`, {
      method: "DELETE",
    });
  },

  // ============================================================================
  // CARGOS (gestão)
  // ============================================================================
  async getCargos(): Promise<Cargo[]> {
    return fetchAPI<Cargo[]>("/cargos");
  },

  async saveCargosBatch(payload: {
    creates?: Array<Partial<Cargo> & { nome: string }>;
    updates?: Array<Partial<Cargo> & { id: string }>;
    deletes?: Array<{ id: string; reassignToCargoId?: string }>;
  }): Promise<{ success: true }> {
    return fetchAPI<{ success: true }>("/cargos/batch", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async getTemplates(): Promise<Template[]> {
    return fetchAPI<Template[]>("/templates");
  },

  async getTemplate(id: string): Promise<Template> {
    return fetchAPI<Template>(`/templates/${id}`);
  },

  async createTemplate(template: Omit<Template, "id">): Promise<Template> {
    return fetchAPI<Template>("/templates", {
      method: "POST",
      body: JSON.stringify(template),
    });
  },

  async updateTemplate(id: string, template: Partial<Template>): Promise<Template> {
    return fetchAPI<Template>(`/templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(template),
    });
  },

  async deleteTemplate(id: string): Promise<void> {
    return fetchAPI<void>(`/templates/${id}`, {
      method: "DELETE",
    });
  },

  // ============================================================================
  // DEMANDAS
  // ============================================================================

  async getDemandas(): Promise<Demanda[]> {
    return fetchAPI<Demanda[]>("/demandas");
  },

  async getDemanda(id: string): Promise<Demanda> {
    return fetchAPI<Demanda>(`/demandas/${id}`);
  },

  async createDemanda(demanda: Omit<Demanda, "id">): Promise<Demanda> {
    return fetchAPI<Demanda>("/demandas", {
      method: "POST",
      body: JSON.stringify(demanda),
    });
  },

  async updateDemanda(id: string, demanda: DemandaUpdatePayload): Promise<Demanda> {
    return fetchAPI<Demanda>(`/demandas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(demanda),
    });
  },

  async deleteDemanda(id: string): Promise<void> {
    return fetchAPI<void>(`/demandas/${id}`, {
      method: "DELETE",
    });
  },

  // ============================================================================
  // ACOES (Ações Automáticas)
  // ============================================================================

  async getAcoes(): Promise<Acao[]> {
    return fetchAPI<Acao[]>("/acoes");
  },

  async getAcao(id: string): Promise<Acao> {
    return fetchAPI<Acao>(`/acoes/${id}`);
  },

  async createAcao(acao: Omit<Acao, "id">): Promise<Acao> {
    return fetchAPI<Acao>("/acoes", {
      method: "POST",
      body: JSON.stringify(acao),
    });
  },

  async updateAcao(id: string, acao: Partial<Acao>): Promise<Acao> {
    return fetchAPI<Acao>(`/acoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(acao),
    });
  },

  async deleteAcao(id: string): Promise<void> {
    return fetchAPI<void>(`/acoes/${id}`, {
      method: "DELETE",
    });
  },

  // ============================================================================
  // DEMANDAS - Custom Endpoints com lógica de negócio no backend
  // ============================================================================

  /**
   * Criar demanda via endpoint customizado
   * O backend calcula: nome_demanda, data_previsao, tarefas_status
   * E dispara notificações automaticamente
   */
  async criarDemandaCustom(dados: {
    template_id: string;
    responsavel_id: string;
    campos_valores: Record<string, string>;
  }): Promise<Demanda> {
    return fetchAPI<Demanda>("/demandas/criar", {
      method: "POST",
      body: JSON.stringify(dados),
    });
  },

  /**
   * Atualizar demanda via endpoint customizado
   * O backend detecta mudanças e dispara notificações:
   * - Mudança de responsável de tarefa
   * - Tarefa concluída por responsável diferente
   * - Calcula status automaticamente
   */
  async atualizarDemandaCustom(id: string, demanda: Partial<Demanda>): Promise<Demanda> {
    return fetchAPI<Demanda>(`/demandas/${id}/atualizar`, {
      method: "PATCH",
      body: JSON.stringify(demanda),
    });
  },

  /**
   * Executar ação automática de uma tarefa
   * O backend:
   * - Monta o payload baseado no mapeamento de campos
   * - Envia para o webhook (n8n)
   * - Marca a tarefa como concluída se sucesso
   */
  async executarAcaoTarefa(demandaId: string, tarefaId: string): Promise<{ success: boolean; message: string; demanda: Demanda }> {
    return fetchAPI<{ success: boolean; message: string; demanda: Demanda }>(`/demandas/${demandaId}/tarefas/${tarefaId}/executar`, {
      method: "POST",
    });
  },

  // ============================================================================
  // UPLOAD
  // ============================================================================

  /**
   * Upload de arquivo
   * Retorna informações do arquivo salvo
   */
  async uploadFile(file: File): Promise<{ path: string; filename: string; originalName: string; mimetype: string; size: number }> {
    const formData = new FormData();
    formData.append("file", file);

    const url = `${API_URL}/upload`;
    const token = getAuthToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
      // Não enviar Content-Type header - o browser vai definir automaticamente com boundary
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // ============================================================================
  // AUTHENTICATION (Placeholder - implement properly when migrating)
  // ============================================================================

  async login(login: string, senha: string): Promise<{ usuario: Usuario; token: string }> {
    const response = await fetchAPI<{ success: boolean; usuario: Usuario; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, senha }),
    });
    
    // Retornar no formato esperado pelo AuthContext
    return {
      usuario: response.usuario,
      token: response.token,
    };
  },

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return fetchAPI<{ status: string; timestamp: string }>("/health");
  },
};

/**
 * Architecture Notes:
 * 
 * Frontend -> /api -> Proxy (Vite ou Nginx) -> http://backend:3000
 * 
 * - Desenvolvimento: Vite proxy (vite.config.ts) redireciona para backend:3000
 * - Produção: Nginx proxy (nginx.conf) redireciona para backend:3000
 * - Docker resolve "backend" automaticamente via DNS interno da rede
 * 
 * Migration Notes for PostgreSQL Upgrade:
 * 
 * 1. Keep this file structure
 * 2. API_URL ("/api") não precisa mudar - apenas o backend
 * 3. Add authentication token to headers:
 *    headers: {
 *      "Authorization": `Bearer ${getToken()}`,
 *      ...
 *    }
 * 4. Add retry logic for failed requests
 * 5. Add request/response interceptors
 * 6. Consider using axios or ky instead of fetch
 */

