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
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil } from "lucide-react";
import type { Template, CampoPreenchimento, Tarefa, AbaTemplate, CondicaoVisibilidade } from "@/types";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface EditorTemplateModalProps {
  template: Template | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ABA_GERAL_ID = "geral";

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
  const [tempoMedio, setTempoMedio] = useState<number>(7);
  const [abas, setAbas] = useState<AbaTemplate[]>([{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }]);
  const [campos, setCampos] = useState<CampoPreenchimento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaAbaNome, setNovaAbaNome] = useState("");
  const [editandoAba, setEditandoAba] = useState<string | null>(null);
  const [nomeAbaEditando, setNomeAbaEditando] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setTempoMedio(template.tempo_medio || 7);
      setAbas(template.abas?.length > 0 ? template.abas : [{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }]);
      setCampos(template.campos_preenchimento.map(c => ({
        ...c,
        abas_ids: c.abas_ids || [ABA_GERAL_ID],
      })));
      setTarefas(template.tarefas);
    } else {
      setNome("");
      setTempoMedio(7);
      setAbas([{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }]);
      setCampos([]);
      setTarefas([]);
    }
  }, [template, open]);

  // Gerenciamento de Abas
  const handleAddAba = () => {
    if (!novaAbaNome.trim()) {
      toast.error("Nome da aba é obrigatório");
      return;
    }
    const novaAba: AbaTemplate = {
      id: `aba_${Date.now()}`,
      nome: novaAbaNome.trim(),
      ordem: abas.length,
    };
    setAbas([...abas, novaAba]);
    setNovaAbaNome("");
    toast.success("Aba adicionada");
  };

  const handleRemoveAba = (abaId: string) => {
    if (abaId === ABA_GERAL_ID) {
      toast.error("A aba 'Geral' não pode ser removida");
      return;
    }
    // Remover aba da lista de abas dos campos
    // Se campo ficar sem aba, adiciona automaticamente a aba "Geral"
    setCampos(campos.map(c => {
      const novasAbas = c.abas_ids.filter(id => id !== abaId);
      return {
        ...c,
        abas_ids: novasAbas.length === 0 ? [ABA_GERAL_ID] : novasAbas,
      };
    }));
    setAbas(abas.filter(a => a.id !== abaId));
    toast.success("Aba removida");
  };

  const handleRenameAba = (abaId: string) => {
    if (!nomeAbaEditando.trim()) {
      toast.error("Nome da aba é obrigatório");
      return;
    }
    setAbas(abas.map(a => a.id === abaId ? { ...a, nome: nomeAbaEditando.trim() } : a));
    setEditandoAba(null);
    setNomeAbaEditando("");
  };

  const handleAddCampo = () => {
    const novoCampo: CampoPreenchimento = {
      id_campo: `c${Date.now()}`,
      nome_campo: "",
      tipo_campo: "texto",
      obrigatorio_criacao: false,
      complementa_nome: false,
      abas_ids: [ABA_GERAL_ID], // Padrão: aba Geral
    };
    setCampos([...campos, novoCampo]);
  };

  const handleRemoveCampo = (idCampo: string) => {
    // Também remover condições que dependem deste campo
    setCampos(campos.filter((c) => c.id_campo !== idCampo).map(c => ({
      ...c,
      condicao_visibilidade: c.condicao_visibilidade?.campo_id === idCampo ? undefined : c.condicao_visibilidade,
    })));
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

  const handleToggleAbaInCampo = (idCampo: string, abaId: string) => {
    setCampos(campos.map(c => {
      if (c.id_campo !== idCampo) return c;
      
      const abasAtuais = c.abas_ids || [];
      if (abaId === "todas") {
        // Se selecionou "Todas", adiciona todas as abas
        return { ...c, abas_ids: abas.map(a => a.id) };
      }
      
      if (abasAtuais.includes(abaId)) {
        // Remover aba - se ficar vazio, adiciona automaticamente a aba "Geral"
        const novas = abasAtuais.filter(id => id !== abaId);
        if (novas.length === 0) {
          return { ...c, abas_ids: [ABA_GERAL_ID] };
        }
        return { ...c, abas_ids: novas };
      } else {
        // Adicionar aba
        return { ...c, abas_ids: [...abasAtuais, abaId] };
      }
    }));
  };

  // Condições de Visibilidade
  const handleSetCondicao = (idCampo: string, condicao: CondicaoVisibilidade | undefined) => {
    setCampos(campos.map(c => c.id_campo === idCampo ? { ...c, condicao_visibilidade: condicao } : c));
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

    if (!tempoMedio || tempoMedio < 1) {
      toast.error("O tempo médio deve ser de pelo menos 1 dia");
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

    // Garantir que todos os campos tenham pelo menos uma aba (padrão: Geral)
    const camposComAbas = campos.map(c => ({
      ...c,
      abas_ids: (!c.abas_ids || c.abas_ids.length === 0) ? [ABA_GERAL_ID] : c.abas_ids,
    }));

    const templateData = {
      nome,
      tempo_medio: tempoMedio,
      abas,
      campos_preenchimento: camposComAbas,
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

  // Obter opções para condição baseado no campo pai
  const getOpcoesCondicao = (campoPaiId: string): string[] => {
    const campoPai = campos.find(c => c.id_campo === campoPaiId);
    if (!campoPai) return [];
    
    if (campoPai.tipo_campo === "dropdown") {
      return campoPai.opcoes_dropdown || [];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <div className="space-y-2">
            <Label className="text-sm">Nome do Template *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Cadastro de Novo Aluno"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Tempo Médio (dias) *</Label>
            <Input
              type="number"
              min={1}
              value={tempoMedio}
              onChange={(e) => setTempoMedio(parseInt(e.target.value) || 1)}
              placeholder="Ex: 7"
            />
            <p className="text-xs text-muted-foreground">
              Número de dias esperado para conclusão de demandas deste template
            </p>
          </div>

          {/* Seção de Gerenciamento de Abas */}
          <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
            <Label className="text-sm sm:text-base font-semibold">Gerenciar Abas</Label>
            <p className="text-xs text-muted-foreground">
              Organize os campos em abas para melhor visualização. A aba "Geral" é padrão e não pode ser removida.
            </p>
            
            <div className="flex flex-wrap gap-2">
              {abas.map((aba) => (
                <div key={aba.id} className="flex items-center gap-1">
                  {editandoAba === aba.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={nomeAbaEditando}
                        onChange={(e) => setNomeAbaEditando(e.target.value)}
                        className="h-8 w-24"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameAba(aba.id);
                          if (e.key === "Escape") setEditandoAba(null);
                        }}
                      />
                      <Button size="sm" variant="ghost" onClick={() => handleRenameAba(aba.id)}>
                        OK
                      </Button>
                    </div>
                  ) : (
                    <Badge variant={aba.id === ABA_GERAL_ID ? "default" : "secondary"} className="gap-1">
                      {aba.nome}
                      <button
                        onClick={() => {
                          setEditandoAba(aba.id);
                          setNomeAbaEditando(aba.nome);
                        }}
                        className="ml-1 hover:bg-background/20 rounded p-0.5"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {aba.id !== ABA_GERAL_ID && (
                        <button
                          onClick={() => handleRemoveAba(aba.id)}
                          className="ml-0.5 hover:bg-destructive/20 rounded p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={novaAbaNome}
                onChange={(e) => setNovaAbaNome(e.target.value)}
                placeholder="Nome da nova aba"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAba();
                }}
              />
              <Button size="sm" variant="outline" onClick={handleAddAba}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm sm:text-base">Campos de Preenchimento</Label>

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
                      <div className="flex-1 p-3 sm:p-4 border rounded-lg space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <Label className="text-xs">Opções da lista</Label>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full sm:w-auto"
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
                                      className="shrink-0"
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

                        {/* Seleção de Abas para o Campo */}
                        <div className="space-y-2">
                          <Label className="text-xs">Abas onde este campo aparece</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={campo.abas_ids?.length === abas.length ? "default" : "outline"}
                              className="h-7 text-xs"
                              onClick={() => handleToggleAbaInCampo(campo.id_campo, "todas")}
                            >
                              Todas
                            </Button>
                            {abas.map((aba) => (
                              <Button
                                key={aba.id}
                                type="button"
                                size="sm"
                                variant={campo.abas_ids?.includes(aba.id) ? "default" : "outline"}
                                className="h-7 text-xs"
                                onClick={() => handleToggleAbaInCampo(campo.id_campo, aba.id)}
                              >
                                {aba.nome}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Condição de Visibilidade */}
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-2 h-7 text-xs">
                              {campo.condicao_visibilidade ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Condição ativa
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" />
                                  Adicionar condição de visibilidade
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2 space-y-2">
                            <div className="p-2 border rounded bg-muted/30 space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Campo pai</Label>
                                  <Select
                                    value={campo.condicao_visibilidade?.campo_id || "none"}
                                    onValueChange={(v) => {
                                      if (v === "none") {
                                        handleSetCondicao(campo.id_campo, undefined);
                                      } else {
                                        handleSetCondicao(campo.id_campo, {
                                          campo_id: v,
                                          operador: "igual",
                                          valor: "",
                                        });
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sem condição</SelectItem>
                                      {campos
                                        .filter((c) => c.id_campo !== campo.id_campo)
                                        .map((c) => (
                                          <SelectItem key={c.id_campo} value={c.id_campo}>
                                            {c.nome_campo || "Sem nome"}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {campo.condicao_visibilidade && (
                                  <>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Operador</Label>
                                      <Select
                                        value={campo.condicao_visibilidade.operador}
                                        onValueChange={(v: CondicaoVisibilidade["operador"]) =>
                                          handleSetCondicao(campo.id_campo, {
                                            ...campo.condicao_visibilidade!,
                                            operador: v,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="igual">Igual a</SelectItem>
                                          <SelectItem value="diferente">Diferente de</SelectItem>
                                          <SelectItem value="preenchido">Preenchido</SelectItem>
                                          <SelectItem value="vazio">Vazio</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {(campo.condicao_visibilidade.operador === "igual" ||
                                      campo.condicao_visibilidade.operador === "diferente") && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">Valor</Label>
                                        {getOpcoesCondicao(campo.condicao_visibilidade.campo_id).length > 0 ? (
                                          <Select
                                            value={campo.condicao_visibilidade.valor || ""}
                                            onValueChange={(v) =>
                                              handleSetCondicao(campo.id_campo, {
                                                ...campo.condicao_visibilidade!,
                                                valor: v,
                                              })
                                            }
                                          >
                                            <SelectTrigger className="h-8">
                                              <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {getOpcoesCondicao(campo.condicao_visibilidade.campo_id).map((op) => (
                                                <SelectItem key={op} value={op}>
                                                  {op}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        ) : (
                                          <Input
                                            className="h-8"
                                            value={campo.condicao_visibilidade.valor || ""}
                                            onChange={(e) =>
                                              handleSetCondicao(campo.id_campo, {
                                                ...campo.condicao_visibilidade!,
                                                valor: e.target.value,
                                              })
                                            }
                                            placeholder="Valor esperado"
                                          />
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              {campo.condicao_visibilidade && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs text-destructive"
                                  onClick={() => handleSetCondicao(campo.id_campo, undefined)}
                                >
                                  Remover condição
                                </Button>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`obr-${campo.id_campo}`}
                              checked={campo.obrigatorio_criacao}
                              onCheckedChange={(checked) =>
                                handleUpdateCampo(campo.id_campo, {
                                  obrigatorio_criacao: !!checked,
                                })
                              }
                              className="h-5 w-5 sm:h-4 sm:w-4"
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
                              className="h-5 w-5 sm:h-4 sm:w-4"
                            />
                            <Label
                              htmlFor={`comp-${campo.id_campo}`}
                              className="text-xs font-normal cursor-pointer whitespace-nowrap"
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
            <Label className="text-sm sm:text-base">Tarefas</Label>

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
                      <div className="flex-1 p-3 sm:p-4 border rounded-lg space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">{template ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
