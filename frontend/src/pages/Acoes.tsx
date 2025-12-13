import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Zap, Link2, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import type { Acao, CampoAcao, TipoCampo } from "@/types";
import { FIELD_TYPE_OPTIONS } from "@/constants";

interface CampoFormData {
  id_campo: string;
  nome_campo: string;
  tipo_campo: TipoCampo;
  opcoes_dropdown: string[];
  obrigatorio: boolean;
}

export default function Acoes() {
  const { acoes, addAcao, updateAcao, deleteAcao } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [acaoEditando, setAcaoEditando] = useState<Acao | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    url: "",
  });
  const [campos, setCampos] = useState<CampoFormData[]>([]);
  const [novaOpcao, setNovaOpcao] = useState<{ [key: string]: string }>({});

  const generateCampoId = () => `ac${Date.now()}${Math.random().toString(36).substr(2, 4)}`;

  const handleOpenModal = (acao?: Acao) => {
    if (acao) {
      setAcaoEditando(acao);
      setFormData({
        nome: acao.nome,
        url: acao.url,
      });
      setCampos(
        acao.campos.map((c) => ({
          id_campo: c.id_campo,
          nome_campo: c.nome_campo,
          tipo_campo: c.tipo_campo,
          opcoes_dropdown: c.opcoes_dropdown || [],
          obrigatorio: c.obrigatorio,
        }))
      );
    } else {
      setAcaoEditando(null);
      setFormData({ nome: "", url: "" });
      setCampos([]);
    }
    setNovaOpcao({});
    setModalOpen(true);
  };

  const handleAddCampo = () => {
    setCampos([
      ...campos,
      {
        id_campo: generateCampoId(),
        nome_campo: "",
        tipo_campo: "texto" as TipoCampo,
        opcoes_dropdown: [],
        obrigatorio: false,
      },
    ]);
  };

  const handleRemoveCampo = (index: number) => {
    setCampos(campos.filter((_, i) => i !== index));
  };

  const handleCampoChange = (index: number, field: keyof CampoFormData, value: unknown) => {
    const newCampos = [...campos];
    newCampos[index] = { ...newCampos[index], [field]: value };
    setCampos(newCampos);
  };

  const handleAddOpcao = (campoIndex: number) => {
    const opcao = novaOpcao[campoIndex]?.trim();
    if (!opcao) return;

    const newCampos = [...campos];
    newCampos[campoIndex].opcoes_dropdown = [
      ...newCampos[campoIndex].opcoes_dropdown,
      opcao,
    ];
    setCampos(newCampos);
    setNovaOpcao({ ...novaOpcao, [campoIndex]: "" });
  };

  const handleRemoveOpcao = (campoIndex: number, opcaoIndex: number) => {
    const newCampos = [...campos];
    newCampos[campoIndex].opcoes_dropdown = newCampos[campoIndex].opcoes_dropdown.filter(
      (_, i) => i !== opcaoIndex
    );
    setCampos(newCampos);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.url) {
      toast.error("Preencha o nome e a URL da ação");
      return;
    }

    // Validar URL
    try {
      new URL(formData.url);
    } catch {
      toast.error("URL inválida. Use um formato completo (ex: https://...)" );
      return;
    }

    // Validar campos
    for (const campo of campos) {
      if (!campo.nome_campo) {
        toast.error("Todos os campos devem ter um nome");
        return;
      }
      if (campo.tipo_campo === "dropdown" && campo.opcoes_dropdown.length === 0) {
        toast.error(`O campo "${campo.nome_campo}" precisa ter pelo menos uma opção`);
        return;
      }
    }

    const acaoData = {
      nome: formData.nome,
      url: formData.url,
      campos: campos.map((c) => ({
        id_campo: c.id_campo,
        nome_campo: c.nome_campo,
        tipo_campo: c.tipo_campo,
        opcoes_dropdown: c.tipo_campo === "dropdown" ? c.opcoes_dropdown : undefined,
        obrigatorio: c.obrigatorio,
      })) as CampoAcao[],
    };

    if (acaoEditando) {
      updateAcao(acaoEditando.id, acaoData);
    } else {
      addAcao(acaoData);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta ação?")) {
      deleteAcao(id);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Ações</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Configure webhooks e ações automáticas para tarefas
            </p>
          </div>
          <Button onClick={() => handleOpenModal()} size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Nova Ação</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {acoes.map((acao) => (
            <Card key={acao.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                    <h3 className="font-semibold text-foreground truncate">{acao.nome}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{acao.url}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <span className="bg-muted px-2 py-0.5 rounded">
                      {acao.campos.length} campo{acao.campos.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenModal(acao)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(acao.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {acoes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma ação cadastrada</p>
              <p className="text-sm mt-1">Crie ações para automatizar tarefas via webhooks</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL (Webhook)</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acoes.map((acao) => (
                <TableRow key={acao.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      {acao.nome}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm truncate block max-w-[300px]">
                      {acao.url}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {acao.campos.slice(0, 3).map((campo) => (
                        <span
                          key={campo.id_campo}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {campo.nome_campo}
                        </span>
                      ))}
                      {acao.campos.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{acao.campos.length - 3}
                        </span>
                      )}
                      {acao.campos.length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem campos</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(acao)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(acao.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {acoes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma ação cadastrada</p>
              <p className="text-sm mt-1">Crie ações para automatizar tarefas via webhooks</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {acaoEditando ? "Editar Ação" : "Nova Ação"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Informações básicas */}
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Informações da Ação
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Ação</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Enviar Email, Gerar Documento..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://n8n.exemplo.com/webhook/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    URL do webhook que será chamado quando a ação for executada (ex: n8n, Zapier, etc)
                  </p>
                </div>
              </div>
            </div>

            {/* Campos de entrada */}
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Campos de Entrada
                </h3>
                <Button variant="outline" size="sm" onClick={handleAddCampo} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Adicionar Campo
                </Button>
              </div>

              {campos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum campo adicionado. Os campos definem quais dados serão enviados para o webhook.
                </p>
              )}

              <div className="space-y-3">
                {campos.map((campo, index) => (
                  <div
                    key={campo.id_campo}
                    className="p-3 rounded-md border bg-muted/20 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-2.5 shrink-0" />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Nome do Campo</Label>
                          <Input
                            value={campo.nome_campo}
                            onChange={(e) =>
                              handleCampoChange(index, "nome_campo", e.target.value)
                            }
                            placeholder="Nome do campo"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={campo.tipo_campo}
                            onValueChange={(value) =>
                              handleCampoChange(index, "tipo_campo", value)
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPE_OPTIONS.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-background">
                            <Checkbox
                              id={`obrigatorio-${index}`}
                              checked={campo.obrigatorio}
                              onCheckedChange={(checked) =>
                                handleCampoChange(index, "obrigatorio", checked)
                              }
                            />
                            <Label
                              htmlFor={`obrigatorio-${index}`}
                              className="text-xs cursor-pointer"
                            >
                              Obrigatório
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                            onClick={() => handleRemoveCampo(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Opções de dropdown */}
                    {campo.tipo_campo === "dropdown" && (
                      <div className="ml-6 space-y-2">
                        <Label className="text-xs text-muted-foreground">Opções</Label>
                        <div className="flex flex-wrap gap-1">
                          {campo.opcoes_dropdown.map((opcao, opcaoIndex) => (
                            <span
                              key={opcaoIndex}
                              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              {opcao}
                              <button
                                type="button"
                                onClick={() => handleRemoveOpcao(index, opcaoIndex)}
                                className="hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={novaOpcao[index] || ""}
                            onChange={(e) =>
                              setNovaOpcao({ ...novaOpcao, [index]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOpcao(index);
                              }
                            }}
                            placeholder="Nova opção..."
                            className="h-8 text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOpcao(index)}
                            className="h-8"
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {acaoEditando ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

