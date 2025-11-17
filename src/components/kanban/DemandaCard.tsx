import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GripVertical } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { Demanda } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";

interface DemandaCardProps {
  demanda: Demanda;
  onClick?: () => void;
  isDragging?: boolean;
}

const prioridadeConfig = {
  Baixa: "bg-secondary text-secondary-foreground",
  Média: "bg-warning text-warning-foreground",
  Alta: "bg-destructive text-destructive-foreground",
};

export const DemandaCard = ({ demanda, onClick, isDragging }: DemandaCardProps) => {
  const { getUsuario } = useData();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: demanda.id,
  });

  const responsavel = getUsuario(demanda.responsavel_id);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 cursor-pointer hover:shadow-md transition-all",
        isDragging && "opacity-50 rotate-3"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-foreground flex-1">{demanda.nome_demanda}</h4>
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className={prioridadeConfig[demanda.prioridade]}>
          {demanda.prioridade}
        </Badge>
        {responsavel && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{responsavel.nome}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
