import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { User, GripVertical, Trash2, Calendar } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import type { Demanda } from "@/types";
import { cn } from "@/lib/utils";
import { getCorBordaPrazo, formatarData, getPrimeiroNome } from "@/utils/prazoUtils";
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
import { memo } from "react";

interface DemandaCardProps {
  demanda: Demanda;
  onClick?: () => void;
  isDragging?: boolean;
}

const DemandaCardComponent = ({ demanda, onClick, isDragging }: DemandaCardProps) => {
  const { getUsuario, deleteDemanda, getTemplate } = useData();
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: demanda.id,
  });

  const template = getTemplate(demanda.template_id);
  
  // Calcular cor da borda baseado no prazo
  const corBorda = getCorBordaPrazo(
    demanda.data_criacao,
    demanda.data_finalizacao,
    demanda.tempo_esperado,
    demanda.status
  );
  
  const classeBorda = {
    verde: 'border-l-4 border-l-green-500',
    amarelo: 'border-l-4 border-l-yellow-500',
    vermelho: 'border-l-4 border-l-red-500',
  }[corBorda];

  // Calcular usuários com tarefas abertas
  const usuariosComTarefas = demanda.tarefas_status
    .filter((t) => !t.concluida) // Apenas tarefas não concluídas
    .reduce((acc, tarefa) => {
      // Determina o responsável da tarefa (específico ou padrão da demanda)
      const responsavelId = tarefa.responsavel_id || demanda.responsavel_id;
      
      // Incrementa o contador de tarefas deste usuário
      acc[responsavelId] = (acc[responsavelId] || 0) + 1;
      
      return acc;
    }, {} as Record<string, number>);

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
        "p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all touch-manipulation",
        classeBorda,
        isDragging && "opacity-50 rotate-3"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <h4 className="font-semibold text-foreground flex-1 text-sm sm:text-base line-clamp-2">
          {demanda.nome_demanda}
        </h4>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Demanda</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir a demanda "{demanda.nome_demanda}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div 
            {...listeners} 
            {...attributes} 
            className="cursor-grab active:cursor-grabbing p-1.5 sm:p-0 touch-manipulation"
          >
            <GripVertical className="w-5 h-5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {Object.entries(usuariosComTarefas).map(([usuarioId, count]) => {
          const usuario = getUsuario(usuarioId);
          if (!usuario) return null;
          
          return (
            <div key={usuarioId} className="flex items-center gap-1 text-xs bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
              <User className="w-3 h-3" />
              <span className="font-medium truncate max-w-[80px] sm:max-w-none">{getPrimeiroNome(usuario.nome)}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          );
        })}
        {Object.keys(usuariosComTarefas).length === 0 && (
          <div className="text-xs text-muted-foreground">Todas as tarefas concluídas</div>
        )}
      </div>

      {/* Datas de criação e finalização */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5 sm:mt-2">
        <Calendar className="w-3 h-3 shrink-0" />
        <span className="truncate">{formatarData(demanda.data_criacao)}</span>
        {demanda.data_finalizacao && (
          <>
            <span>-</span>
            <span className="truncate">{formatarData(demanda.data_finalizacao)}</span>
          </>
        )}
      </div>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export const DemandaCard = memo(DemandaCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.demanda.id === nextProps.demanda.id &&
    prevProps.demanda.status === nextProps.demanda.status &&
    prevProps.demanda.nome_demanda === nextProps.demanda.nome_demanda &&
    prevProps.demanda.prioridade === nextProps.demanda.prioridade &&
    prevProps.demanda.responsavel_id === nextProps.demanda.responsavel_id &&
    prevProps.demanda.data_criacao === nextProps.demanda.data_criacao &&
    prevProps.demanda.data_finalizacao === nextProps.demanda.data_finalizacao &&
    prevProps.demanda.prazo === nextProps.demanda.prazo &&
    prevProps.isDragging === nextProps.isDragging
  );
});
