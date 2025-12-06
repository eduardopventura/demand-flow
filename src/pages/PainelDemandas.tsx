import { useState, useMemo, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Demanda } from "@/types";
import { StatusDemanda } from "@/types";
import { STATUS_CONFIG } from "@/constants";
import { ordenarDemandas } from "@/utils/prazoUtils";
import { cn } from "@/lib/utils";

export default function PainelDemandas() {
  const { demandas, updateDemanda } = useData();
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusDemanda>(StatusDemanda.CRIADA);
  
  // State for confirmation dialog when moving from Finalizada
  const [pendingMove, setPendingMove] = useState<{ demandaId: string; newStatus: StatusDemanda } | null>(null);

  // Memoize filtered and sorted demandas to prevent unnecessary recalculations
  const demandaPorStatus = useMemo(() => ({
    [StatusDemanda.CRIADA]: ordenarDemandas(demandas.filter((d) => d.status === StatusDemanda.CRIADA)),
    [StatusDemanda.EM_ANDAMENTO]: ordenarDemandas(demandas.filter((d) => d.status === StatusDemanda.EM_ANDAMENTO)),
    [StatusDemanda.FINALIZADA]: ordenarDemandas(demandas.filter((d) => d.status === StatusDemanda.FINALIZADA)),
  }), [demandas]);

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
      // Se está saindo de Finalizada, mostrar confirmação
      if (demanda.status === StatusDemanda.FINALIZADA) {
        setPendingMove({ demandaId, newStatus });
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
              onCardClick={setDemandaSelecionada}
            />
            <KanbanColumn
              status={StatusDemanda.EM_ANDAMENTO}
              demandas={demandaPorStatus[StatusDemanda.EM_ANDAMENTO]}
              onCardClick={setDemandaSelecionada}
            />
            <KanbanColumn
              status={StatusDemanda.FINALIZADA}
              demandas={demandaPorStatus[StatusDemanda.FINALIZADA]}
              onCardClick={setDemandaSelecionada}
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
                  onCardClick={setDemandaSelecionada}
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
        onOpenChange={(open) => !open && setDemandaSelecionada(null)}
      />

      {/* Confirmation Dialog for moving from Finalizada */}
      <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Demanda</AlertDialogTitle>
            <AlertDialogDescription>
              Esta demanda já foi finalizada. Ao movê-la para outro status, a data de finalização será removida e as regras de prazo serão aplicadas novamente.
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
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
