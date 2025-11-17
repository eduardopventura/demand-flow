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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Template, CampoPreenchimento, Tarefa } from "@/contexts/DataContext";

interface EditorTemplateModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditorTemplateModal = ({ template, open, onOpenChange }: EditorTemplateModalProps) => {
  const { addTemplate, updateTemplate } = useData();
  const [nome, setNome] = useState("");
  const [prioridade, setPrioridade] = useState<"Baixa" | "Média" | "Alta">("Média");
  const [campos, setCampos] = useState<CampoPreenchimento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setPrioridade(template.prioridade);
      setCampos([...template.campos_preenchimento]);
      setTarefas([...template.tarefas]);
    } else {
      setNome("");
      setPrioridade("Média");
      setCampos([]);
      setTarefas([]);
    }
  }, [template, open]);

  const handleAddCampo = () => {
    setCampos([
      ...campos,
      {
        id_campo: `c${Date.now()}`,
        nome_campo: "",
        obrigatorio_criacao: false,
      },
    ]);
  };

  const handleRemoveCampo = (id: string) => {
    setCampos(campos.filter((c) => c.id_campo !== id));
  };

  const handleUpdateCampo = (id: string, updates: Partial<CampoPreenchimento>) => {
    setCampos(campos.map((c) => (c.id_campo === id ? { ...c, ...updates } : c)));
  };

  const handleAddTarefa = () => {
    setTarefas([
      ...tarefas,
      {
        id_tarefa: `ta${Date.now()}`,
        nome_tarefa: "",
        link_pai: null,
      },
    ]);
  };

  const handleRemoveTarefa = (id: string) => {
    setTarefas(tarefas.filter((t) => t.id_tarefa !== id));
  };

  const handleUpdateTarefa = (id: string, updates: Partial<Tarefa>) => {
    setTarefas(tarefas.map((t) => (t.id_tarefa === id ? { ...t, ...updates } : t)));
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    const camposInvalidos = campos.filter((c) => !c.nome_campo.trim());
    if (camposInvalidos.length > 0) {
      toast.error("Preencha o nome de todos os campos");
      return;
    }

    const tarefasInvalidas = tarefas.filter((t) => !t.nome_tarefa.trim());
    if (tarefasInvalidas.length > 0) {
      toast.error("Preencha o nome de todas as tarefas");
      return;
    }

    const templateData = {
      nome,
      prioridade,
      campos_preenchimento: campos,
      tarefas,
    };

    if (template) {
      updateTemplate(template.id, templateData);
      toast.success("Template atualizado com sucesso!");
    } else {
      addTemplate(templateData);
      toast.success("Template criado com sucesso!");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Template *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cadastro de Novo Aluno"
              />
            </div>

            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Campos de Preenchimento</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddCampo}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Campo
              </Button>
            </div>

            {campos.map((campo) => (
              <Card key={campo.id_campo} className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Nome do campo"
                      value={campo.nome_campo}
                      onChange={(e) =>
                        handleUpdateCampo(campo.id_campo, { nome_campo: e.target.value })
                      }
                    />
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`obrig-${campo.id_campo}`}
                        checked={campo.obrigatorio_criacao}
                        onCheckedChange={(checked) =>
                          handleUpdateCampo(campo.id_campo, {
                            obrigatorio_criacao: checked as boolean,
                          })
                        }
                      />
                      <label
                        htmlFor={`obrig-${campo.id_campo}`}
                        className="text-sm cursor-pointer"
                      >
                        Obrigatório na criação
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCampo(campo.id_campo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base">Tarefas</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddTarefa}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Tarefa
              </Button>
            </div>

            {tarefas.map((tarefa) => (
              <Card key={tarefa.id_tarefa} className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Nome da tarefa"
                      value={tarefa.nome_tarefa}
                      onChange={(e) =>
                        handleUpdateTarefa(tarefa.id_tarefa, { nome_tarefa: e.target.value })
                      }
                    />
                    <Select
                      value={tarefa.link_pai || "none"}
                      onValueChange={(v) =>
                        handleUpdateTarefa(tarefa.id_tarefa, {
                          link_pai: v === "none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Depende de (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {tarefas
                          .filter((t) => t.id_tarefa !== tarefa.id_tarefa)
                          .map((t) => (
                            <SelectItem key={t.id_tarefa} value={t.id_tarefa}>
                              {t.nome_tarefa || "Tarefa sem nome"}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTarefa(tarefa.id_tarefa)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{template ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
