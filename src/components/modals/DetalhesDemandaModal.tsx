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

    // Atualizar status da demanda baseado nas tarefas
    if (demanda) {
      const todasConcluidas = novoStatus.every((t) => t.concluida);
      const algumaConcluida = novoStatus.some((t) => t.concluida);

      let novoStatusDemanda: "Criada" | "Em Andamento" | "Finalizada" = demanda.status;
      
      if (todasConcluidas) {
        novoStatusDemanda = "Finalizada";
      } else if (algumaConcluida) {
        novoStatusDemanda = "Em Andamento";
      }

      if (novoStatusDemanda !== demanda.status) {
        updateDemanda(demanda.id, { status: novoStatusDemanda, tarefas_status: novoStatus });
      } else {
        updateDemanda(demanda.id, { tarefas_status: novoStatus });
      }
    }
  };

  const handleSalvar = () => {
    if (!demanda) return;

    updateDemanda(demanda.id, {
      responsavel_id: responsavelId,
      campos_preenchidos: Object.entries(camposValores).map(([id_campo, valor]) => ({
        id_campo,
        valor,
      })),
      tarefas_status: tarefasStatus,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{demanda.nome_demanda}</span>
            <Badge variant="secondary">{demanda.prioridade}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
            <Label className="text-base">Campos de Preenchimento</Label>
            {template.campos_preenchimento.map((campo) => {
              const value = camposValores[campo.id_campo] || "";
              
              return (
                <div key={campo.id_campo} className="space-y-2">
                  <Label>{campo.nome_campo}</Label>
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
              <Label className="text-base">Tarefas</Label>
              <span className="text-sm text-muted-foreground">
                {tarefasStatus.filter((t) => t.concluida).length}/{tarefasStatus.length}
              </span>
            </div>
            <div className="space-y-3">
              {getTarefasVisiveis().map((tarefa) => {
                const status = tarefasStatus.find((t) => t.id_tarefa === tarefa.id_tarefa);
                const tarefaPai = tarefa.link_pai
                  ? template.tarefas.find((t) => t.id_tarefa === tarefa.link_pai)
                  : null;

                return (
                  <div
                    key={tarefa.id_tarefa}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <Checkbox
                      checked={status?.concluida || false}
                      onCheckedChange={(checked) =>
                        handleTarefaToggle(tarefa.id_tarefa, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{tarefa.nome_tarefa}</p>
                      {tarefaPai && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Depende de: {tarefaPai.nome_tarefa}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleSalvar}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
