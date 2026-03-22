import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Lock, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ColunaKanban } from "@/types";

interface GerenciarColunasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarColunasModal({ open, onOpenChange }: GerenciarColunasModalProps) {
  const { colunasKanban, addColunaKanban, updateColunaKanban, deleteColunaKanban, reorderColunasKanban, demandas } = useData();
  const [newColumnName, setNewColumnName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const intermediateColumns = colunasKanban.filter(c => !c.fixa);
  const criadaCol = colunasKanban.find(c => c.nome === "Criada");
  const finalizadaCol = colunasKanban.find(c => c.nome === "Finalizada");

  const handleAddColumn = async () => {
    const nome = newColumnName.trim();
    if (!nome) {
      toast.error("Nome da coluna é obrigatório");
      return;
    }
    setIsSubmitting(true);
    try {
      await addColunaKanban({ nome });
      setNewColumnName("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar coluna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (col: ColunaKanban) => {
    setEditingId(col.id);
    setEditingName(col.nome);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const nome = editingName.trim();
    if (!nome) {
      toast.error("Nome não pode ser vazio");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateColunaKanban(editingId, { nome });
      setEditingId(null);
      setEditingName("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao renomear coluna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (col: ColunaKanban) => {
    const count = demandas.filter(d => d.status === col.nome).length;
    if (count > 0) {
      toast.error(`Existem ${count} demanda(s) nesta coluna. Mova-as antes de excluir.`);
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteColunaKanban(col.id);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir coluna");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveUp = async (col: ColunaKanban) => {
    const idx = intermediateColumns.findIndex(c => c.id === col.id);
    if (idx <= 0) return;
    const prev = intermediateColumns[idx - 1];
    
    setIsSubmitting(true);
    try {
      await reorderColunasKanban([
        { id: col.id, ordem: prev.ordem },
        { id: prev.id, ordem: col.ordem },
      ]);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao reordenar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMoveDown = async (col: ColunaKanban) => {
    const idx = intermediateColumns.findIndex(c => c.id === col.id);
    if (idx >= intermediateColumns.length - 1) return;
    const next = intermediateColumns[idx + 1];
    
    setIsSubmitting(true);
    try {
      await reorderColunasKanban([
        { id: col.id, ordem: next.ordem },
        { id: next.id, ordem: col.ordem },
      ]);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao reordenar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const demandasCount = (nome: string) => demandas.filter(d => d.status === nome).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Colunas do Kanban</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Fixed: Criada */}
          {criadaCol && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium flex-1">Criada</span>
              <span className="text-xs text-muted-foreground">{demandasCount("Criada")} demandas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Fixa</span>
            </div>
          )}

          {/* Intermediate columns */}
          {intermediateColumns.map((col, idx) => (
            <div key={col.id} className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              
              {editingId === col.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveEdit} disabled={isSubmitting}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    className="font-medium flex-1 text-left hover:text-primary transition-colors"
                    onClick={() => handleStartEdit(col)}
                  >
                    {col.nome}
                  </button>
                  <span className="text-xs text-muted-foreground">{demandasCount(col.nome)}</span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveUp(col)}
                      disabled={idx === 0 || isSubmitting}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveDown(col)}
                      disabled={idx === intermediateColumns.length - 1 || isSubmitting}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-7 w-7", demandasCount(col.nome) > 0 ? "text-muted-foreground" : "text-destructive hover:text-destructive")}
                      onClick={() => handleDelete(col)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new column */}
          <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed">
            <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Nova coluna..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
              }}
            />
            <Button size="sm" onClick={handleAddColumn} disabled={isSubmitting || !newColumnName.trim()}>
              Criar
            </Button>
          </div>

          {/* Fixed: Finalizada */}
          {finalizadaCol && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium flex-1">Finalizada</span>
              <span className="text-xs text-muted-foreground">{demandasCount("Finalizada")} demandas</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Fixa</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
