import { useDroppable } from "@dnd-kit/core";
import { DemandaCard } from "./DemandaCard";
import type { Demanda } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: "Criada" | "Em Andamento" | "Finalizada";
  demandas: Demanda[];
  onCardClick: (demanda: Demanda) => void;
}

const statusConfig = {
  Criada: {
    bg: "bg-kanban-created",
    border: "border-primary/20",
  },
  "Em Andamento": {
    bg: "bg-kanban-progress",
    border: "border-warning/20",
  },
  Finalizada: {
    bg: "bg-kanban-finished",
    border: "border-success/20",
  },
};

export const KanbanColumn = ({ status, demandas, onCardClick }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border-2 transition-all h-full",
        config.border,
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className={cn("p-4 rounded-t-xl", config.bg)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{status}</h3>
          <span className="text-sm font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded">
            {demandas.length}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-auto bg-background/50">
        {demandas.map((demanda) => (
          <DemandaCard
            key={demanda.id}
            demanda={demanda}
            onClick={() => onCardClick(demanda)}
          />
        ))}
        {demandas.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Nenhuma demanda
          </div>
        )}
      </div>
    </div>
  );
};
