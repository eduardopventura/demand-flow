import { useDroppable } from "@dnd-kit/core";
import { DemandaCard } from "./DemandaCard";
import type { Demanda } from "@/types";
import type { StatusColumnConfig } from "@/constants";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  columnName: string;
  config: StatusColumnConfig;
  demandas: Demanda[];
  onCardClick: (demanda: Demanda) => void;
  isMobile?: boolean;
  totalCount?: number;
  showViewAllLink?: boolean;
}

const KanbanColumnComponent = ({ columnName, config, demandas, onCardClick, isMobile, totalCount, showViewAllLink }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnName });

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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border-2 transition-all h-full min-w-[280px]",
        config.border,
        isOver && "ring-2 ring-primary/50"
      )}
    >
      <div className={cn("p-4 rounded-t-xl", config.bg)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground truncate">{config.label}</h3>
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

export const KanbanColumn = memo(KanbanColumnComponent, (prevProps, nextProps) => {
  if (prevProps.columnName !== nextProps.columnName) return false;
  if (prevProps.isMobile !== nextProps.isMobile) return false;
  if (prevProps.totalCount !== nextProps.totalCount) return false;
  if (prevProps.showViewAllLink !== nextProps.showViewAllLink) return false;
  if (prevProps.config !== nextProps.config) return false;
  if (prevProps.demandas.length !== nextProps.demandas.length) return false;

  for (let i = 0; i < prevProps.demandas.length; i++) {
    const prev = prevProps.demandas[i];
    const next = nextProps.demandas[i];
    if (prev?.id !== next?.id) return false;
    if (prev !== next) return false;
  }

  return true;
});
