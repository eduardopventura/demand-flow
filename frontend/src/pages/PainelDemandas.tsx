import { useState, useMemo, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { DemandaCard } from "@/components/kanban/DemandaCard";
import { NovaDemandaModal } from "@/components/modals/NovaDemandaModal";
import { DetalhesDemandaModal } from "@/components/modals/DetalhesDemandaModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Demanda } from "@/types";
import { StatusDemanda } from "@/types";
import { STATUS_CONFIG } from "@/constants";
import { ordenarDemandasCriadasOuEmAndamento, ordenarDemandasFinalizadas } from "@/utils/prazoUtils";
import { cn } from "@/lib/utils";

export default function PainelDemandas() {
  const { demandas, updateDemanda } = useData();
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [demandaSelecionadaId, setDemandaSelecionadaId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusDemanda>(StatusDemanda.CRIADA);
  
  // State for confirmation dialog when moving from Finalizada
  const [pendingMove, setPendingMove] = useState<{ demandaId: string; newStatus: StatusDemanda } | null>(null);

  // Memoize filtered and sorted demandas to prevent unnecessary recalculations
  const totalFinalizadas = useMemo(() => {
    return demandas.filter((d) => d.status === StatusDemanda.FINALIZADA).length;
  }, [demandas]);

  const demandaPorStatus = useMemo(() => {
    const criadas = demandas.filter((d) => d.status === StatusDemanda.CRIADA);
    const emAndamento = demandas.filter((d) => d.status === StatusDemanda.EM_ANDAMENTO);
    const finalizadas = demandas.filter((d) => d.status === StatusDemanda.FINALIZADA);
    
    // Ordenar finalizadas e limitar a 15
    const finalizadasOrdenadas = ordenarDemandasFinalizadas(finalizadas).slice(0, 15);
    
    return {
      [StatusDemanda.CRIADA]: ordenarDemandasCriadasOuEmAndamento(criadas),
      [StatusDemanda.EM_ANDAMENTO]: ordenarDemandasCriadasOuEmAndamento(emAndamento),
      [StatusDemanda.FINALIZADA]: finalizadasOrdenadas,
    };
  }, [demandas]);

  const handleDragStart = useCallback((event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const demandaId = active.id as string;
    const newStatus = over.id as StatusDemanda;

    const demanda = demandas.find((d) => d.id === demandaId);
    if (demanda && demanda.status !== newStatus) {
      // BLOQUEAR: Não permitir arrastar para "Criada" de outras seções
      if (newStatus === StatusDemanda.CRIADA && demanda.status !== StatusDemanda.CRIADA) {
        toast.error("Não é possível voltar uma demanda para o status 'Criada' após ela ter sido movida para outro status");
        return;
      }

      // Se está saindo de Finalizada, mostrar confirmação
      if (demanda.status === StatusDemanda.FINALIZADA) {
        setPendingMove({ demandaId, newStatus });
      } else if (newStatus === StatusDemanda.EM_ANDAMENTO) {
        // Ao arrastar para "Em Andamento", remover data_finalizacao se existir
        const updates: Partial<Demanda> = { status: newStatus };
        if (demanda.data_finalizacao) {
          updates.data_finalizacao = null;
        }
        updateDemanda(demandaId, updates);
      } else if (newStatus === StatusDemanda.FINALIZADA) {
        // Ao arrastar para "Finalizada", adicionar data_finalizacao
        updateDemanda(demandaId, { 
          status: newStatus,
          data_finalizacao: new Date().toISOString()
        });
      } else {
        updateDemanda(demandaId, { status: newStatus });
      }
    }
  }, [demandas, updateDemanda]);

  const handleConfirmMoveFromFinalizada = useCallback(() => {
    if (pendingMove) {
      updateDemanda(pendingMove.demandaId, { 
        status: pendingMove.newStatus,
        data_finalizacao: null, // Remove a data de finalização
      });
      setPendingMove(null);
    }
  }, [pendingMove, updateDemanda]);

  const handleCancelMoveFromFinalizada = useCallback(() => {
    setPendingMove(null);
  }, []);

  const activeDemanda = useMemo(
    () => (activeId ? demandas.find((d) => d.id === activeId) : null),
    [activeId, demandas]
  );

  // Evita “stale props”: sempre deriva a demanda selecionada do estado atual do DataContext
  const demandaSelecionada = useMemo(
    () => (demandaSelecionadaId ? demandas.find((d) => d.id === demandaSelecionadaId) ?? null : null),
    [demandaSelecionadaId, demandas]
  );

  // Mobile tab config with shorter labels
  const tabConfig = [
    { status: StatusDemanda.CRIADA, label: "Criada", shortLabel: "Criada" },
    { status: StatusDemanda.EM_ANDAMENTO, label: "Em Andamento", shortLabel: "Andamento" },
    { status: StatusDemanda.FINALIZADA, label: "Finalizada", shortLabel: "Finalizada" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header - Responsive */}
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel de Demandas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie todas as demandas em um quadro Kanban
            </p>
          </div>
          <Button onClick={() => setNovaDemandaOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span className="sm:inline">Nova Demanda</span>
          </Button>
        </div>
      </div>

      {/* Desktop Kanban Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto hidden lg:block">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-3 gap-6 h-full">
            <KanbanColumn
              status={StatusDemanda.CRIADA}
              demandas={demandaPorStatus[StatusDemanda.CRIADA]}
              onCardClick={(d) => setDemandaSelecionadaId(d.id)}
            />
            <KanbanColumn
              status={StatusDemanda.EM_ANDAMENTO}
              demandas={demandaPorStatus[StatusDemanda.EM_ANDAMENTO]}
              onCardClick={(d) => setDemandaSelecionadaId(d.id)}
            />
            <KanbanColumn
              status={StatusDemanda.FINALIZADA}
              demandas={demandaPorStatus[StatusDemanda.FINALIZADA]}
              onCardClick={(d) => setDemandaSelecionadaId(d.id)}
              totalCount={totalFinalizadas}
              showViewAllLink={totalFinalizadas > 15}
            />
          </div>

          <DragOverlay>
            {activeDemanda && <DemandaCard demanda={activeDemanda} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile/Tablet Tabs View */}
      <div className="flex-1 overflow-hidden lg:hidden flex flex-col">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as StatusDemanda)}
          className="flex flex-col h-full"
        >
          <div className="px-4 pt-4 bg-background sticky top-0 z-10">
            <TabsList className="w-full grid grid-cols-3">
              {tabConfig.map(({ status, shortLabel }) => {
                const config = STATUS_CONFIG[status];
                const count = demandaPorStatus[status].length;
                return (
                  <TabsTrigger 
                    key={status} 
                    value={status}
                    className="text-xs sm:text-sm flex gap-1 items-center"
                  >
                    <span className="truncate">{shortLabel}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      config.bg
                    )}>
                      {count}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          
          <DndContext
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {tabConfig.map(({ status }) => (
              <TabsContent 
                key={status} 
                value={status} 
                className="flex-1 overflow-auto px-4 pb-4 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <KanbanColumn
                  status={status}
                  demandas={demandaPorStatus[status]}
                  onCardClick={(d) => setDemandaSelecionadaId(d.id)}
                  isMobile
                />
              </TabsContent>
            ))}

            <DragOverlay>
              {activeDemanda && <DemandaCard demanda={activeDemanda} isDragging />}
            </DragOverlay>
          </DndContext>
        </Tabs>
      </div>

      <NovaDemandaModal open={novaDemandaOpen} onOpenChange={setNovaDemandaOpen} />
      <DetalhesDemandaModal
        demanda={demandaSelecionada}
        open={!!demandaSelecionada}
        onOpenChange={(open) => !open && setDemandaSelecionadaId(null)}
      />

      {/* Confirmation Dialog for moving from Finalizada */}
      <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Demanda</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Esta demanda já foi finalizada. Ao movê-la para outro status, a data de finalização será removida e as regras de prazo serão aplicadas novamente.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja continuar?
            </p>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCancelMoveFromFinalizada} className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMoveFromFinalizada} className="w-full sm:w-auto">
              Sim, reabrir demanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
