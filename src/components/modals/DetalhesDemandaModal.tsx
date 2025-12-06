import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import type { Demanda, TarefaStatus } from "@/contexts/DataContext";
import { formatarData } from "@/utils/prazoUtils";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DetalhesDemandaModalProps {
  demanda: Demanda | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DetalhesDemandaModal = ({ demanda, open, onOpenChange }: DetalhesDemandaModalProps) => {
  const { updateDemanda, getTemplate, usuarios } = useData();
  const [responsavelId, setResponsavelId] = useState("");
  const [camposValores, setCamposValores] = useState<Record<string, string>>({});
  const [tarefasStatus, setTarefasStatus] = useState<TarefaStatus[]>([]);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [pendingTaskToggle, setPendingTaskToggle] = useState<{ tarefaId: string; concluida: boolean } | null>(null);
  const [dataPrevisao, setDataPrevisao] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  const template = demanda ? getTemplate(demanda.template_id) : null;

  useEffect(() => {
    if (demanda) {
      setResponsavelId(demanda.responsavel_id);
      
      const valores: Record<string, string> = {};
      demanda.campos_preenchidos.forEach((campo) => {
        valores[campo.id_campo] = campo.valor;
      });
      setCamposValores(valores);
      
      setTarefasStatus([...demanda.tarefas_status]);
      setDataPrevisao(new Date(demanda.data_previsao));
      setObservacoes(demanda.observacoes || "");
    }
  }, [demanda]);

  const handleTarefaToggle = (tarefaId: string, concluida: boolean) => {
    // Se a demanda está finalizada e está desmarcando uma tarefa, mostrar confirmação
    if (demanda?.status === "Finalizada" && !concluida) {
      setPendingTaskToggle({ tarefaId, concluida });
      setShowReopenConfirm(true);
      return;
    }

    const novoStatus = tarefasStatus.map((t) =>
      t.id_tarefa === tarefaId ? { ...t, concluida } : t
    );
    setTarefasStatus(novoStatus);
  };

  const handleConfirmReopenFromTaskToggle = () => {
    if (pendingTaskToggle) {
      const novoStatus = tarefasStatus.map((t) =>
        t.id_tarefa === pendingTaskToggle.tarefaId ? { ...t, concluida: pendingTaskToggle.concluida } : t
      );
      setTarefasStatus(novoStatus);
    }
    setShowReopenConfirm(false);
    setPendingTaskToggle(null);
  };

  const handleCancelReopenFromTaskToggle = () => {
    setShowReopenConfirm(false);
    setPendingTaskToggle(null);
  };

  const handleSalvar = () => {
    if (!demanda || !template) return;

    // Calcular status da demanda baseado nas tarefas
    const todasConcluidas = tarefasStatus.every((t) => t.concluida);
    const algumaConcluida = tarefasStatus.some((t) => t.concluida);

    let novoStatusDemanda: "Criada" | "Em Andamento" | "Finalizada" = demanda.status;
    let dataFinalizacao = demanda.data_finalizacao;
    let prazo = demanda.prazo;
    
    if (todasConcluidas) {
      novoStatusDemanda = "Finalizada";
      // Define data de finalização se ainda não foi definida
      if (!dataFinalizacao) {
        dataFinalizacao = new Date().toISOString();
        // Calcula se está dentro do prazo baseado na data de previsão
        const finalizacao = new Date(dataFinalizacao);
        const previsao = new Date(demanda.data_previsao);
        prazo = finalizacao <= previsao;
      }
    } else if (algumaConcluida) {
      novoStatusDemanda = "Em Andamento";
      // Se estava finalizada e voltou para andamento, remove data de finalização
      if (demanda.status === "Finalizada") {
        dataFinalizacao = null;
      }
    } else {
      novoStatusDemanda = "Criada";
      // Se voltou para criada, remove data de finalização
      dataFinalizacao = null;
      prazo = true;
    }

    // Verificar se o responsável da demanda mudou
    const responsavelMudou = responsavelId !== demanda.responsavel_id;
    
    // Se o responsável mudou, atualizar tarefas que não tinham responsável específico
    const tarefasAtualizadas = responsavelMudou
      ? tarefasStatus.map((tarefa) => {
          // Se a tarefa não tem responsável específico OU o responsável é o antigo responsável da demanda
          // Atualiza para o novo responsável da demanda (removendo o campo responsavel_id)
          if (!tarefa.responsavel_id || tarefa.responsavel_id === demanda.responsavel_id) {
            const { responsavel_id, ...resto } = tarefa;
            return resto;
          }
          // Senão, mantém o responsável específico
          return tarefa;
        })
      : tarefasStatus;

    updateDemanda(demanda.id, {
      responsavel_id: responsavelId,
      campos_preenchidos: Object.entries(camposValores).map(([id_campo, valor]) => ({
        id_campo,
        valor,
      })),
      tarefas_status: tarefasAtualizadas,
      status: novoStatusDemanda,
      data_finalizacao: dataFinalizacao,
      prazo: prazo,
      data_previsao: dataPrevisao?.toISOString() || demanda.data_previsao,
      observacoes: observacoes,
    });

    toast.success("Demanda atualizada com sucesso!");
    onOpenChange(false);
  };

  const getTarefasVisiveis = () => {
    if (!template) return [];

    return template.tarefas.filter((tarefa) => {
      if (!tarefa.link_pai) return true;
      
      const tarefaPai = tarefasStatus.find((t) => t.id_tarefa === tarefa.link_pai);
      return tarefaPai?.concluida || false;
    });
  };

  if (!demanda || !template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pr-6">
            <span className="text-base sm:text-lg line-clamp-2">{demanda.nome_demanda}</span>
            <Badge variant="secondary" className="w-fit">{demanda.prioridade}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-xs text-muted-foreground">Data de Criação</Label>
              <p className="text-sm font-medium">{formatarData(demanda.data_criacao)}</p>
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs text-muted-foreground">Data de Previsão</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8",
                      !dataPrevisao && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataPrevisao ? formatarData(dataPrevisao.toISOString()) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataPrevisao}
                    onSelect={(date) => {
                      setDataPrevisao(date);
                      setIsCalendarOpen(false);
                    }}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {demanda.data_finalizacao && (
              <div className="space-y-0.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Data de Finalização</Label>
                <p className="text-sm font-medium text-green-600">{formatarData(demanda.data_finalizacao)}</p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Observações</Label>
              <span className={cn(
                "text-xs",
                observacoes.length > 100 ? "text-destructive" : "text-muted-foreground"
              )}>
                {observacoes.length}/100
              </span>
            </div>
            <Textarea
              value={observacoes}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length > 100) {
                  toast.error("Observações deve ter no máximo 100 caracteres");
                  return;
                }
                setObservacoes(value);
              }}
              placeholder="Adicione observações sobre esta demanda..."
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm sm:text-base">Campos de Preenchimento</Label>
            {template.campos_preenchimento.map((campo) => {
              const value = camposValores[campo.id_campo] || "";
              
              return (
                <div key={campo.id_campo} className="space-y-2">
                  <Label className="text-sm">{campo.nome_campo}</Label>
                  {campo.tipo_campo === "numero" ? (
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) =>
                        setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
                      }
                    />
                  ) : campo.tipo_campo === "data" ? (
                    <Input
                      type="date"
                      value={value}
                      onChange={(e) =>
                        setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
                      }
                    />
                  ) : campo.tipo_campo === "arquivo" ? (
                    <div className="space-y-2">
                      <Input type="text" value={value} disabled />
                      <Input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCamposValores({ ...camposValores, [campo.id_campo]: file.name });
                          }
                        }}
                      />
                    </div>
                  ) : campo.tipo_campo === "dropdown" ? (
                    <Select
                      value={value}
                      onValueChange={(v) =>
                        setCamposValores({ ...camposValores, [campo.id_campo]: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {campo.opcoes_dropdown?.map((opcao: string) => (
                          <SelectItem key={opcao} value={opcao}>
                            {opcao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base">Tarefas</Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {tarefasStatus.filter((t) => t.concluida).length}/{tarefasStatus.length}
              </span>
            </div>
            <div className="space-y-3">
              {getTarefasVisiveis().map((tarefa) => {
                const status = tarefasStatus.find((t) => t.id_tarefa === tarefa.id_tarefa);
                const tarefaPai = tarefa.link_pai
                  ? template.tarefas.find((t) => t.id_tarefa === tarefa.link_pai)
                  : null;
                
                // Determina o responsável atual da tarefa
                const responsavelTarefa = status?.responsavel_id || demanda.responsavel_id;

                return (
                  <div
                    key={tarefa.id_tarefa}
                    className="p-2.5 sm:p-3 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Checkbox
                        checked={status?.concluida || false}
                        onCheckedChange={(checked) =>
                          handleTarefaToggle(tarefa.id_tarefa, checked as boolean)
                        }
                        className="mt-1 h-5 w-5 sm:h-4 sm:w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">{tarefa.nome_tarefa}</p>
                        {tarefaPai && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                            Depende de: {tarefaPai.nome_tarefa}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-7 sm:ml-8 space-y-1">
                      <Label className="text-xs">Responsável</Label>
                      <Select
                        value={responsavelTarefa}
                        onValueChange={(v) => {
                          setTarefasStatus(
                            tarefasStatus.map((t) =>
                              t.id_tarefa === tarefa.id_tarefa
                                ? { ...t, responsavel_id: v === demanda.responsavel_id ? undefined : v }
                                : t
                            )
                          );
                        }}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {usuarios.map((usuario) => (
                            <SelectItem key={usuario.id} value={usuario.id}>
                              {usuario.nome}
                              {usuario.id === demanda.responsavel_id && " (Padrão)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
          <Button onClick={handleSalvar} className="w-full sm:w-auto">Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog for reopening a finalized demand */}
      <AlertDialog open={showReopenConfirm} onOpenChange={setShowReopenConfirm}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Demanda</AlertDialogTitle>
            <AlertDialogDescription>
              Esta demanda já foi finalizada. Ao desmarcar esta tarefa, a demanda será reaberta e a data de finalização será removida.
              <br /><br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCancelReopenFromTaskToggle} className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReopenFromTaskToggle} className="w-full sm:w-auto">
              Sim, reabrir demanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
