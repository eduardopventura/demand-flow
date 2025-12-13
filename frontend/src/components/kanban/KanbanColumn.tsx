import { useDroppable } from "@dnd-kit/core";
import { DemandaCard } from "./DemandaCard";
import type { Demanda } from "@/types";
import { StatusDemanda } from "@/types";
import { STATUS_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  status: StatusDemanda;
  demandas: Demanda[];
  onCardClick: (demanda: Demanda) => void;
  isMobile?: boolean;
  totalCount?: number; // Total count for showing "view all" link
  showViewAllLink?: boolean; // Whether to show "view all" link
}

const KanbanColumnComponent = ({ status, demandas, onCardClick, isMobile, totalCount, showViewAllLink }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  // Mobile layout - simplified without header (tabs already show status)
  if (isMobile) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto overflow-x-hidden",
          isOver && "ring-2 ring-primary/50 rounded-lg"
        )}
      >
        {demandas.map((demanda) => (
          <DemandaCard
            key={demanda.id}
            demanda={demanda}
            onClick={() => onCardClick(demanda)}
          />
        ))}
        {demandas.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12 bg-muted/30 rounded-lg">
            Nenhuma demanda neste status
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - original with header
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground bg-background/50 px-2 py-1 rounded">
              {totalCount !== undefined ? totalCount : demandas.length}
            </span>
            {showViewAllLink && totalCount !== undefined && totalCount > demandas.length && (
              <Link to="/finalizadas">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver todas
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)] bg-background/50">
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

// Memoize component to prevent unnecessary re-renders
export const KanbanColumn = memo(KanbanColumnComponent, (prevProps, nextProps) => {
  return (
    prevProps.status === nextProps.status &&
    prevProps.demandas.length === nextProps.demandas.length &&
    prevProps.demandas.every((d, i) => d.id === nextProps.demandas[i]?.id) &&
    prevProps.isMobile === nextProps.isMobile
  );
});
