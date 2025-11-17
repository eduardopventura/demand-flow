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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface NovaDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovaDemandaModal = ({ open, onOpenChange }: NovaDemandaModalProps) => {
  const { templates, usuarios, addDemanda, getTemplate } = useData();
  const [templateId, setTemplateId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [camposValores, setCamposValores] = useState<Record<string, string>>({});

  const templateSelecionado = getTemplate(templateId);

  useEffect(() => {
    if (templateSelecionado) {
      const initialValues: Record<string, string> = {};
      templateSelecionado.campos_preenchimento.forEach((campo) => {
        initialValues[campo.id_campo] = "";
      });
      setCamposValores(initialValues);
    }
  }, [templateSelecionado]);

  const handleSubmit = () => {
    if (!templateId || !responsavelId) {
      toast.error("Selecione um template e um responsável");
      return;
    }

    if (!templateSelecionado) return;

    // Validar campos obrigatórios
    const camposObrigatorios = templateSelecionado.campos_preenchimento.filter(
      (c) => c.obrigatorio_criacao
    );
    const camposFaltando = camposObrigatorios.filter((c) => !camposValores[c.id_campo]?.trim());

    if (camposFaltando.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios`);
      return;
    }

    // Criar demanda
    const novaDemanda = {
      template_id: templateId,
      nome_demanda: templateSelecionado.nome,
      status: "Criada" as const,
      prioridade: templateSelecionado.prioridade,
      responsavel_id: responsavelId,
      campos_preenchidos: Object.entries(camposValores).map(([id_campo, valor]) => ({
        id_campo,
        valor,
      })),
      tarefas_status: templateSelecionado.tarefas.map((t) => ({
        id_tarefa: t.id_tarefa,
        concluida: false,
      })),
    };

    addDemanda(novaDemanda);
    toast.success("Demanda criada com sucesso!");
    onOpenChange(false);
    
    // Reset
    setTemplateId("");
    setResponsavelId("");
    setCamposValores({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Demanda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Template *</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsável *</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
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

          {templateSelecionado && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Campos de Preenchimento</h4>
              {templateSelecionado.campos_preenchimento.map((campo) => (
                <div key={campo.id_campo} className="space-y-2">
                  <Label>
                    {campo.nome_campo}
                    {campo.obrigatorio_criacao && " *"}
                  </Label>
                  <Input
                    value={camposValores[campo.id_campo] || ""}
                    onChange={(e) =>
                      setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
                    }
                    placeholder={`Digite ${campo.nome_campo.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Criar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
