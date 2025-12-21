import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiService } from "@/services/api.service";
import { useData } from "@/contexts/DataContext";
import type { Cargo, CargoPermissionKey } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Save, ChevronDown, ChevronUp, Trash2, Undo2, ArrowLeft, Edit3 } from "lucide-react";

type CargoDraft = Cargo & {
  ui: {
    expanded: boolean;
    isNew: boolean;
    isDeleted: boolean;
    renaming: boolean;
    reassignToCargoId: string | null;
    original: Cargo | null;
  };
};

const PERMISSIONS: Array<{ key: CargoPermissionKey; label: string }> = [
  { key: "acesso_templates", label: "Acesso Templates" },
  { key: "acesso_acoes", label: "Acesso Ações" },
  { key: "acesso_usuarios", label: "Acesso Usuários" },
  { key: "deletar_demandas", label: "Deletar Demandas" },
  { key: "cargo_disponivel_como_responsavel", label: "Cargo Disponível Como Responsável" },
  { key: "usuarios_disponiveis_como_responsaveis", label: "Usuários Disponíveis como Responsáveis" },
];

function withDefaults(c: Cargo): Cargo {
  return {
    ...c,
    acesso_templates: !!c.acesso_templates,
    acesso_acoes: !!c.acesso_acoes,
    acesso_usuarios: !!c.acesso_usuarios,
    deletar_demandas: !!c.deletar_demandas,
    cargo_disponivel_como_responsavel: !!c.cargo_disponivel_como_responsavel,
    usuarios_disponiveis_como_responsaveis: !!c.usuarios_disponiveis_como_responsaveis,
  };
}

function isCargoDirty(d: CargoDraft): boolean {
  if (d.ui.isNew) return true;
  if (!d.ui.original) return false;

  const a = withDefaults(d.ui.original);
  const b = withDefaults(d);

  return (
    a.nome !== b.nome ||
    a.acesso_templates !== b.acesso_templates ||
    a.acesso_acoes !== b.acesso_acoes ||
    a.acesso_usuarios !== b.acesso_usuarios ||
    a.deletar_demandas !== b.deletar_demandas ||
    a.cargo_disponivel_como_responsavel !== b.cargo_disponivel_como_responsavel ||
    a.usuarios_disponiveis_como_responsaveis !== b.usuarios_disponiveis_como_responsaveis ||
    d.ui.isDeleted
  );
}

