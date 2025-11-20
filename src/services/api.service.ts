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

import type { Usuario, Template, Demanda } from "@/types";

/**
 * API Configuration
 * 
 * Configuração adaptativa para funcionar com domínio ou IP:
 * - Usa caminho relativo "/api" quando acessado via domínio
 * - Usa IP direto quando acessado via IP
 * - Fallback localStorage já implementado no DataContext
 * - OPCIONAL: Pode ser sobrescrito via .env
 */
const getApiUrl = (): string => {
  // 1. Se tem variável de ambiente, usa ela
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Se está em produção ou acessando via domínio, usa caminho relativo
  // Nginx fará o proxy para o backend
  if (import.meta.env.PROD || window.location.hostname.includes('.')) {
    return '/api';
  }

  // 3. Fallback para desenvolvimento local
  return 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Log para debug
console.log(`🔌 API Service initialized with URL: ${API_URL}`);

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
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

  async updateDemanda(id: string, demanda: Partial<Demanda>): Promise<Demanda> {
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
  // AUTHENTICATION (Placeholder - implement properly when migrating)
  // ============================================================================

  async login(login: string, senha: string): Promise<{ usuario: Usuario; token: string }> {
    return fetchAPI<{ usuario: Usuario; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, senha }),
    });
  },

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return fetchAPI<{ status: string; timestamp: string }>("/health");
  },
};

/**
 * Migration Notes for PostgreSQL Upgrade:
 * 
 * 1. Keep this file structure
 * 2. Update API_URL to point to new backend
 * 3. Add authentication token to headers:
 *    headers: {
 *      "Authorization": `Bearer ${getToken()}`,
 *      ...
 *    }
 * 4. Add retry logic for failed requests
 * 5. Add request/response interceptors
 * 6. Consider using axios or ky instead of fetch
 * 
 * Example with authentication:
 * 
 * const token = localStorage.getItem('authToken');
 * headers: {
 *   "Content-Type": "application/json",
 *   "Authorization": token ? `Bearer ${token}` : "",
 * }
 */

