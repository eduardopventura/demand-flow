import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { EditorTemplateModal } from "@/components/modals/EditorTemplateModal";
import type { Template } from "@/contexts/DataContext";
import { toast } from "sonner";

export default function Templates() {
  const { templates, deleteTemplate } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<Template | null>(null);

  const handleEdit = (template: Template) => {
    setTemplateEditando(template);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este template?")) {
      deleteTemplate(id);
      toast.success("Template excluído com sucesso!");
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTemplateEditando(null);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Templates</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Crie e gerencie modelos de demandas
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Novo Template</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{template.nome}</h3>
                  <Badge variant="secondary">{template.prioridade}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Campos de Preenchimento
                  </p>
                  <p className="text-sm">{template.campos_preenchimento.length} campos</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tarefas</p>
                  <p className="text-sm">{template.tarefas.length} tarefas</p>
                </div>
              </div>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                Nenhum template criado. Clique em "Novo Template" para começar.
              </p>
            </div>
          )}
        </div>
      </div>

      <EditorTemplateModal
        template={templateEditando}
        open={modalOpen}
        onOpenChange={handleCloseModal}
      />
    </div>
  );
}
