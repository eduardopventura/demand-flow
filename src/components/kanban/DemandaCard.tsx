import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, GripVertical, Trash2 } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { Demanda } from "@/contexts/DataContext";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
  const { getUsuario, deleteDemanda } = useData();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: demanda.id,
  });

  const responsavel = getUsuario(demanda.responsavel_id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDemanda(demanda.id);
  };

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
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Demanda</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a demanda "{demanda.nome_demanda}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
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
