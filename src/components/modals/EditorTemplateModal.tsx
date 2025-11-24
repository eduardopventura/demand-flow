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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Template, CampoPreenchimento, Tarefa } from "@/contexts/DataContext";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EditorTemplateModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button
        className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {children}
    </div>
  );
};

export const EditorTemplateModal = ({
  template,
  open,
  onOpenChange,
}: EditorTemplateModalProps) => {
  const { addTemplate, updateTemplate, usuarios } = useData();
  const [nome, setNome] = useState("");
  const [prioridade, setPrioridade] = useState<"Baixa" | "Média" | "Alta">("Média");
  const [campos, setCampos] = useState<CampoPreenchimento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setPrioridade(template.prioridade);
      setCampos(template.campos_preenchimento);
      setTarefas(template.tarefas);
    } else {
      setNome("");
      setPrioridade("Média");
      setCampos([]);
      setTarefas([]);
    }
  }, [template, open]);

  const handleAddCampo = () => {
    const novoCampo: CampoPreenchimento = {
      id_campo: `c${Date.now()}`,
      nome_campo: "",
      tipo_campo: "texto",
      obrigatorio_criacao: false,
      complementa_nome: false,
    };
    setCampos([...campos, novoCampo]);
  };

  const handleRemoveCampo = (idCampo: string) => {
    setCampos(campos.filter((c) => c.id_campo !== idCampo));
  };

  const handleUpdateCampo = (
    idCampo: string,
    updates: Partial<CampoPreenchimento>
  ) => {
    setCampos(
      campos.map((c) => {
        if (c.id_campo === idCampo) {
          // Se marcando complementa_nome, desmarcar outros
          if (updates.complementa_nome === true) {
            setCampos((prev) =>
              prev.map((campo) =>
                campo.id_campo === idCampo
                  ? { ...campo, ...updates }
                  : { ...campo, complementa_nome: false }
              )
            );
            return { ...c, ...updates };
          }
          return { ...c, ...updates };
        }
        return c;
      })
    );
  };

  const handleAddTarefa = () => {
    const novaTarefa: Tarefa = {
      id_tarefa: `ta${Date.now()}`,
      nome_tarefa: "",
      link_pai: null,
    };
    setTarefas([...tarefas, novaTarefa]);
  };

  const handleRemoveTarefa = (idTarefa: string) => {
    setTarefas(tarefas.filter((t) => t.id_tarefa !== idTarefa));
  };

  const handleUpdateTarefa = (idTarefa: string, updates: Partial<Tarefa>) => {
    setTarefas(tarefas.map((t) => (t.id_tarefa === idTarefa ? { ...t, ...updates } : t)));
  };

  const handleDragEndCampos = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCampos((items) => {
        const oldIndex = items.findIndex((item) => item.id_campo === active.id);
        const newIndex = items.findIndex((item) => item.id_campo === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndTarefas = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTarefas((items) => {
        const oldIndex = items.findIndex((item) => item.id_tarefa === active.id);
        const newIndex = items.findIndex((item) => item.id_tarefa === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("O nome do template é obrigatório");
      return;
    }

    const camposInvalidos = campos.filter((c) => !c.nome_campo.trim());
    if (camposInvalidos.length > 0) {
      toast.error("Todos os campos devem ter um nome");
      return;
    }

    const tarefasInvalidas = tarefas.filter((t) => !t.nome_tarefa.trim());
    if (tarefasInvalidas.length > 0) {
      toast.error("Todas as tarefas devem ter um nome");
      return;
    }

    // Verificar se campos dropdown têm opções
    const dropdownsSemOpcoes = campos.filter(
      (c) => c.tipo_campo === "dropdown" && (!c.opcoes_dropdown || c.opcoes_dropdown.length === 0)
    );
    if (dropdownsSemOpcoes.length > 0) {
      toast.error("Campos dropdown devem ter pelo menos uma opção");
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
          <div className="space-y-2">
            <Label>Nome do Template *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cadastro de Novo Aluno"
            />
          </div>

          <div className="space-y-2">
            <Label>Prioridade *</Label>
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

          <div className="space-y-3">
            <Label className="text-base">Campos de Preenchimento</Label>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndCampos}
            >
              <SortableContext
                items={campos.map((c) => c.id_campo)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {campos.map((campo) => (
                    <SortableItem key={campo.id_campo} id={campo.id_campo}>
                      <div className="flex-1 p-4 border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome do Campo</Label>
                            <Input
                              value={campo.nome_campo}
                              onChange={(e) =>
                                handleUpdateCampo(campo.id_campo, {
                                  nome_campo: e.target.value,
                                })
                              }
                              placeholder="Ex: Nome do Aluno"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo</Label>
                            <Select
                              value={campo.tipo_campo}
                              onValueChange={(v: any) =>
                                handleUpdateCampo(campo.id_campo, { tipo_campo: v })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="texto">Texto</SelectItem>
                                <SelectItem value="numero">Número</SelectItem>
                                <SelectItem value="data">Data</SelectItem>
                                <SelectItem value="arquivo">Arquivo</SelectItem>
                                <SelectItem value="dropdown">Lista Dropdown</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {campo.tipo_campo === "dropdown" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Opções da lista</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const atuais = campo.opcoes_dropdown || [];
                                  handleUpdateCampo(campo.id_campo, {
                                    opcoes_dropdown: [...atuais, ""],
                                  });
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Adicionar opção
                              </Button>
                            </div>

                            {(campo.opcoes_dropdown && campo.opcoes_dropdown.length > 0 ? campo.opcoes_dropdown : [""]).map(
                              (opcao, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    className="flex-1"
                                    placeholder={`Opção ${index + 1}`}
                                    value={opcao}
                                    onChange={(e) => {
                                      const novas = [...(campo.opcoes_dropdown || [])];
                                      novas[index] = e.target.value;
                                      // Remove vazias no final
                                      const filtradas = novas.filter((o, i) => o.trim() !== "" || i < novas.length - 1);
                                      handleUpdateCampo(campo.id_campo, {
                                        opcoes_dropdown: filtradas,
                                      });
                                    }}
                                  />
                                  {((campo.opcoes_dropdown && campo.opcoes_dropdown.length > 1) || index > 0) && (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        const atuais = campo.opcoes_dropdown || [];
                                        const novas = atuais.filter((_, i) => i !== index);
                                        handleUpdateCampo(campo.id_campo, {
                                          opcoes_dropdown: novas,
                                        });
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}


                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`obr-${campo.id_campo}`}
                              checked={campo.obrigatorio_criacao}
                              onCheckedChange={(checked) =>
                                handleUpdateCampo(campo.id_campo, {
                                  obrigatorio_criacao: !!checked,
                                })
                              }
                            />
                            <Label
                              htmlFor={`obr-${campo.id_campo}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              Obrigatório
                            </Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`comp-${campo.id_campo}`}
                              checked={campo.complementa_nome}
                              onCheckedChange={(checked) =>
                                handleUpdateCampo(campo.id_campo, {
                                  complementa_nome: !!checked,
                                })
                              }
                            />
                            <Label
                              htmlFor={`comp-${campo.id_campo}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              Complementa nome
                            </Label>
                          </div>

                          <Button
                            onClick={() => handleRemoveCampo(campo.id_campo)}
                            size="sm"
                            variant="ghost"
                            className="ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {campos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum campo adicionado
              </p>
            )}

            <Button onClick={handleAddCampo} size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Campo
            </Button>
          </div>

          <div className="space-y-3">
            <Label className="text-base">Tarefas</Label>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndTarefas}
            >
              <SortableContext
                items={tarefas.map((t) => t.id_tarefa)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {tarefas.map((tarefa) => (
                    <SortableItem key={tarefa.id_tarefa} id={tarefa.id_tarefa}>
                      <div className="flex-1 p-4 border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome da Tarefa</Label>
                            <Input
                              value={tarefa.nome_tarefa}
                              onChange={(e) =>
                                handleUpdateTarefa(tarefa.id_tarefa, {
                                  nome_tarefa: e.target.value,
                                })
                              }
                              placeholder="Ex: Criar documento"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tarefa Pai (Dependência)</Label>
                            <Select
                              value={tarefa.link_pai || "none"}
                              onValueChange={(v) =>
                                handleUpdateTarefa(tarefa.id_tarefa, {
                                  link_pai: v === "none" ? null : v,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Nenhuma" />
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
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Responsável Específico (Opcional)</Label>
                          <Select
                            value={tarefa.responsavel_id || "none"}
                            onValueChange={(v) =>
                              handleUpdateTarefa(tarefa.id_tarefa, {
                                responsavel_id: v === "none" ? undefined : v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Padrão (responsável da demanda)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Padrão (responsável da demanda)</SelectItem>
                              {usuarios.map((usuario) => (
                                <SelectItem key={usuario.id} value={usuario.id}>
                                  {usuario.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => handleRemoveTarefa(tarefa.id_tarefa)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {tarefas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tarefa adicionada
              </p>
            )}

            <Button onClick={handleAddTarefa} size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Tarefa
            </Button>
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
