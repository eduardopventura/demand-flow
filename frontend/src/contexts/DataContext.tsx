import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "@/services/api.service";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/services/socket.service";
import { toast } from "sonner";
import type {
  Usuario,
  Cargo,
  Template,
  Demanda,
  Acao,
  DemandaUpdatePayload,
  DataContextType,
} from "@/types";
import { hasPermission } from "@/utils/permissions";
import { log, error as logError } from "@/utils/logger";

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};


export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading, token, user } = useAuth();
  
  // State
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API only when authenticated
  useEffect(() => {
    // Não carregar dados se ainda está verificando autenticação ou se não está autenticado
    if (authLoading || !isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const canAcoes = hasPermission(user, "acesso_acoes");

        const [usuariosData, cargosData, demandasData, templatesData, acoesData] = await Promise.all([
          apiService.getPublicUsuarios(),
          apiService.getPublicCargos(),
          apiService.getDemandas(),
          apiService.getTemplates(), // Sempre buscar templates (necessário para criar/visualizar demandas)
          canAcoes ? apiService.getAcoes() : Promise.resolve([] as Acao[]),
        ]);

        setUsuarios(usuariosData);
        setCargos(cargosData);
        setTemplates(templatesData);
        setDemandas(demandasData);
        setAcoes(acoesData);

        log("✅ Dados carregados da API com sucesso");
      } catch (err: any) {
        // Não mostrar erro de autenticação como erro genérico
        if (err?.message?.includes("Sessão expirada") || err?.message?.includes("401")) {
          // Erro de autenticação será tratado pelo api.service
          setError(null);
        } else {
          const errorMsg = "Erro ao conectar com o backend. Verifique se o servidor está rodando.";
          setError(errorMsg);
          toast.error(errorMsg);
        }
        logError("❌ Erro ao carregar dados do backend:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, authLoading, user]);

  const refreshPublicData = useCallback(async () => {
    const [usuariosData, cargosData] = await Promise.all([
      apiService.getPublicUsuarios(),
      apiService.getPublicCargos(),
    ]);
    setUsuarios(usuariosData);
    setCargos(cargosData);
  }, []);

  /**
   * WebSockets: manter estado sincronizado em tempo real
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated || !token) {
      socketService.disconnect();
      return;
    }

    socketService.connect(token);

    const onDemandaCreated = ({ demanda, meta }: { demanda: Demanda; meta?: { actorId?: string } }) => {
      setDemandas((prev) => {
        if (prev.some((d) => d.id === demanda.id)) return prev;
        return [...prev, demanda];
      });

      if (meta?.actorId && meta.actorId !== user?.id) {
        toast.info(`Nova demanda criada: ${demanda.nome_demanda}`);
      }
    };

    const onDemandaUpdated = ({ demanda, meta }: { demanda: Demanda; meta?: { actorId?: string } }) => {
      let statusMudou = false;

      setDemandas((prev) => {
        const idx = prev.findIndex((d) => d.id === demanda.id);
        if (idx === -1) {
          return [...prev, demanda];
        }

        statusMudou = prev[idx]?.status !== demanda.status;
        const next = [...prev];
        next[idx] = demanda;
        return next;
      });

      // Evitar spam de toast: só notificar quando status muda e foi outro usuário
      if (statusMudou && meta?.actorId && meta.actorId !== user?.id) {
        toast.info(`Demanda atualizada: ${demanda.nome_demanda}`);
      }
    };

    const onDemandaDeleted = ({ id, meta }: { id: string; meta?: { actorId?: string } }) => {
      setDemandas((prev) => prev.filter((d) => d.id !== id));
      if (meta?.actorId && meta.actorId !== user?.id) {
        toast.info("Demanda excluída");
      }
    };

    const onTarefaFinalizada = ({
      demandaId,
      tarefaId,
      meta,
    }: {
      demandaId: string;
      tarefaId: string;
      meta?: { actorId?: string };
    }) => {
      // Normalmente já recebemos demanda:updated com a demanda completa.
      // Mantemos esse evento como “sinal” para futuras otimizações/UX.
      if (meta?.actorId && meta.actorId !== user?.id) {
        toast.info(`Tarefa finalizada (demanda ${demandaId}, tarefa ${tarefaId})`);
      }
    };

    socketService.on("demanda:created", onDemandaCreated);
    socketService.on("demanda:updated", onDemandaUpdated);
    socketService.on("demanda:deleted", onDemandaDeleted);
    socketService.on("tarefa:finalizada", onTarefaFinalizada);

    return () => {
      socketService.off("demanda:created", onDemandaCreated);
      socketService.off("demanda:updated", onDemandaUpdated);
      socketService.off("demanda:deleted", onDemandaDeleted);
      socketService.off("tarefa:finalizada", onTarefaFinalizada);
      socketService.disconnect();
    };
  }, [authLoading, isAuthenticated, token, user?.id]);


  // Usuario operations (with API integration)
  const addUsuario = useCallback(async (usuario: Omit<Usuario, "id">) => {
    const newUsuario = await apiService.createUsuario(usuario);
    setUsuarios((prev) => [...prev, newUsuario]);
    toast.success("Usuário criado com sucesso!");
  }, []);

  const updateUsuario = useCallback(async (id: string, usuario: Omit<Usuario, "id">) => {
    const updatedUsuario = await apiService.updateUsuario(id, usuario);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? updatedUsuario : u))
    );
    toast.success("Usuário atualizado com sucesso!");
  }, []);

  const deleteUsuario = useCallback(async (id: string) => {
    await apiService.deleteUsuario(id);
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuário excluído com sucesso!");
  }, []);

  // Template operations (with API integration)
  const addTemplate = useCallback(async (template: Omit<Template, "id">) => {
    const newTemplate = await apiService.createTemplate(template);
    setTemplates((prev) => [...prev, newTemplate]);
    toast.success("Template criado com sucesso!");
  }, []);

  const updateTemplate = useCallback(async (id: string, template: Omit<Template, "id">) => {
    const updatedTemplate = await apiService.updateTemplate(id, template);
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? updatedTemplate : t))
    );
    toast.success("Template atualizado com sucesso!");
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await apiService.deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template excluído com sucesso!");
  }, []);

  // Demanda operations (with API integration)
  const addDemanda = useCallback(async (demanda: Omit<Demanda, "id">) => {
    const newDemanda = await apiService.createDemanda(demanda);
    setDemandas((prev) => {
      // Verificar se a demanda já existe (pode ter sido adicionada via WebSocket)
      if (prev.some((d) => d.id === newDemanda.id)) return prev;
      return [...prev, newDemanda];
    });
    toast.success("Demanda criada com sucesso!");
  }, []);

  const updateDemanda = useCallback(async (id: string, demanda: DemandaUpdatePayload) => {
    const updatedDemanda = await apiService.updateDemanda(id, demanda);
    setDemandas((prev) =>
      prev.map((d) => (d.id === id ? updatedDemanda : d))
    );
    // Silenciar toast para updates frequentes (drag & drop)
    if (demanda.status) {
      toast.success("Demanda atualizada!");
    }
  }, []);

  const deleteDemanda = useCallback(async (id: string) => {
    await apiService.deleteDemanda(id);
    setDemandas((prev) => prev.filter((d) => d.id !== id));
    toast.success("Demanda excluída com sucesso!");
  }, []);

  // Acao operations (with API integration)
  const addAcao = useCallback(async (acao: Omit<Acao, "id">) => {
    const newAcao = await apiService.createAcao(acao);
    setAcoes((prev) => [...prev, newAcao]);
    toast.success("Ação criada com sucesso!");
  }, []);

  const updateAcao = useCallback(async (id: string, acao: Omit<Acao, "id">) => {
    const updatedAcao = await apiService.updateAcao(id, acao);
    setAcoes((prev) =>
      prev.map((a) => (a.id === id ? updatedAcao : a))
    );
    toast.success("Ação atualizada com sucesso!");
  }, []);

  const deleteAcao = useCallback(async (id: string) => {
    await apiService.deleteAcao(id);
    setAcoes((prev) => prev.filter((a) => a.id !== id));
    toast.success("Ação excluída com sucesso!");
  }, []);

  // Executar ação de uma tarefa (chama webhook)
  const executarAcaoTarefa = useCallback(async (demandaId: string, tarefaId: string) => {
    try {
      const result = await apiService.executarAcaoTarefa(demandaId, tarefaId);
      
      // Atualizar demanda no estado local com a resposta
      if (result.demanda) {
        setDemandas((prev) =>
          prev.map((d) => (d.id === demandaId ? result.demanda : d))
        );
      }
      
      toast.success("Ação executada com sucesso!");
    } catch (err: unknown) {
      logError("Erro ao executar ação:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao executar ação: ${errorMessage}`);
      throw err;
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

  const getCargo = useCallback(
    (id: string) => cargos.find((c) => c.id === id),
    [cargos]
  );

  const getAcao = useCallback(
    (id: string) => acoes.find((a) => a.id === id),
    [acoes]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<DataContextType>(
    () => ({
      usuarios,
      cargos,
      templates,
      demandas,
      acoes,
      refreshPublicData,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      addDemanda,
      updateDemanda,
      deleteDemanda,
      addAcao,
      updateAcao,
      deleteAcao,
      getTemplate,
      getUsuario,
      getCargo,
      getAcao,
      executarAcaoTarefa,
    }),
    [
      usuarios,
      cargos,
      templates,
      demandas,
      acoes,
      refreshPublicData,
      addUsuario,
      updateUsuario,
      deleteUsuario,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      addDemanda,
      updateDemanda,
      deleteDemanda,
      addAcao,
      updateAcao,
      deleteAcao,
      getTemplate,
      getUsuario,
      getCargo,
      getAcao,
      executarAcaoTarefa,
    ]
  );

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};
