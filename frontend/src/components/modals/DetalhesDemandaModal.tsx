import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Zap, Play, Check, AlertCircle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import type { Demanda, TarefaStatus, CampoPreenchimento, Tarefa } from "@/types";
import { formatarData } from "@/utils/prazoUtils";
import { avaliarCondicaoVisibilidade, ordenarCamposPorAba, buscarValorCampo } from "@/utils/campoUtils";
import { StickyTabs } from "@/components/StickyTabs";
import { CampoInput, ResponsavelSelect, GrupoCampos } from "@/components/form";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/hooks/useDebounce";

interface DetalhesDemandaModalProps {
  demanda: Demanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SavingStatus = "idle" | "saving" | "saved" | "error";

export const DetalhesDemandaModal = ({ demanda, open, onOpenChange }: DetalhesDemandaModalProps) => {
  const { updateDemanda, getTemplate, acoes, getAcao, getCargo, executarAcaoTarefa } = useData();
  const [responsavelId, setResponsavelId] = useState("");
  const [camposValores, setCamposValores] = useState<Record<string, string>>({});
  const [tarefasStatus, setTarefasStatus] = useState<TarefaStatus[]>([]);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [pendingTaskToggle, setPendingTaskToggle] = useState<{ tarefaId: string; concluida: boolean } | null>(null);
  const [dataPrevisao, setDataPrevisao] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<string>("geral");
  const [executandoAcao, setExecutandoAcao] = useState<string | null>(null);
  const [grupoReplicas, setGrupoReplicas] = useState<Record<string, number>>({});
  
  // Auto-save states
  const [savingStatus, setSavingStatus] = useState<SavingStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const tabsSentinelRef = useRef<HTMLDivElement>(null);
  const initialSnapshotRef = useRef<{
    responsavel_id: string;
    data_previsao: string;
    observacoes: string;
    camposValores: Record<string, string>;
    tarefasStatus: TarefaStatus[];
  } | null>(null);

  const template = demanda ? getTemplate(demanda.template_id) : null;

  // Função auxiliar de salvamento parcial
  const savePartial = useCallback(async (payload: any) => {
    if (!demanda) return;
    
    setSavingStatus("saving");
    try {
      await updateDemanda(demanda.id, payload);
      setSavingStatus("saved");
      setLastSaved(new Date());
      
      // Voltar para idle após 2 segundos
      setTimeout(() => {
        setSavingStatus((prev) => prev === "saved" ? "idle" : prev);
      }, 2000);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSavingStatus("error");
      toast.error("Erro ao salvar alterações. Verifique sua conexão.");
    }
  }, [demanda, updateDemanda]);

  // Debounced save para campos de texto
  const debouncedSaveCampo = useDebouncedCallback((idCampo: string, valor: string) => {
    savePartial({
      campos_preenchidos_patch: [{ id_campo: idCampo, valor }]
    });
  }, 1000);

  // Debounced save para observações
  const debouncedSaveObservacoes = useDebouncedCallback((valor: string) => {
    savePartial({ observacoes: valor });
  }, 1000);

  // Verificar se todos os campos obrigatórios de uma ação estão preenchidos
  const verificarCamposAcaoPreenchidos = (tarefa: Tarefa) => {
    if (!tarefa.acao_id || !tarefa.mapeamento_campos) return { todosPreenchidos: false, camposPendentes: [], camposPreenchidos: [] };
    
    const acao = getAcao(tarefa.acao_id);
    if (!acao) return { todosPreenchidos: false, camposPendentes: [], camposPreenchidos: [] };
    
    const camposPreenchidosNomes: string[] = [];
    const camposPendentes: string[] = [];
    
    for (const campoAcao of acao.campos) {
      const campoDemandaId = tarefa.mapeamento_campos[campoAcao.id_campo];
      
      if (campoDemandaId) {
        const valorCampo = buscarValorCampo(camposValores, campoDemandaId);
        if (valorCampo && valorCampo.trim() !== "") {
          camposPreenchidosNomes.push(campoAcao.nome_campo);
        } else if (campoAcao.obrigatorio) {
          camposPendentes.push(campoAcao.nome_campo);
        }
      } else if (campoAcao.obrigatorio) {
        camposPendentes.push(campoAcao.nome_campo);
      }
    }
    
    return {
      todosPreenchidos: camposPendentes.length === 0,
      camposPendentes,
      camposPreenchidos: camposPreenchidosNomes,
    };
  };

  // Handler para executar ação
  const handleExecutarAcao = async (tarefaId: string) => {
    if (!demanda) return;
    
    setExecutandoAcao(tarefaId);
    try {
      await executarAcaoTarefa(demanda.id, tarefaId);
      
      // Atualizar o status local da tarefa
      setTarefasStatus(prev => prev.map(t => 
        t.id_tarefa === tarefaId ? { ...t, concluida: true } : t
      ));
      
      toast.success("Ação executada com sucesso!");
    } catch (error) {
      // Toast de erro já é mostrado no contexto
    } finally {
      setExecutandoAcao(null);
    }
  };

  // Abas do template (com fallback para aba Geral)
  const abas = useMemo(() => {
    if (!template?.abas?.length) {
      return [{ id: "geral", nome: "Geral", ordem: 0 }];
    }
    return [...template.abas].sort((a, b) => a.ordem - b.ordem);
  }, [template]);

  // Detectar quantidade de réplicas de cada grupo com base nos campos salvos
  const detectarReplicasGrupos = (camposPreenchidos: { id_campo: string; valor: string }[], templateCampos: CampoPreenchimento[]) => {
    const replicas: Record<string, number> = {};
    
    for (const campo of templateCampos) {
      if (campo.tipo_campo === "grupo" && campo.campos) {
        // Encontrar o maior índice de réplica para este grupo
        let maxIndex = 0;
        for (const campoFilho of campo.campos) {
          const regex = new RegExp(`^${campoFilho.id_campo}__(\\d+)$`);
          for (const preenchido of camposPreenchidos) {
            const match = preenchido.id_campo.match(regex);
            if (match) {
              const index = parseInt(match[1], 10);
              if (index >= maxIndex) {
                maxIndex = index + 1;
              }
            }
          }
        }
        replicas[campo.id_campo] = maxIndex || (campo.quantidade_replicas_padrao || 1);
      }
    }
    
    return replicas;
  };

  useEffect(() => {
    if (demanda && template) {
      setResponsavelId(demanda.responsavel_id);
      
      const valores: Record<string, string> = {};
      demanda.campos_preenchidos.forEach((campo) => {
        valores[campo.id_campo] = campo.valor;
      });
      setCamposValores(valores);
      
      // Detectar réplicas dos grupos
      const replicas = detectarReplicasGrupos(demanda.campos_preenchidos, template.campos_preenchimento);
      setGrupoReplicas(replicas);
      
      setTarefasStatus([...demanda.tarefas_status]);
      setDataPrevisao(new Date(demanda.data_previsao));
      setObservacoes(demanda.observacoes || "");
      
      // Selecionar primeira aba
      if (abas.length > 0) {
        setAbaAtiva(abas[0].id);
      }

      // Snapshot inicial para merge por campo (evita sobrescrever alterações concorrentes)
      initialSnapshotRef.current = {
        responsavel_id: demanda.responsavel_id,
        data_previsao: demanda.data_previsao,
        observacoes: demanda.observacoes || "",
        camposValores: valores,
        tarefasStatus: [...demanda.tarefas_status],
      };
    }
  }, [demanda, template, abas]);

  // Atualizar valores quando número de réplicas muda
  const handleReplicaChange = (grupoId: string, newCount: number) => {
    const grupo = template?.campos_preenchimento.find(c => c.id_campo === grupoId);
    if (!grupo || grupo.tipo_campo !== "grupo") return;
    
    const oldCount = grupoReplicas[grupoId] || 1;
    const newValues = { ...camposValores };
    
    // Lista de campos afetados para salvar
    const camposParaSalvar: { id_campo: string; valor: string }[] = [];
    const camposParaRemover: string[] = [];

    if (newCount > oldCount) {
      // Adicionar campos para novas réplicas
      (grupo.campos || []).forEach((campoFilho) => {
        for (let i = oldCount; i < newCount; i++) {
          const id = `${campoFilho.id_campo}__${i}`;
          newValues[id] = "";
          camposParaSalvar.push({ id_campo: id, valor: "" });
        }
      });
    } else if (newCount < oldCount) {
      // Remover campos das réplicas removidas
      (grupo.campos || []).forEach((campoFilho) => {
        for (let i = newCount; i < oldCount; i++) {
          const id = `${campoFilho.id_campo}__${i}`;
          delete newValues[id];
          camposParaRemover.push(id);
        }
      });
    }
    
    setCamposValores(newValues);
    setGrupoReplicas({ ...grupoReplicas, [grupoId]: newCount });
    
    // Salvar alterações de estrutura imediatamente
    if (camposParaSalvar.length > 0 || camposParaRemover.length > 0) {
      const payload: any = {};
      if (camposParaSalvar.length > 0) payload.campos_preenchidos_patch = camposParaSalvar;
      if (camposParaRemover.length > 0) payload.campos_preenchidos_remove = camposParaRemover;
      savePartial(payload);
    }
  };

  // Filtrar e ordenar campos visíveis para uma aba específica
  const getCamposVisiveis = (abaId: string): CampoPreenchimento[] => {
    if (!template) return [];

    // Primeiro ordenar por aba
    const camposOrdenados = ordenarCamposPorAba(template.campos_preenchimento, abaId);

    // Depois filtrar por visibilidade
    return camposOrdenados.filter((campo) => {
      // Verificar condição de visibilidade (não aplicável para grupos)
      if (campo.tipo_campo !== "grupo") {
        return avaliarCondicaoVisibilidade(campo.condicao_visibilidade, camposValores);
      }
      
      return true;
    });
  };

  const handleTarefaToggle = (tarefaId: string, concluida: boolean) => {
    // Se a demanda está finalizada e está desmarcando uma tarefa, mostrar confirmação
    if (demanda?.status === "Finalizada" && !concluida) {
      setPendingTaskToggle({ tarefaId, concluida });
      setShowReopenConfirm(true);
      return;
    }

    const novoStatus = tarefasStatus.map((t) =>
      t.id_tarefa === tarefaId ? { ...t, concluida } : t
    );
    setTarefasStatus(novoStatus);
    
    // Salvar tarefa imediatamente
    const tarefaAtual = tarefasStatus.find(t => t.id_tarefa === tarefaId);
    if (tarefaAtual) {
      savePartial({
        tarefas_status_patch: [{
          id_tarefa: tarefaId,
          concluida,
          responsavel_id: tarefaAtual.responsavel_id,
          cargo_responsavel_id: tarefaAtual.cargo_responsavel_id
        }]
      });
    }
  };

  const handleConfirmReopenFromTaskToggle = () => {
    if (pendingTaskToggle) {
      const novoStatus = tarefasStatus.map((t) =>
        t.id_tarefa === pendingTaskToggle.tarefaId ? { ...t, concluida: pendingTaskToggle.concluida } : t
      );
      setTarefasStatus(novoStatus);
      
      const tarefaAtual = tarefasStatus.find(t => t.id_tarefa === pendingTaskToggle.tarefaId);
      if (tarefaAtual) {
        savePartial({
          tarefas_status_patch: [{
            id_tarefa: pendingTaskToggle.tarefaId,
            concluida: pendingTaskToggle.concluida,
            responsavel_id: tarefaAtual.responsavel_id,
            cargo_responsavel_id: tarefaAtual.cargo_responsavel_id
          }]
        });
      }
    }
    setShowReopenConfirm(false);
    setPendingTaskToggle(null);
  };

  const handleCancelReopenFromTaskToggle = () => {
    setShowReopenConfirm(false);
    setPendingTaskToggle(null);
  };

  // Handler para iniciar andamento
  const handleIniciarAndamento = () => {
    if (!demanda) return;
    savePartial({
      status: "Em Andamento",
      data_finalizacao: null,
    });
    toast.success("Demanda iniciada com sucesso!");
  };

  // Handler para finalizar demanda
  const handleFinalizarDemanda = () => {
    if (!demanda) return;
    savePartial({
      status: "Finalizada",
      data_finalizacao: new Date().toISOString(),
    });
    toast.success("Demanda finalizada com sucesso!");
  };

  // Calcular condições para mostrar botão de status
  const podeMostrarBotaoStatus = useMemo(() => {
    if (!demanda) return { mostrar: false, tipo: null as null | "iniciar" | "finalizar" };
    
    const nenhumaTarefaConcluida = tarefasStatus.every(t => !t.concluida);
    const temTarefasAbertas = tarefasStatus.some(t => !t.concluida);
    
    // Condição 1: Status "Criada" + nenhuma tarefa concluída
    if (demanda.status === "Criada" && nenhumaTarefaConcluida) {
      return { mostrar: true, tipo: "iniciar" as const };
    }
    
    // Condição 2: Status "Em Andamento" + 1+ tarefas abertas
    if (demanda.status === "Em Andamento" && temTarefasAbertas) {
      return { mostrar: true, tipo: "finalizar" as const };
    }
    
    return { mostrar: false, tipo: null as null };
  }, [demanda, tarefasStatus]);

  const getTarefasVisiveis = () => {
    if (!template) return [];

    return template.tarefas.filter((tarefa) => {
      if (!tarefa.link_pai) return true;
      
      const tarefaPai = tarefasStatus.find((t) => t.id_tarefa === tarefa.link_pai);
      return tarefaPai?.concluida || false;
    });
  };

  const handleCampoChange = (idCampo: string, valor: string) => {
    setCamposValores(prev => ({ ...prev, [idCampo]: valor }));
    
    // Verificar tipo do campo para decidir estratégia de salvamento
    const campo = template?.campos_preenchimento.find(c => c.id_campo === idCampo);
    // Verificar se é campo de grupo (replica)
    const isGrupoReplica = idCampo.includes("__");
    
    let tipo = "texto";
    if (campo) {
      tipo = campo.tipo_campo;
    } else if (isGrupoReplica) {
      // Tentar inferir tipo pelo pai
      const parentId = idCampo.split("__")[0];
      const parent = template?.campos_preenchimento.find(c => c.id_campo === parentId);
      if (parent && parent.campos) {
        // Encontrar subcampo na lista flat de campos do grupo? 
        // A estrutura do GrupoCampos e handleReplicaChange sugere que não temos o ID do subcampo facilmente aqui.
        // Mas podemos assumir que uploads de arquivo e selects devem ser imediatos.
        // Se o valor parece um path de arquivo (/uploads/...) ou é curto e específico, salvar já.
        // Por segurança, vamos salvar imediatamente inputs que não sejam texto livre longo.
      }
    }

    // Estratégia:
    // Texto/Numero/Textarea -> Debounce
    // Arquivo/Data/Select/Checkbox -> Imediato
    const deveSalvarImediatamente = 
      tipo === "arquivo" || 
      tipo === "data" || 
      tipo === "dropdown" || 
      (tipo === "numero" && valor.length < 3) || // Números curtos (ex: qtd)
      valor.startsWith("/uploads/"); // Arquivo
      
    if (deveSalvarImediatamente) {
      savePartial({
        campos_preenchidos_patch: [{ id_campo: idCampo, valor }]
      });
    } else {
      debouncedSaveCampo(idCampo, valor);
    }
  };

  // Renderizar um campo (simples ou grupo)
  const renderCampo = (campo: CampoPreenchimento) => {
    if (campo.tipo_campo === "grupo") {
      return renderGrupo(campo);
    }
    
    return (
      <div key={campo.id_campo} className="space-y-2">
        <Label className="text-sm">{campo.nome_campo}</Label>
        <CampoInput
          campo={campo}
          value={camposValores[campo.id_campo] || ""}
          onChange={(valor) => handleCampoChange(campo.id_campo, valor)}
          showCurrentValue={campo.tipo_campo === "arquivo"}
        />
      </div>
    );
  };

  // Renderizar um grupo com réplicas usando o componente GrupoCampos
  const renderGrupo = (grupo: CampoPreenchimento) => (
    <GrupoCampos
      grupo={grupo}
      qtdReplicas={grupoReplicas[grupo.id_campo] || 1}
      camposValores={camposValores}
      onCampoChange={handleCampoChange}
      onReplicaChange={handleReplicaChange}
      showObrigatorio={false}
      viewMode={true}
    />
  );

  if (!demanda || !template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pr-6 w-full">
            <span className="text-base sm:text-lg line-clamp-2">{demanda.nome_demanda}</span>
            
            {/* Saving Indicator */}
            <div className="flex items-center gap-1.5 sm:ml-auto mt-1 sm:mt-0">
              {savingStatus === "saving" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-normal">Salvando...</span>
                </>
              )}
              {savingStatus === "saved" && (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs text-green-600 font-normal">Salvo</span>
                </>
              )}
              {savingStatus === "error" && (
                <>
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-xs text-red-600 font-normal">Erro ao salvar</span>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Sticky Tabs */}
        <StickyTabs
          abas={abas}
          abaAtiva={abaAtiva}
          onAbaChange={setAbaAtiva}
          sentinelRef={tabsSentinelRef}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Seção: Informações e Datas */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Informações</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1 p-3 rounded-md bg-muted/30 border border-dashed">
                <Label className="text-xs text-muted-foreground">Data de Criação</Label>
                <p className="text-sm font-medium">{formatarData(demanda.data_criacao)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data de Previsão</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !dataPrevisao && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataPrevisao ? formatarData(dataPrevisao.toISOString()) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataPrevisao}
                      onSelect={(date) => {
                        setDataPrevisao(date);
                        setIsCalendarOpen(false);
                        if (date) {
                          savePartial({ data_previsao: date.toISOString() });
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {demanda.data_finalizacao && (
                <div className="space-y-1 sm:col-span-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
                  <Label className="text-xs text-green-600">Data de Finalização</Label>
                  <p className="text-sm font-medium text-green-600">{formatarData(demanda.data_finalizacao)}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Responsável</Label>
              <ResponsavelSelect
                value={responsavelId}
                onValueChange={(val) => {
                  setResponsavelId(val);
                  savePartial({ responsavel_id: val });
                }}
                includeCargos={false}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Observações</Label>
                <span className={cn(
                  "text-xs",
                  observacoes.length > 250 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {observacoes.length}/250
                </span>
              </div>
              <Textarea
                value={observacoes}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 250) {
                    toast.error("Observações deve ter no máximo 250 caracteres");
                    return;
                  }
                  setObservacoes(value);
                  debouncedSaveObservacoes(value);
                }}
                placeholder="Adicione observações sobre esta demanda..."
                className="resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Seção: Campos de Preenchimento */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Campos de Preenchimento</h3>
            
            {/* Sentinel para StickyTabs */}
            <div ref={tabsSentinelRef} />
            
            {abas.length > 1 ? (
              <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
                <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border">
                  {abas.map((aba) => (
                    <TabsTrigger 
                      key={aba.id} 
                      value={aba.id}
                      className="flex-1 min-w-fit px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground rounded-md"
                    >
                      {aba.nome}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {abas.map((aba) => (
                  <TabsContent key={aba.id} value={aba.id} className="mt-4 space-y-4">
                    {getCamposVisiveis(aba.id).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-background">
                        Nenhum campo nesta aba
                      </p>
                    ) : (
                      getCamposVisiveis(aba.id).map((campo) => renderCampo(campo))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              // Se só tem uma aba, mostra sem tabs
              <div className="space-y-4">
                {getCamposVisiveis(abas[0]?.id || "geral").map((campo) => renderCampo(campo))}
              </div>
            )}
          </div>

          {/* Seção: Tarefas */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tarefas</h3>
              <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {tarefasStatus.filter((t) => t.concluida).length}/{tarefasStatus.length}
              </span>
            </div>
            <div className="space-y-3">
              {getTarefasVisiveis().map((tarefa) => {
                const status = tarefasStatus.find((t) => t.id_tarefa === tarefa.id_tarefa);
                const tarefaPai = tarefa.link_pai
                  ? template.tarefas.find((t) => t.id_tarefa === tarefa.link_pai)
                  : null;
                
                // Determina o responsável atual da tarefa (usuário OU cargo; fallback para responsável da demanda)
                const responsavelTarefa =
                  status?.cargo_responsavel_id || status?.responsavel_id || demanda.responsavel_id;

                return (
                  <div
                    key={tarefa.id_tarefa}
                    className={cn(
                      "p-3 rounded-lg border bg-background space-y-2 transition-colors",
                      status?.concluida && "bg-green-500/5 border-green-500/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={status?.concluida || false}
                        onCheckedChange={(checked) =>
                          handleTarefaToggle(tarefa.id_tarefa, checked as boolean)
                        }
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-sm sm:text-base",
                          status?.concluida && "line-through text-muted-foreground"
                        )}>{tarefa.nome_tarefa}</p>
                        {tarefaPai && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                            Depende de: {tarefaPai.nome_tarefa}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-8 space-y-1">
                      <Label className="text-xs">Responsável</Label>
                      <ResponsavelSelect
                        value={responsavelTarefa || demanda.responsavel_id || ""}
                        onValueChange={(v) => {
                          const novosStatus = tarefasStatus.map((t) =>
                              t.id_tarefa === tarefa.id_tarefa
                                ? {
                                    ...t,
                                    // Se selecionou o padrão, limpar override
                                    ...(v === demanda.responsavel_id || v === ""
                                      ? { responsavel_id: null, cargo_responsavel_id: null }
                                      : // Se v corresponde a um cargo, setar cargo_responsavel_id
                                      getCargo(v)
                                      ? { responsavel_id: null, cargo_responsavel_id: v }
                                      : { responsavel_id: v, cargo_responsavel_id: null })
                                  }
                                : t
                            );
                          setTarefasStatus(novosStatus);
                          
                          // Salvar imediatamente
                          const tarefaAtualizada = novosStatus.find(t => t.id_tarefa === tarefa.id_tarefa);
                          if (tarefaAtualizada) {
                            savePartial({
                              tarefas_status_patch: [{
                                id_tarefa: tarefa.id_tarefa,
                                concluida: tarefaAtualizada.concluida,
                                responsavel_id: tarefaAtualizada.responsavel_id,
                                cargo_responsavel_id: tarefaAtualizada.cargo_responsavel_id
                              }]
                            });
                          }
                        }}
                        defaultResponsavelId={demanda.responsavel_id}
                        triggerClassName="h-8 text-sm"
                        includeCargos={true}
                      />
                    </div>

                    {/* Painel de Ação Automática */}
                    {tarefa.acao_id && (() => {
                      const acao = getAcao(tarefa.acao_id);
                      if (!acao) return null;

                      const { todosPreenchidos, camposPendentes, camposPreenchidos } = verificarCamposAcaoPreenchidos(tarefa);
                      const isExecutando = executandoAcao === tarefa.id_tarefa;
                      const podeExecutar = todosPreenchidos && !status?.concluida && !isExecutando;

                      return (
                        <div className="ml-8 mt-2 p-2 rounded-md border bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Zap className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">{acao.nome}</span>
                            </div>
                            
                            {/* Status dos campos */}
                            <div className="flex items-center gap-1">
                              {todosPreenchidos ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <Check className="w-3.5 h-3.5" />
                                      <span className="text-xs">Pronto</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Todos os campos obrigatórios estão preenchidos</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-amber-600">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      <span className="text-xs">{camposPendentes.length} pendente{camposPendentes.length > 1 ? "s" : ""}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-medium mb-1">Campos pendentes:</p>
                                    <ul className="text-xs list-disc pl-3">
                                      {camposPendentes.map((campo, i) => (
                                        <li key={i}>{campo}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>

                          {/* Botão Executar */}
                          <Button
                            size="sm"
                            variant={podeExecutar ? "default" : "outline"}
                            className="w-full h-7 text-xs gap-1.5"
                            disabled={!podeExecutar}
                            onClick={() => handleExecutarAcao(tarefa.id_tarefa)}
                          >
                            {isExecutando ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Executando...
                              </>
                            ) : status?.concluida ? (
                              <>
                                <Check className="w-3 h-3" />
                                Executado
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                Executar Ação
                              </>
                            )}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-2 sm:gap-0">
          {/* Indicador de último modificador - canto esquerdo */}
          <div className="flex-1 text-xs text-muted-foreground">
            {demanda.modificado_por && (
              <span>Modificado por: {demanda.modificado_por.nome}</span>
            )}
            {lastSaved && (
              <span> • Salvo às {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {podeMostrarBotaoStatus.mostrar && podeMostrarBotaoStatus.tipo === "iniciar" && (
              <Button 
                onClick={handleIniciarAndamento} 
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Iniciar Andamento
              </Button>
            )}
            {podeMostrarBotaoStatus.mostrar && podeMostrarBotaoStatus.tipo === "finalizar" && (
              <Button 
                onClick={handleFinalizarDemanda} 
                variant="destructive"
                className="w-full sm:w-auto"
              >
                Finalizar Demanda
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for reopening a finalized demand */}
      <AlertDialog open={showReopenConfirm} onOpenChange={setShowReopenConfirm}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Demanda</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Esta demanda já foi finalizada. Ao desmarcar esta tarefa, a demanda será reaberta e a data de finalização será removida.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja continuar?
            </p>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCancelReopenFromTaskToggle} className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReopenFromTaskToggle} className="w-full sm:w-auto">
              Sim, reabrir demanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