export default function Cargos() {
  const navigate = useNavigate();
  const { refreshPublicData } = useData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<CargoDraft[]>([]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createNome, setCreateNome] = useState("");

  const activeDrafts = useMemo(() => drafts.filter((d) => !d.ui.isDeleted), [drafts]);

  const hasPendingChanges = useMemo(() => drafts.some(isCargoDirty), [drafts]);

  const load = async () => {
    setLoading(true);
    try {
      const cargos = await apiService.getCargos();
      setDrafts(
        cargos.map((c) => {
          const normalized = withDefaults(c);
          return {
            ...normalized,
            ui: {
              expanded: false,
              isNew: false,
              isDeleted: false,
              renaming: false,
              reassignToCargoId: null,
              original: normalized,
            },
          };
        })
      );
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar cargos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpanded = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ui: { ...d.ui, expanded: !d.ui.expanded } } : d))
    );
  };

  const togglePermission = (id: string, key: CargoPermissionKey, value: boolean) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              [key]: value,
            }
          : d
      )
    );
  };

  const startRename = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ui: { ...d.ui, renaming: true } } : d)));
  };

  const finishRename = (id: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ui: { ...d.ui, renaming: false } } : d)));
  };

  const setNome = (id: string, nome: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, nome } : d)));
  };

  const markDelete = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, ui: { ...d.ui, isDeleted: true, expanded: false, renaming: false } }
          : d
      )
    );
  };

  const undoDelete = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, ui: { ...d.ui, isDeleted: false, reassignToCargoId: null } }
          : d
      )
    );
  };

  const setReassign = (id: string, cargoDestinoId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ui: { ...d.ui, reassignToCargoId: cargoDestinoId } } : d))
    );
  };

  const handleCreate = () => {
    const nome = createNome.trim();
    if (!nome) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    const tempId = `new-${Date.now()}`;
    const novo: CargoDraft = {
      id: tempId,
      nome,
      acesso_templates: false,
      acesso_acoes: false,
      acesso_usuarios: false,
      deletar_demandas: false,
      cargo_disponivel_como_responsavel: false,
      usuarios_disponiveis_como_responsaveis: false,
      ui: {
        expanded: true,
        isNew: true,
        isDeleted: false,
        renaming: false,
        reassignToCargoId: null,
        original: null,
      },
    };

    setDrafts((prev) => [novo, ...prev]);
    setCreateNome("");
    setCreateOpen(false);
  };

  const validateDrafts = (): boolean => {
    const names = activeDrafts.map((d) => d.nome.trim().toLowerCase());
    const duplicates = names.filter((n, idx) => n && names.indexOf(n) !== idx);
    if (duplicates.length > 0) {
      toast.error("Existem cargos com nomes duplicados. Ajuste antes de salvar.");
      return false;
    }

    for (const d of activeDrafts) {
      if (!d.nome.trim()) {
        toast.error("Todos os cargos precisam ter nome.");
        return false;
      }
    }

    for (const d of drafts.filter((x) => x.ui.isDeleted)) {
      const count = d._count?.usuarios || 0;
      if (count > 0 && (!d.ui.reassignToCargoId || d.ui.reassignToCargoId === d.id)) {
        toast.error(`Para excluir "${d.nome}", selecione um cargo destino para realocar os usuários.`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateDrafts()) return;

    setSaving(true);
    try {
      const creates = drafts
        .filter((d) => d.ui.isNew && !d.ui.isDeleted)
        .map((d) => ({
          nome: d.nome.trim(),
          acesso_templates: !!d.acesso_templates,
          acesso_acoes: !!d.acesso_acoes,
          acesso_usuarios: !!d.acesso_usuarios,
          deletar_demandas: !!d.deletar_demandas,
          cargo_disponivel_como_responsavel: !!d.cargo_disponivel_como_responsavel,
          usuarios_disponiveis_como_responsaveis: !!d.usuarios_disponiveis_como_responsaveis,
        }));

      const updates = drafts
        .filter((d) => !d.ui.isNew && !d.ui.isDeleted && isCargoDirty(d))
        .map((d) => ({
          id: d.id,
          nome: d.nome.trim(),
          acesso_templates: !!d.acesso_templates,
          acesso_acoes: !!d.acesso_acoes,
          acesso_usuarios: !!d.acesso_usuarios,
          deletar_demandas: !!d.deletar_demandas,
          cargo_disponivel_como_responsavel: !!d.cargo_disponivel_como_responsavel,
          usuarios_disponiveis_como_responsaveis: !!d.usuarios_disponiveis_como_responsaveis,
        }));

      const deletes = drafts
        .filter((d) => d.ui.isDeleted && !d.ui.isNew)
        .map((d) => ({
          id: d.id,
          reassignToCargoId: d.ui.reassignToCargoId || undefined,
        }));

      await apiService.saveCargosBatch({ creates, updates, deletes });
      toast.success("Cargos salvos com sucesso!");
      await load();
      await refreshPublicData();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar cargos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Cargos</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Gerencie cargos e permissões (salvar em lote)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/usuarios")} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Usuários
              </Button>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Cargo
              </Button>
              <Button onClick={handleSave} disabled={!hasPendingChanges || saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando cargos...</div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
            Nenhum cargo encontrado
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => {
              const usuariosCount = d._count?.usuarios || 0;
              const dirty = isCargoDirty(d);

              const destinos = activeDrafts.filter((x) => x.id !== d.id && !x.ui.isNew);

              return (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {d.ui.renaming ? (
                          <Input
                            value={d.nome}
                            onChange={(e) => setNome(d.id, e.target.value)}
                            onBlur={() => finishRename(d.id)}
                            className="h-9 max-w-sm"
                          />
                        ) : (
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">{d.nome}</h3>
                              {dirty && <span className="text-xs text-amber-600">• Alterado</span>}
                              {d.ui.isDeleted && <span className="text-xs text-destructive">• Marcado para excluir</span>}
                              {d.ui.isNew && <span className="text-xs text-muted-foreground">• Novo</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Usuários vinculados: <span className="font-medium">{usuariosCount}</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {d.ui.isDeleted && usuariosCount > 0 && (
                        <div className="mt-3 space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Excluir com usuários exige realocar para:
                          </Label>
                          <Select
                            value={d.ui.reassignToCargoId || ""}
                            onValueChange={(v) => setReassign(d.id, v)}
                          >
                            <SelectTrigger className="h-9 max-w-sm">
                              <SelectValue placeholder="Selecione um cargo destino" />
                            </SelectTrigger>
                            <SelectContent>
                              {destinos.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {d.ui.expanded && !d.ui.isDeleted && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PERMISSIONS.map((p) => (
                            <label key={p.key} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={withDefaults(d)[p.key] === true}
                                onCheckedChange={(checked) =>
                                  togglePermission(d.id, p.key, checked as boolean)
                                }
                              />
                              <span>{p.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!d.ui.isDeleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpanded(d.id)}
                          title={d.ui.expanded ? "Resumir" : "Expandir"}
                        >
                          {d.ui.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      )}

                      {!d.ui.isDeleted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startRename(d.id)}
                          title="Renomear"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      )}

                      {d.ui.isDeleted ? (
                        <Button variant="ghost" size="icon" onClick={() => undoDelete(d.id)} title="Desfazer">
                          <Undo2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (d.ui.isNew) {
                              setDrafts((prev) => prev.filter((x) => x.id !== d.id));
                            } else {
                              markDelete(d.id);
                            }
                          }}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Cargo</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Nome do cargo</Label>
            <Input value={createNome} onChange={(e) => setCreateNome(e.target.value)} placeholder="Ex: Operador 2" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


