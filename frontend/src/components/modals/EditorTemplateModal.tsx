import { useState, useEffect, useRef } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil, Zap, Link2, Layers, ChevronDown, ChevronUp } from "lucide-react";
import type { Template, CampoPreenchimento, Tarefa, AbaTemplate, CondicaoVisibilidade, MapeamentoCampos, TipoCampo } from "@/types";
import { Cargo, CargoLabels } from "@/types";
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
import { StickyTabs } from "@/components/StickyTabs";
import { cn } from "@/lib/utils";
import { ordenarCamposPorAba } from "@/utils/campoUtils";

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
        type="button"
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

// Componente para renderizar um campo simples (não grupo)
interface CampoEditorProps {
  campo: CampoPreenchimento;
  campos: CampoPreenchimento[];
  abas: AbaTemplate[];
  onUpdate: (updates: Partial<CampoPreenchimento>) => void;
  onRemove: () => void;
  onToggleAba: (abaId: string) => void;
  onSetCondicao: (condicao: CondicaoVisibilidade | undefined) => void;
  getOpcoesCondicao: (campoPaiId: string) => string[];
  isGrupoChild?: boolean;
}

const CampoEditor = ({
  campo,
  campos,
  abas,
  onUpdate,
  onRemove,
  onToggleAba,
  onSetCondicao,
  getOpcoesCondicao,
  isGrupoChild = false,
}: CampoEditorProps) => {
  return (
    <div className={cn(
      "flex-1 p-3 sm:p-4 border rounded-lg bg-background space-y-3",
      isGrupoChild && "bg-muted/10"
    )}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nome do Campo</Label>
          <Input
            value={campo.nome_campo}
            onChange={(e) => onUpdate({ nome_campo: e.target.value })}
            placeholder="Ex: Nome do Aluno"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select
            value={campo.tipo_campo}
            onValueChange={(v: TipoCampo) => onUpdate({ tipo_campo: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="texto">Texto</SelectItem>
              <SelectItem value="numero">Número</SelectItem>
              <SelectItem value="numero_decimal">Número Decimal</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="arquivo">Arquivo</SelectItem>
              <SelectItem value="dropdown">Lista Dropdown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {campo.tipo_campo === "dropdown" && (
        <div className="space-y-2 p-3 rounded-md border bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-xs">Opções da lista</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                const atuais = campo.opcoes_dropdown || [];
                onUpdate({ opcoes_dropdown: [...atuais, ""] });
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
                    onUpdate({ opcoes_dropdown: filtradas });
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
                      onUpdate({ opcoes_dropdown: novas });
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

      {/* Seleção de Abas - Não mostrar para campos filhos de grupo */}
      {!isGrupoChild && (
        <div className="space-y-2 p-3 rounded-md border bg-muted/20">
          <Label className="text-xs">Abas onde este campo aparece</Label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onToggleAba("todas")}
              className={`h-6 px-2.5 text-xs rounded-full border transition-colors ${
                campo.abas_ids?.length === abas.length
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border"
              }`}
            >
              Todas
            </button>
            {abas.map((aba) => (
              <button
                key={aba.id}
                type="button"
                onClick={() => onToggleAba(aba.id)}
                className={`h-6 px-2.5 text-xs rounded-full border transition-colors ${
                  campo.abas_ids?.includes(aba.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border"
                }`}
              >
                {aba.nome}
              </button>
            ))}
          </div>
        </div>
      )}

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
                      onSetCondicao(undefined);
                    } else {
                      onSetCondicao({
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
                      .filter((c) => {
                        // Para campos dentro de grupo, mostrar apenas campos do mesmo grupo
                        if (isGrupoChild) {
                          return c.id_campo !== campo.id_campo && c.tipo_campo !== "grupo";
                        }
                        // Para campos fora de grupo, mostrar todos exceto grupos e o próprio campo
                        return c.id_campo !== campo.id_campo && c.tipo_campo !== "grupo";
                      })
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
                        onSetCondicao({
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
                      {(() => {
                        // Buscar campo pai nos campos disponíveis (do grupo se isGrupoChild, senão todos)
                        const campoPai = campos.find(c => c.id_campo === campo.condicao_visibilidade?.campo_id);
                        const opcoes = campoPai?.tipo_campo === "dropdown" ? (campoPai.opcoes_dropdown || []) : [];
                        
                        return opcoes.length > 0 ? (
                          <Select
                            value={campo.condicao_visibilidade.valor || ""}
                            onValueChange={(v) =>
                              onSetCondicao({
                                ...campo.condicao_visibilidade!,
                                valor: v,
                              })
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {opcoes.map((op) => (
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
                              onSetCondicao({
                                ...campo.condicao_visibilidade!,
                                valor: e.target.value,
                              })
                            }
                            placeholder="Valor esperado"
                          />
                        );
                      })()}
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
                onClick={() => onSetCondicao(undefined)}
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
            onCheckedChange={(checked) => onUpdate({ obrigatorio_criacao: !!checked })}
            className="h-5 w-5 sm:h-4 sm:w-4"
          />
          <Label
            htmlFor={`obr-${campo.id_campo}`}
            className="text-xs font-normal cursor-pointer"
          >
            Obrigatório
          </Label>
        </div>

        {!isGrupoChild && (
          <div className="flex items-center gap-2">
            <Checkbox
              id={`comp-${campo.id_campo}`}
              checked={campo.complementa_nome}
              onCheckedChange={(checked) => onUpdate({ complementa_nome: !!checked })}
              className="h-5 w-5 sm:h-4 sm:w-4"
            />
            <Label
              htmlFor={`comp-${campo.id_campo}`}
              className="text-xs font-normal cursor-pointer whitespace-nowrap"
            >
              Complementa nome
            </Label>
          </div>
        )}

        <Button
          onClick={onRemove}
          size="sm"
          variant="ghost"
          className="ml-auto"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const EditorTemplateModal = ({
  template,
  open,
  onOpenChange,
}: EditorTemplateModalProps) => {
  const { addTemplate, updateTemplate, usuarios, acoes } = useData();
  const [nome, setNome] = useState("");
  const [tempoMedio, setTempoMedio] = useState<number | null>(7);
  const [abas, setAbas] = useState<AbaTemplate[]>([{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }]);
  const [campos, setCampos] = useState<CampoPreenchimento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaAbaNome, setNovaAbaNome] = useState("");
  const [editandoAba, setEditandoAba] = useState<string | null>(null);
  const [nomeAbaEditando, setNomeAbaEditando] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<string>(ABA_GERAL_ID);
  const [gruposExpandidos, setGruposExpandidos] = useState<Record<string, boolean>>({});
  
  const tabsSentinelRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (template) {
      setNome(template.nome);
      setTempoMedio(template.tempo_medio ?? null);
      const templateAbas = template.abas?.length > 0 ? template.abas : [{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }];
      setAbas(templateAbas);
      setCampos(template.campos_preenchimento.map(c => ({
        ...c,
        abas_ids: c.abas_ids || [ABA_GERAL_ID],
      })));
      setTarefas(template.tarefas);
      setAbaAtiva(templateAbas[0]?.id || ABA_GERAL_ID);
    } else {
      setNome("");
      setTempoMedio(null);
      setAbas([{ id: ABA_GERAL_ID, nome: "Geral", ordem: 0 }]);
      setCampos([]);
      setTarefas([]);
      setAbaAtiva(ABA_GERAL_ID);
    }
    setGruposExpandidos({});
  }, [template, open]);

  // Filtrar e ordenar campos por aba ativa
  const camposDaAbaAtiva = ordenarCamposPorAba(campos, abaAtiva);

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
    setAbaAtiva(novaAba.id); // Ativar a nova aba automaticamente
    toast.success("Aba adicionada");
  };

  const handleRemoveAba = (abaId: string) => {
    if (abaId === ABA_GERAL_ID) {
      toast.error("A aba 'Geral' não pode ser removida");
      return;
    }
    setCampos(campos.map(c => {
      const novasAbas = c.abas_ids.filter(id => id !== abaId);
      return {
        ...c,
        abas_ids: novasAbas.length === 0 ? [ABA_GERAL_ID] : novasAbas,
      };
    }));
    setAbas(abas.filter(a => a.id !== abaId));
    if (abaAtiva === abaId) {
      setAbaAtiva(ABA_GERAL_ID);
    }
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
      tipo_campo: "texto" as TipoCampo,
      obrigatorio_criacao: false,
      complementa_nome: false,
      abas_ids: [abaAtiva], // Associar à aba ativa
    };
    setCampos([...campos, novoCampo]);
  };

  const handleAddGrupo = () => {
    const novoGrupo: CampoPreenchimento = {
      id_campo: `g${Date.now()}`,
      nome_campo: "",
      tipo_campo: "grupo" as TipoCampo,
      obrigatorio_criacao: false,
      complementa_nome: false,
      abas_ids: [abaAtiva], // Associar à aba ativa
      campos: [], // Campos filhos do grupo
      quantidade_replicas_padrao: 1,
    };
    setCampos([...campos, novoGrupo]);
    setGruposExpandidos(prev => ({ ...prev, [novoGrupo.id_campo]: true }));
  };

  const handleAddCampoInGrupo = (grupoId: string) => {
    const novoCampoFilho: CampoPreenchimento = {
      id_campo: `c${Date.now()}`,
      nome_campo: "",
      tipo_campo: "texto" as TipoCampo,
      obrigatorio_criacao: false,
      complementa_nome: false,
      abas_ids: [], // Campos filhos herdam a aba do grupo
    };
    
    setCampos(campos.map(c => {
      if (c.id_campo === grupoId && c.tipo_campo === "grupo") {
        return {
          ...c,
          campos: [...(c.campos || []), novoCampoFilho],
        };
      }
      return c;
    }));
  };

  const handleRemoveCampo = (idCampo: string) => {
    setCampos(campos.filter((c) => c.id_campo !== idCampo).map(c => ({
      ...c,
      condicao_visibilidade: c.condicao_visibilidade?.campo_id === idCampo ? undefined : c.condicao_visibilidade,
    })));
  };

  const handleRemoveCampoFromGrupo = (grupoId: string, campoId: string) => {
    setCampos(campos.map(c => {
      if (c.id_campo === grupoId && c.tipo_campo === "grupo") {
        return {
          ...c,
          campos: (c.campos || []).filter(cf => cf.id_campo !== campoId),
        };
      }
      return c;
    }));
  };

  const handleUpdateCampo = (
    idCampo: string,
    updates: Partial<CampoPreenchimento>
  ) => {
    setCampos(
      campos.map((c) => {
        if (c.id_campo === idCampo) {
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

  const handleUpdateCampoInGrupo = (
    grupoId: string,
    campoId: string,
    updates: Partial<CampoPreenchimento>
  ) => {
    setCampos(campos.map(c => {
      if (c.id_campo === grupoId && c.tipo_campo === "grupo") {
        return {
          ...c,
          campos: (c.campos || []).map(cf => 
            cf.id_campo === campoId ? { ...cf, ...updates } : cf
          ),
        };
      }
      return c;
    }));
  };

  const handleToggleAbaInCampo = (idCampo: string, abaId: string) => {
    setCampos(campos.map(c => {
      if (c.id_campo !== idCampo) return c;
      
      const abasAtuais = c.abas_ids || [];
      if (abaId === "todas") {
        return { ...c, abas_ids: abas.map(a => a.id) };
      }
      
      if (abasAtuais.includes(abaId)) {
        const novas = abasAtuais.filter(id => id !== abaId);
        if (novas.length === 0) {
          return { ...c, abas_ids: [ABA_GERAL_ID] };
        }
        return { ...c, abas_ids: novas };
      } else {
        return { ...c, abas_ids: [...abasAtuais, abaId] };
      }
    }));
  };

  const handleSetCondicao = (idCampo: string, condicao: CondicaoVisibilidade | undefined) => {
    setCampos(campos.map(c => c.id_campo === idCampo ? { ...c, condicao_visibilidade: condicao } : c));
  };

  const handleSetCondicaoInGrupo = (grupoId: string, campoId: string, condicao: CondicaoVisibilidade | undefined) => {
    setCampos(campos.map(c => {
      if (c.id_campo === grupoId && c.tipo_campo === "grupo") {
        return {
          ...c,
          campos: (c.campos || []).map(cf => 
            cf.id_campo === campoId ? { ...cf, condicao_visibilidade: condicao } : cf
          ),
        };
      }
      return c;
    }));
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
      // Atualizar ordem_abas para a aba ativa
      const camposOrdenados = ordenarCamposPorAba(campos, abaAtiva);
      const oldIndex = camposOrdenados.findIndex((item) => item.id_campo === active.id);
      const newIndex = camposOrdenados.findIndex((item) => item.id_campo === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const novaOrdem = arrayMove(camposOrdenados, oldIndex, newIndex);
        
        // Atualizar ordem_abas de cada campo para a aba ativa
        setCampos(campos.map(campo => {
          const novaPos = novaOrdem.findIndex(c => c.id_campo === campo.id_campo);
          if (novaPos !== -1 && campo.abas_ids?.includes(abaAtiva)) {
            return {
              ...campo,
              ordem_abas: {
                ...(campo.ordem_abas || {}),
                [abaAtiva]: novaPos,
              },
            };
          }
          return campo;
        }));
      }
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

  const toggleGrupoExpandido = (grupoId: string) => {
    setGruposExpandidos(prev => ({ ...prev, [grupoId]: !prev[grupoId] }));
  };

  const handleSubmit = () => {
    if (!nome.trim()) {
      toast.error("O nome do template é obrigatório");
      return;
    }

    if (tempoMedio === null || tempoMedio === undefined || tempoMedio < 1) {
      toast.error("O tempo médio é obrigatório e deve ser de pelo menos 1 dia");
      return;
    }

    // Validar campos simples
    const camposSimples = campos.filter(c => c.tipo_campo !== "grupo");
    const camposInvalidos = camposSimples.filter((c) => !c.nome_campo.trim());
    if (camposInvalidos.length > 0) {
      toast.error("Todos os campos devem ter um nome");
      return;
    }

    // Validar grupos
    const grupos = campos.filter(c => c.tipo_campo === "grupo");
    for (const grupo of grupos) {
      if (!grupo.nome_campo.trim()) {
        toast.error("Todos os grupos devem ter um nome");
        return;
      }
      if (!grupo.campos || grupo.campos.length === 0) {
        toast.error(`O grupo "${grupo.nome_campo || 'sem nome'}" deve ter pelo menos um campo`);
        return;
      }
      const camposGrupoInvalidos = grupo.campos.filter(c => !c.nome_campo.trim());
      if (camposGrupoInvalidos.length > 0) {
        toast.error(`Todos os campos do grupo "${grupo.nome_campo}" devem ter um nome`);
        return;
      }
    }

    const tarefasInvalidas = tarefas.filter((t) => !t.nome_tarefa.trim());
    if (tarefasInvalidas.length > 0) {
      toast.error("Todas as tarefas devem ter um nome");
      return;
    }

    // Verificar se campos dropdown têm opções
    const verificarDropdowns = (camposList: CampoPreenchimento[]): boolean => {
      for (const c of camposList) {
        if (c.tipo_campo === "dropdown" && (!c.opcoes_dropdown || c.opcoes_dropdown.length === 0)) {
          return false;
        }
        if (c.tipo_campo === "grupo" && c.campos) {
          if (!verificarDropdowns(c.campos)) return false;
        }
      }
      return true;
    };

    if (!verificarDropdowns(campos)) {
      toast.error("Campos dropdown devem ter pelo menos uma opção");
      return;
    }

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

  const getOpcoesCondicao = (campoPaiId: string): string[] => {
    const campoPai = campos.find(c => c.id_campo === campoPaiId);
    if (!campoPai) return [];
    
    if (campoPai.tipo_campo === "dropdown") {
      return campoPai.opcoes_dropdown || [];
    }
    return [];
  };

  // Flatten campos para obter todos os campos (incluindo de grupos) para o select de mapeamento
  // Para campos de grupo, usa o ID base do campo filho (sem sufixo de bloco)
  // O backend irá buscar todos os valores de todos os blocos e enviar como lista
  const getAllCamposFlat = (): { id_campo: string; nome_campo: string; tipo_campo: TipoCampo }[] => {
    const result: { id_campo: string; nome_campo: string; tipo_campo: TipoCampo }[] = [];
    
    for (const campo of campos) {
      if (campo.tipo_campo === "grupo") {
        // Adicionar campos do grupo com prefixo do nome do grupo
        for (const campoFilho of (campo.campos || [])) {
          result.push({
            id_campo: campoFilho.id_campo,
            nome_campo: `${campo.nome_campo} > ${campoFilho.nome_campo}`,
            tipo_campo: campoFilho.tipo_campo,
          });
        }
      } else {
        result.push({
          id_campo: campo.id_campo,
          nome_campo: campo.nome_campo,
          tipo_campo: campo.tipo_campo,
        });
      }
    }
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-lg sm:text-xl">{template ? "Editar Template" : "Novo Template"}</DialogTitle>
        </DialogHeader>

        {/* Sticky Tabs */}
        <StickyTabs
          abas={abas}
          abaAtiva={abaAtiva}
          onAbaChange={setAbaAtiva}
          sentinelRef={tabsSentinelRef}
        />

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Seção: Configuração Básica */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Configuração Básica</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  value={tempoMedio === null ? "" : tempoMedio}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setTempoMedio(null);
                    } else {
                      const num = parseInt(val, 10);
                      if (!isNaN(num) && num > 0) {
                        setTempoMedio(num);
                      }
                    }
                  }}
                  placeholder="Ex: 7"
                />
                <p className="text-xs text-muted-foreground">
                  Dias esperados para conclusão
                </p>
              </div>
            </div>
          </div>

          {/* Seção: Gerenciamento de Abas */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Gerenciar Abas</h3>
            <p className="text-xs text-muted-foreground">
              Organize os campos em abas para melhor visualização. A aba "Geral" é padrão e não pode ser removida.
            </p>
            
            {/* Sentinel para StickyTabs */}
            <div ref={tabsSentinelRef} />
            
            {/* Abas como botões funcionais */}
            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border">
              {abas.map((aba) => (
                <div key={aba.id} className="flex items-center">
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
                    <button
                      type="button"
                      onClick={() => setAbaAtiva(aba.id)}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                        abaAtiva === aba.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {aba.nome}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditandoAba(aba.id);
                          setNomeAbaEditando(aba.nome);
                        }}
                        className="ml-1 p-0.5 rounded hover:bg-background/20"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {aba.id !== ABA_GERAL_ID && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAba(aba.id);
                          }}
                          className="ml-0.5 p-0.5 rounded hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </button>
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

          {/* Seção: Campos de Preenchimento */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Campos de Preenchimento
              </h3>
              <Badge variant="outline" className="text-xs">
                Aba: {abas.find(a => a.id === abaAtiva)?.nome || "Geral"}
              </Badge>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEndCampos}
            >
              <SortableContext
                items={camposDaAbaAtiva.map((c) => c.id_campo)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {camposDaAbaAtiva.map((campo) => (
                    <SortableItem key={campo.id_campo} id={campo.id_campo}>
                      {campo.tipo_campo === "grupo" ? (
                        // Renderização de Grupo
                        <div className="flex-1 p-4 border-2 border-dashed rounded-lg bg-muted/30 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-primary" />
                              <Input
                                value={campo.nome_campo}
                                onChange={(e) => handleUpdateCampo(campo.id_campo, { nome_campo: e.target.value })}
                                placeholder="Nome do Grupo"
                                className="max-w-xs font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Label className="text-xs text-muted-foreground">Réplicas padrão:</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={campo.quantidade_replicas_padrao || 1}
                                  onChange={(e) => handleUpdateCampo(campo.id_campo, { 
                                    quantidade_replicas_padrao: parseInt(e.target.value) || 1 
                                  })}
                                  className="w-16 h-8"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleGrupoExpandido(campo.id_campo)}
                              >
                                {gruposExpandidos[campo.id_campo] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCampo(campo.id_campo)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Seleção de Abas para o Grupo */}
                          <div className="space-y-2 p-3 rounded-md border bg-background/50">
                            <Label className="text-xs">Abas onde este grupo aparece</Label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleAbaInCampo(campo.id_campo, "todas")}
                                className={`h-6 px-2.5 text-xs rounded-full border transition-colors ${
                                  campo.abas_ids?.length === abas.length
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border"
                                }`}
                              >
                                Todas
                              </button>
                              {abas.map((aba) => (
                                <button
                                  key={aba.id}
                                  type="button"
                                  onClick={() => handleToggleAbaInCampo(campo.id_campo, aba.id)}
                                  className={`h-6 px-2.5 text-xs rounded-full border transition-colors ${
                                    campo.abas_ids?.includes(aba.id)
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-background text-muted-foreground border-border"
                                  }`}
                                >
                                  {aba.nome}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Campos do Grupo */}
                          {gruposExpandidos[campo.id_campo] && (
                            <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                              <p className="text-xs text-muted-foreground">
                                Campos dentro deste grupo (serão replicados conforme a quantidade definida na demanda)
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(campo.campos || []).map((campoFilho) => (
                                  <CampoEditor
                                    key={campoFilho.id_campo}
                                    campo={campoFilho}
                                    campos={campo.campos || []}
                                    abas={abas}
                                    onUpdate={(updates) => handleUpdateCampoInGrupo(campo.id_campo, campoFilho.id_campo, updates)}
                                    onRemove={() => handleRemoveCampoFromGrupo(campo.id_campo, campoFilho.id_campo)}
                                    onToggleAba={() => {}} // Campos filhos não têm abas
                                    onSetCondicao={(condicao) => handleSetCondicaoInGrupo(campo.id_campo, campoFilho.id_campo, condicao)}
                                    getOpcoesCondicao={getOpcoesCondicao}
                                    isGrupoChild={true}
                                  />
                                ))}
                              </div>

                              {(campo.campos || []).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-background">
                                  Nenhum campo no grupo
                                </p>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => handleAddCampoInGrupo(campo.id_campo)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Adicionar Campo ao Grupo
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Renderização de Campo Normal
                        <CampoEditor
                          campo={campo}
                          campos={campos}
                          abas={abas}
                          onUpdate={(updates) => handleUpdateCampo(campo.id_campo, updates)}
                          onRemove={() => handleRemoveCampo(campo.id_campo)}
                          onToggleAba={(abaId) => handleToggleAbaInCampo(campo.id_campo, abaId)}
                          onSetCondicao={(condicao) => handleSetCondicao(campo.id_campo, condicao)}
                          getOpcoesCondicao={getOpcoesCondicao}
                        />
                      )}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {camposDaAbaAtiva.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-background">
                Nenhum campo nesta aba
              </p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAddCampo} size="sm" variant="outline" className="flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Campo
              </Button>
              <Button onClick={handleAddGrupo} size="sm" variant="outline" className="flex-1">
                <Layers className="w-4 h-4 mr-1" />
                Adicionar Grupo
              </Button>
            </div>
          </div>

          {/* Seção: Tarefas */}
          <div className="p-4 rounded-lg border bg-card space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tarefas</h3>

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
                      <div className="flex-1 p-3 sm:p-4 border rounded-lg bg-background space-y-3">
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
                              <SelectGroup>
                                <SelectLabel>Cargos</SelectLabel>
                                {Object.values(Cargo).map((cargo) => (
                                  <SelectItem key={cargo} value={cargo}>
                                    {CargoLabels[cargo]}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Usuários</SelectLabel>
                                {usuarios.map((usuario) => (
                                  <SelectItem key={usuario.id} value={usuario.id}>
                                    {usuario.nome}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Ação Automática */}
                        <Collapsible defaultOpen={!!tarefa.acao_id}>
                          <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="gap-2 h-7 text-xs">
                              {tarefa.acao_id ? (
                                <>
                                  <Zap className="w-3 h-3 text-yellow-500" />
                                  Ação configurada
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  Adicionar ação automática
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2 space-y-3">
                            <div className="p-3 border rounded bg-muted/30 space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Ação a executar</Label>
                                <Select
                                  value={tarefa.acao_id || "none"}
                                  onValueChange={(v) => {
                                    if (v === "none") {
                                      handleUpdateTarefa(tarefa.id_tarefa, {
                                        acao_id: undefined,
                                        mapeamento_campos: undefined,
                                      });
                                    } else {
                                      handleUpdateTarefa(tarefa.id_tarefa, {
                                        acao_id: v,
                                        mapeamento_campos: {},
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Selecione uma ação" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhuma ação</SelectItem>
                                    {acoes.map((acao) => (
                                      <SelectItem key={acao.id} value={acao.id}>
                                        <span className="flex items-center gap-2">
                                          <Zap className="w-3 h-3 text-yellow-500" />
                                          {acao.nome}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Mapeamento de Campos */}
                              {tarefa.acao_id && (() => {
                                const acaoSelecionada = acoes.find(a => a.id === tarefa.acao_id);
                                if (!acaoSelecionada) return null;
                                
                                const allCampos = getAllCamposFlat();
                                
                                return (
                                  <div className="space-y-2">
                                    <Label className="text-xs flex items-center gap-1">
                                      <Link2 className="w-3 h-3" />
                                      Mapeamento de Campos
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      Vincule campos da demanda aos parâmetros da ação
                                    </p>
                                    
                                    <div className="space-y-2">
                                      {acaoSelecionada.campos.map((campoAcao) => (
                                        <div key={campoAcao.id_campo} className="flex items-center gap-2">
                                          <div className="flex-1 p-2 border rounded bg-background">
                                            <span className="text-xs font-medium">
                                              {campoAcao.nome_campo}
                                              {campoAcao.obrigatorio && <span className="text-destructive ml-0.5">*</span>}
                                            </span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                              ({campoAcao.tipo_campo})
                                            </span>
                                          </div>
                                          <span className="text-muted-foreground">→</span>
                                          <Select
                                            value={tarefa.mapeamento_campos?.[campoAcao.id_campo] || "none"}
                                            onValueChange={(v) => {
                                              const novoMapeamento: MapeamentoCampos = {
                                                ...(tarefa.mapeamento_campos || {}),
                                              };
                                              if (v === "none") {
                                                delete novoMapeamento[campoAcao.id_campo];
                                              } else {
                                                novoMapeamento[campoAcao.id_campo] = v;
                                              }
                                              handleUpdateTarefa(tarefa.id_tarefa, {
                                                mapeamento_campos: novoMapeamento,
                                              });
                                            }}
                                          >
                                            <SelectTrigger className="h-8 flex-1">
                                              <SelectValue placeholder="Campo da demanda" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">-- Não vincular --</SelectItem>
                                              {allCampos
                                                .filter(c => {
                                                  if (campoAcao.tipo_campo === "arquivo") return c.tipo_campo === "arquivo";
                                                  if (c.tipo_campo === "arquivo") return campoAcao.tipo_campo === "arquivo";
                                                  return true;
                                                })
                                                .map((c) => (
                                                  <SelectItem key={c.id_campo} value={c.id_campo}>
                                                    {c.nome_campo || "Sem nome"}
                                                  </SelectItem>
                                                ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ))}
                                      
                                      {acaoSelecionada.campos.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                          Esta ação não possui campos de entrada
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}

                              {tarefa.acao_id && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs text-destructive"
                                  onClick={() => handleUpdateTarefa(tarefa.id_tarefa, {
                                    acao_id: undefined,
                                    mapeamento_campos: undefined,
                                  })}
                                >
                                  Remover ação
                                </Button>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

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
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-background">
                Nenhuma tarefa adicionada
              </p>
            )}

            <Button onClick={handleAddTarefa} size="sm" variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Tarefa
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">{template ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
