import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiService, setUnauthorizedCallback } from "@/services/api.service";
import { toast } from "sonner";
import type { Usuario } from "@/types";
import { error as logError } from "@/utils/logger";

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

interface RegisterData {
  nome: string;
  email: string;
  telefone: string;
  login: string;
  senha: string;
  cargo_id?: string;
  notificar_email?: boolean;
  notificar_telefone?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = "authToken";

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Carrega token do localStorage e busca dados do usuário
   */
  const loadUserFromToken = useCallback(async (tokenToLoad: string) => {
    try {
      // Buscar dados do usuário via endpoint /api/auth/me
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${tokenToLoad}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.usuario);
        setToken(tokenToLoad);
        return true;
      } else {
        // Token inválido ou expirado
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
        return false;
      }
    } catch (error) {
      logError("Erro ao carregar usuário:", error);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  /**
   * Logout do usuário
   */
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    toast.success("Logout realizado com sucesso");
  }, []);

  /**
   * Carrega token do localStorage ao inicializar
   */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (storedToken) {
        // Tentar carregar dados do usuário
        await loadUserFromToken(storedToken);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [loadUserFromToken]);

  /**
   * Configurar callback de logout no api.service quando receber 401
   * Usa useRef para evitar dependência circular
   */
  useEffect(() => {
    const logoutCallback = () => {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setUser(null);
      toast.success("Logout realizado com sucesso");
    };
    
    setUnauthorizedCallback(logoutCallback);
    
    // Cleanup: remover callback ao desmontar
    return () => {
      setUnauthorizedCallback(() => {});
    };
  }, []);

  /**
   * Login do usuário
   */
  const login = useCallback(async (login: string, senha: string) => {
    try {
      const response = await apiService.login(login, senha);
      
      // Salvar token no localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      
      // Atualizar estado
      setToken(response.token);
      setUser(response.usuario);
      
      toast.success(`Bem-vindo, ${response.usuario.nome}!`);
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao fazer login. Verifique suas credenciais.";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  /**
   * Registro de novo usuário
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao registrar usuário");
      }

      const result = await response.json();
      
      // Salvar token no localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, result.token);
      
      // Atualizar estado
      setToken(result.token);
      setUser(result.usuario);
      
      toast.success(`Usuário ${result.usuario.nome} registrado com sucesso!`);
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao registrar usuário";
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

