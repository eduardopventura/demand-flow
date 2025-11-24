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
        "p-4 cursor-pointer hover:shadow-md transition-all",
        classeBorda,
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

      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(usuariosComTarefas).map(([usuarioId, count]) => {
          const usuario = getUsuario(usuarioId);
          if (!usuario) return null;
          
          return (
            <div key={usuarioId} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
              <User className="w-3 h-3" />
              <span className="font-medium">{getPrimeiroNome(usuario.nome)}</span>
              <span className="text-muted-foreground">({count})</span>
            </div>
          );
        })}
        {Object.keys(usuariosComTarefas).length === 0 && (
          <div className="text-xs text-muted-foreground">Todas as tarefas concluídas</div>
        )}
      </div>

      {/* Datas de criação e finalização */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
        <Calendar className="w-3 h-3" />
        <span>{formatarData(demanda.data_criacao)}</span>
        {demanda.data_finalizacao && (
          <>
            <span>-</span>
            <span>{formatarData(demanda.data_finalizacao)}</span>
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
