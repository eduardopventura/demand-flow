import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { DemandaCard } from "@/components/kanban/DemandaCard";
import { NovaDemandaModal } from "@/components/modals/NovaDemandaModal";
import { DetalhesDemandaModal } from "@/components/modals/DetalhesDemandaModal";
import type { Demanda } from "@/contexts/DataContext";

export default function PainelDemandas() {
  const { demandas, updateDemanda } = useData();
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const demandaPorStatus = {
    Criada: demandas.filter((d) => d.status === "Criada"),
    "Em Andamento": demandas.filter((d) => d.status === "Em Andamento"),
    Finalizada: demandas.filter((d) => d.status === "Finalizada"),
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const demandaId = active.id as string;
    const newStatus = over.id as "Criada" | "Em Andamento" | "Finalizada";

    const demanda = demandas.find((d) => d.id === demandaId);
    if (demanda && demanda.status !== newStatus) {
      updateDemanda(demandaId, { status: newStatus });
    }
  };

  const activeDemanda = activeId ? demandas.find((d) => d.id === activeId) : null;

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
              status="Criada"
              demandas={demandaPorStatus.Criada}
              onCardClick={setDemandaSelecionada}
            />
            <KanbanColumn
              status="Em Andamento"
              demandas={demandaPorStatus["Em Andamento"]}
              onCardClick={setDemandaSelecionada}
            />
            <KanbanColumn
              status="Finalizada"
              demandas={demandaPorStatus.Finalizada}
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
