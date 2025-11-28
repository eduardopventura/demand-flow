import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Demanda, TarefaStatus } from "@/contexts/DataContext";
import { calcularDiferencaDias } from "@/utils/prazoUtils";

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
    }
  }, [demanda]);

  const handleTarefaToggle = (tarefaId: string, concluida: boolean) => {
    const novoStatus = tarefasStatus.map((t) =>
      t.id_tarefa === tarefaId ? { ...t, concluida } : t
    );
    setTarefasStatus(novoStatus);
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
        // Calcula se está dentro do prazo
        const diasUtilizados = calcularDiferencaDias(demanda.data_criacao, dataFinalizacao);
        prazo = diasUtilizados <= demanda.tempo_esperado;
      }
    } else if (algumaConcluida) {
      novoStatusDemanda = "Em Andamento";
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

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
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
    </Dialog>
  );
};
