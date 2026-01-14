import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { User, GripVertical, Trash2, Calendar as CalendarIcon, Tag } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Demanda } from "@/types";
import { hasPermission } from "@/utils/permissions";
import { cn } from "@/lib/utils";
import { getCorBordaPrazo, formatarData, getPrimeiroNome } from "@/utils/prazoUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { memo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePicker } from "@/components/ui/date-picker";

interface DemandaCardProps {
  demanda: Demanda;
  onClick?: () => void;
  isDragging?: boolean;
}

const DemandaCardComponent = ({ demanda, onClick, isDragging }: DemandaCardProps) => {
  const { getUsuario, getCargo, deleteDemanda, getTemplate, updateDemanda } = useData();
  const { user } = useAuth();
  const canDeleteDemanda = hasPermission(user, "deletar_demandas");
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: demanda.id,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const template = getTemplate(demanda.template_id);
  
  // Calcular cor da borda baseado no prazo
  const corBorda = getCorBordaPrazo(
    demanda.data_previsao,
    demanda.data_finalizacao
  );
  
  const classeBorda = {
    verde: 'border-l-4 border-l-green-500',
    amarelo: 'border-l-4 border-l-yellow-500',
    vermelho: 'border-l-4 border-l-red-500',
  }[corBorda];

  const handleDateChange = (date: Date | null) => {
    if (date) {
      updateDemanda(demanda.id, {
        data_previsao: date.toISOString(),
      });
      setIsCalendarOpen(false);
    }
  };

  // Coletar responsáveis com tarefas visíveis (em aberto E sem dependências bloqueadoras)
  const responsaveisVisiveis = new Set<string>();
  
  if (template && template.tarefas) {
    demanda.tarefas_status.forEach((tarefaStatus) => {
      // Ignorar tarefas concluídas
      if (tarefaStatus.concluida) return;
      
      // Buscar definição da tarefa no template para verificar dependências
      const tarefaTemplate = template.tarefas.find(t => t.id_tarefa === tarefaStatus.id_tarefa);
      if (!tarefaTemplate) return;
      
      // Verificar se a tarefa está disponível (sem dependência ou dependência concluída)
      if (tarefaTemplate.link_pai) {
        const tarefaPai = demanda.tarefas_status.find(t => t.id_tarefa === tarefaTemplate.link_pai);
        if (!tarefaPai?.concluida) return; // Dependência não concluída, tarefa bloqueada
      }
      
      // Tarefa está visível, adicionar responsável
      let responsavelId = tarefaStatus.cargo_responsavel_id || tarefaStatus.responsavel_id;
      
      if (!responsavelId && demanda.responsavel_id) {
        responsavelId = demanda.responsavel_id;
      }
      
      if (responsavelId) {
        responsaveisVisiveis.add(responsavelId);
      }
    });
  }

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
          {canDeleteDemanda && (
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
                </AlertDialogHeader>
                <div className="px-6 py-4">
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja excluir a demanda "{demanda.nome_demanda}"? Esta ação não pode ser desfeita.
                  </p>
                </div>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
        {responsaveisVisiveis.size > 0 ? (
          Array.from(responsaveisVisiveis).map((responsavelId) => {
            const cargo = getCargo(responsavelId);
            // Verificar se é um cargo
            if (cargo) {
              return (
                <div key={responsavelId} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                  <Tag className="w-3 h-3" />
                  <span className="font-medium truncate max-w-[80px] sm:max-w-none">{cargo.nome}</span>
                </div>
              );
            }
            
            // É um usuário
            const usuario = getUsuario(responsavelId);
            if (!usuario) {
              return null;
            }
            
            return (
              <div key={responsavelId} className="flex items-center gap-1 text-xs bg-muted px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                <User className="w-3 h-3" />
                <span className="font-medium truncate max-w-[80px] sm:max-w-none">{getPrimeiroNome(usuario.nome)}</span>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground">Todas as tarefas concluídas</div>
        )}
      </div>

      {/* Datas de criação e previsão */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 sm:mt-2">
        <CalendarIcon className="w-3 h-3 shrink-0" />
        <span className="truncate">Criação: {formatarData(demanda.data_criacao)}</span>
        <span className="mx-0.5">|</span>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <button
              className="text-xs underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsCalendarOpen(true);
              }}
            >
              Previsão: {formatarData(demanda.data_previsao)}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
            <DatePicker
              selected={new Date(demanda.data_previsao)}
              onChange={handleDateChange}
              inline
            />
          </PopoverContent>
        </Popover>
        {demanda.data_finalizacao && (
          <>
            <span className="mx-0.5">|</span>
            <span className="truncate text-green-600">Concluída: {formatarData(demanda.data_finalizacao)}</span>
          </>
        )}
      </div>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export const DemandaCard = memo(DemandaCardComponent, (prevProps, nextProps) => {
  // Importante: se o objeto da demanda mudar (ex.: observações, campos, modificado_por),
  // precisamos re-renderizar o card. A comparação por referência cobre todos os casos
  // sem precisar listar cada campo.
  return prevProps.demanda === nextProps.demanda && prevProps.isDragging === nextProps.isDragging;
});
