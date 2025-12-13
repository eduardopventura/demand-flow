import { STORAGE_KEYS } from "@/constants";
import type { Usuario, Template, Demanda, Acao } from "@/types";

/**
 * Service for managing localStorage operations
 * Provides type-safe methods for storing and retrieving data
 */
class StorageService {
  /**
   * Generic method to get data from localStorage
   */
  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  }

  /**
   * Generic method to set data in localStorage
   */
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  }

  /**
   * Generic method to remove data from localStorage
   */
  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  }

  // Usuario operations
  getUsuarios(): Usuario[] {
    return this.getItem<Usuario[]>(STORAGE_KEYS.USUARIOS) || [];
  }

  setUsuarios(usuarios: Usuario[]): void {
    this.setItem(STORAGE_KEYS.USUARIOS, usuarios);
  }

  // Template operations
  getTemplates(): Template[] {
    return this.getItem<Template[]>(STORAGE_KEYS.TEMPLATES) || [];
  }

  setTemplates(templates: Template[]): void {
    this.setItem(STORAGE_KEYS.TEMPLATES, templates);
  }

  // Demanda operations
  getDemandas(): Demanda[] {
    return this.getItem<Demanda[]>(STORAGE_KEYS.DEMANDAS) || [];
  }

  setDemandas(demandas: Demanda[]): void {
    this.setItem(STORAGE_KEYS.DEMANDAS, demandas);
  }

  // Acao operations
  getAcoes(): Acao[] {
    return this.getItem<Acao[]>(STORAGE_KEYS.ACOES) || [];
  }

  setAcoes(acoes: Acao[]): void {
    this.setItem(STORAGE_KEYS.ACOES, acoes);
  }

  /**
   * Clear all application data from localStorage
   */
  clearAll(): void {
    this.removeItem(STORAGE_KEYS.USUARIOS);
    this.removeItem(STORAGE_KEYS.TEMPLATES);
    this.removeItem(STORAGE_KEYS.DEMANDAS);
    this.removeItem(STORAGE_KEYS.ACOES);
  }

  /**
   * Check if localStorage has any data
   */
  hasData(): boolean {
    return (
      this.getUsuarios().length > 0 ||
      this.getTemplates().length > 0 ||
      this.getDemandas().length > 0 ||
      this.getAcoes().length > 0
    );
  }
}

// Export singleton instance
export const storageService = new StorageService();

