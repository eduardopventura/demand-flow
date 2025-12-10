import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { storageService } from "@/services/storage.service";
import { apiService } from "@/services/api.service";
import { toast } from "sonner";
import {
  Usuario,
  Template,
  Demanda,
  DataContextType,
  StatusDemanda,
  TipoCampo,
} from "@/types";

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};

// Helper function to generate unique IDs (fallback when API doesn't return ID)
const generateId = (prefix: string): string => `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch from API
        const [usuariosData, templatesData, demandasData] = await Promise.all([
          apiService.getUsuarios(),
          apiService.getTemplates(),
          apiService.getDemandas(),
        ]);

        setUsuarios(usuariosData);
        setTemplates(templatesData);
        setDemandas(demandasData);

        // Cache in localStorage as backup
        storageService.setUsuarios(usuariosData);
        storageService.setTemplates(templatesData);
        storageService.setDemandas(demandasData);

        console.log("✅ Dados carregados da API com sucesso");
      } catch (err) {
        console.warn("⚠️ Erro ao carregar da API, tentando localStorage...", err);
        
        // Fallback to localStorage
        try {
          const localUsuarios = storageService.getUsuarios();
          const localTemplates = storageService.getTemplates();
          const localDemandas = storageService.getDemandas();

          if (localUsuarios.length > 0 || localTemplates.length > 0 || localDemandas.length > 0) {
            setUsuarios(localUsuarios);
            setTemplates(localTemplates);
            setDemandas(localDemandas);
            
            toast.warning("Usando dados locais. Verifique se o backend está rodando.");
            console.log("📦 Dados carregados do localStorage");
          } else {
            throw new Error("Nenhum dado disponível");
          }
        } catch (localErr) {
          const errorMsg = "Erro ao carregar dados. Backend pode estar offline.";
          setError(errorMsg);
          toast.error(errorMsg);
          console.error("❌ Erro ao carregar dados:", localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Cache updates in localStorage (backup strategy)
  useEffect(() => {
    if (!loading && usuarios.length > 0) {
      storageService.setUsuarios(usuarios);
    }
  }, [usuarios, loading]);

  useEffect(() => {
    if (!loading && templates.length > 0) {
      storageService.setTemplates(templates);
    }
  }, [templates, loading]);

  useEffect(() => {
    if (!loading && demandas.length > 0) {
      storageService.setDemandas(demandas);
    }
  }, [demandas, loading]);

  // Usuario operations (with API integration)
  const addUsuario = useCallback(async (usuario: Omit<Usuario, "id">) => {
    try {
      const newUsuario = await apiService.createUsuario(usuario);
      setUsuarios((prev) => [...prev, newUsuario]);
      toast.success("Usuário criado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      toast.error("Erro ao criar usuário. Usando modo offline.");
      
      // Fallback: create locally
      const newUsuario: Usuario = { ...usuario, id: generateId("u") };
      setUsuarios((prev) => [...prev, newUsuario]);
    }
  }, []);

  const updateUsuario = useCallback(async (id: string, usuario: Omit<Usuario, "id">) => {
    try {
      const updatedUsuario = await apiService.updateUsuario(id, usuario);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? updatedUsuario : u))
      );
      toast.success("Usuário atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      toast.error("Erro ao atualizar usuário. Usando modo offline.");
      
      // Fallback: update locally
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...usuario, id } : u))
      );
    }
  }, []);

  const deleteUsuario = useCallback(async (id: string) => {
    try {
      await apiService.deleteUsuario(id);
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      toast.success("Usuário excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      toast.error("Erro ao excluir usuário. Usando modo offline.");
      
      // Fallback: delete locally
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    }
  }, []);

  // Template operations (with API integration)
  const addTemplate = useCallback(async (template: Omit<Template, "id">) => {
    try {
      const newTemplate = await apiService.createTemplate(template);
      setTemplates((prev) => [...prev, newTemplate]);
      toast.success("Template criado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar template:", err);
      toast.error("Erro ao criar template. Usando modo offline.");
      
      // Fallback: create locally
      const newTemplate: Template = { ...template, id: generateId("t") };
      setTemplates((prev) => [...prev, newTemplate]);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, template: Omit<Template, "id">) => {
    try {
      const updatedTemplate = await apiService.updateTemplate(id, template);
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? updatedTemplate : t))
      );
      toast.success("Template atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao atualizar template:", err);
      toast.error("Erro ao atualizar template. Usando modo offline.");
      
      // Fallback: update locally
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...template, id } : t))
      );
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await apiService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir template:", err);
      toast.error("Erro ao excluir template. Usando modo offline.");
      
      // Fallback: delete locally
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  // Demanda operations (with API integration)
  const addDemanda = useCallback(async (demanda: Omit<Demanda, "id">) => {
    try {
      const newDemanda = await apiService.createDemanda(demanda);
      setDemandas((prev) => [...prev, newDemanda]);
      toast.success("Demanda criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar demanda:", err);
      toast.error("Erro ao criar demanda. Usando modo offline.");
      
      // Fallback: create locally
      const newDemanda: Demanda = { ...demanda, id: generateId("d") };
      setDemandas((prev) => [...prev, newDemanda]);
    }
  }, []);

  const updateDemanda = useCallback(async (id: string, demanda: Partial<Demanda>) => {
    try {
      const updatedDemanda = await apiService.updateDemanda(id, demanda);
      setDemandas((prev) =>
        prev.map((d) => (d.id === id ? updatedDemanda : d))
      );
      // Silenciar toast para updates frequentes (drag & drop)
      if (demanda.status) {
        toast.success("Demanda atualizada!");
      }
    } catch (err) {
      console.error("Erro ao atualizar demanda:", err);
      toast.error("Erro ao atualizar demanda. Usando modo offline.");
      
      // Fallback: update locally
      setDemandas((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...demanda } : d))
      );
    }
  }, []);

  const deleteDemanda = useCallback(async (id: string) => {
    try {
      await apiService.deleteDemanda(id);
      setDemandas((prev) => prev.filter((d) => d.id !== id));
      toast.success("Demanda excluída com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir demanda:", err);
      toast.error("Erro ao excluir demanda. Usando modo offline.");
      
      // Fallback: delete locally
      setDemandas((prev) => prev.filter((d) => d.id !== id));
    }
  }, []);

  // Getters
  const getTemplate = useCallback(
    (id: string) => templates.find((t) => t.id === id),
    [templates]
  );

  const getUsuario = useCallback(
    (id: string) => usuarios.find((u) => u.id === id),
    [usuarios]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DataContextType>(
    () => ({
      usuarios,
      templates,
      demandas,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      addDemanda,
      updateDemanda,
      deleteDemanda,
      getTemplate,
      getUsuario,
    }),
    [
      usuarios,
      templates,
      demandas,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      addDemanda,
      updateDemanda,
      deleteDemanda,
      getTemplate,
      getUsuario,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

// Export types for backward compatibility
export type {
  Usuario,
  Template,
  Demanda,
  CampoPreenchimento,
  Tarefa,
  CampoPreenchido,
  TarefaStatus,
} from "@/types";
