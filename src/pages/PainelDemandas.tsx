import { useState, useMemo, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { DemandaCard } from "@/components/kanban/DemandaCard";
import { NovaDemandaModal } from "@/components/modals/NovaDemandaModal";
import { DetalhesDemandaModal } from "@/components/modals/DetalhesDemandaModal";
import type { Demanda } from "@/types";
import { StatusDemanda } from "@/types";

export default function PainelDemandas() {
  const { demandas, updateDemanda } = useData();
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Memoize filtered demandas to prevent unnecessary recalculations
  const demandaPorStatus = useMemo(() => ({
    [StatusDemanda.CRIADA]: demandas.filter((d) => d.status === StatusDemanda.CRIADA),
    [StatusDemanda.EM_ANDAMENTO]: demandas.filter((d) => d.status === StatusDemanda.EM_ANDAMENTO),
    [StatusDemanda.FINALIZADA]: demandas.filter((d) => d.status === StatusDemanda.FINALIZADA),
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
      updateDemanda(demandaId, { status: newStatus });
    }
  }, [demandas, updateDemanda]);

  const activeDemanda = useMemo(
    () => (activeId ? demandas.find((d) => d.id === activeId) : null),
    [activeId, demandas]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b bg-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painel de Demandas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todas as demandas em um quadro Kanban
            </p>
          </div>
          <Button onClick={() => setNovaDemandaOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Nova Demanda
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
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

      <NovaDemandaModal open={novaDemandaOpen} onOpenChange={setNovaDemandaOpen} />
      <DetalhesDemandaModal
        demanda={demandaSelecionada}
        open={!!demandaSelecionada}
        onOpenChange={(open) => !open && setDemandaSelecionada(null)}
      />
    </div>
  );
}
