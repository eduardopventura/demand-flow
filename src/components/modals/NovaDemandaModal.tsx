import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { CampoPreenchimento, CondicaoVisibilidade } from "@/types";

interface NovaDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Função para avaliar condição de visibilidade
const avaliarCondicaoVisibilidade = (
  condicao: CondicaoVisibilidade | undefined,
  camposValores: Record<string, string>
): boolean => {
  if (!condicao) return true; // Sem condição = sempre visível

  const valorCampoPai = camposValores[condicao.campo_id] || "";

  switch (condicao.operador) {
    case "igual":
      return valorCampoPai === condicao.valor;
    case "diferente":
      return valorCampoPai !== condicao.valor;
    case "preenchido":
      return valorCampoPai.trim() !== "";
    case "vazio":
      return valorCampoPai.trim() === "";
    default:
      return true;
  }
};

export const NovaDemandaModal = ({ open, onOpenChange }: NovaDemandaModalProps) => {
  const { templates, usuarios, addDemanda, getTemplate } = useData();
  const [templateId, setTemplateId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [camposValores, setCamposValores] = useState<Record<string, string>>({});
  const [abaAtiva, setAbaAtiva] = useState<string>("geral");

  const templateSelecionado = getTemplate(templateId);

  // Abas do template (com fallback para aba Geral)
  const abas = useMemo(() => {
    if (!templateSelecionado?.abas?.length) {
      return [{ id: "geral", nome: "Geral", ordem: 0 }];
    }
    return [...templateSelecionado.abas].sort((a, b) => a.ordem - b.ordem);
  }, [templateSelecionado]);

  useEffect(() => {
    if (templateSelecionado) {
      const initialValues: Record<string, string> = {};
      templateSelecionado.campos_preenchimento.forEach((campo) => {
        initialValues[campo.id_campo] = "";
      });
      setCamposValores(initialValues);
      // Selecionar primeira aba
      if (abas.length > 0) {
        setAbaAtiva(abas[0].id);
      }
    }
  }, [templateSelecionado, abas]);

  // Filtrar campos visíveis para uma aba específica
  const getCamposVisiveis = (abaId: string): CampoPreenchimento[] => {
    if (!templateSelecionado) return [];

    return templateSelecionado.campos_preenchimento.filter((campo) => {
      // Verificar se pertence à aba
      const pertenceAba = campo.abas_ids?.includes(abaId) ?? abaId === "geral";
      if (!pertenceAba) return false;

      // Verificar condição de visibilidade
      return avaliarCondicaoVisibilidade(campo.condicao_visibilidade, camposValores);
    });
  };

  const renderCampoInput = (campo: CampoPreenchimento) => {
    const value = camposValores[campo.id_campo] || "";

    switch (campo.tipo_campo) {
      case "numero":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
            }
            placeholder={campo.obrigatorio_criacao ? "Obrigatório" : "Opcional"}
          />
        );
      case "data":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) =>
              setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
            }
          />
        );
      case "arquivo":
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCamposValores({ ...camposValores, [campo.id_campo]: file.name });
              }
            }}
          />
        );
      case "dropdown":
        return (
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
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) =>
              setCamposValores({ ...camposValores, [campo.id_campo]: e.target.value })
            }
            placeholder={campo.obrigatorio_criacao ? "Obrigatório" : "Opcional"}
          />
        );
    }
  };

  const handleSubmit = () => {
    if (!templateId || !responsavelId) {
      toast.error("Selecione um template e um responsável");
      return;
    }

    if (!templateSelecionado) return;

    // Validar campos obrigatórios (somente os visíveis)
    const camposObrigatorios = templateSelecionado.campos_preenchimento.filter(
      (c) => c.obrigatorio_criacao && avaliarCondicaoVisibilidade(c.condicao_visibilidade, camposValores)
    );
    const camposFaltando = camposObrigatorios.filter((c) => !camposValores[c.id_campo]?.trim());

    if (camposFaltando.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios`);
      return;
    }

    // Verificar se campo "complementa_nome" está preenchido
    const campoComplementaNome = templateSelecionado.campos_preenchimento.find(
      (c) => c.complementa_nome
    );
    
    if (campoComplementaNome && !camposValores[campoComplementaNome.id_campo]?.trim()) {
      toast.error(`O campo "${campoComplementaNome.nome_campo}" é obrigatório`);
      return;
    }

    // Gerar nome da demanda
    let nomeDemanda = templateSelecionado.nome;
    if (campoComplementaNome) {
      const valorComplemento = camposValores[campoComplementaNome.id_campo];
      nomeDemanda = `${templateSelecionado.nome} - ${valorComplemento}`;
    }

    // Calcular data de previsão baseada no tempo médio do template
    const dataCriacao = new Date();
    const tempoMedio = templateSelecionado.tempo_medio || 7;
    const dataPrevisao = new Date(dataCriacao);
    dataPrevisao.setDate(dataPrevisao.getDate() + tempoMedio);

    // Criar demanda
    const novaDemanda = {
      template_id: templateId,
      nome_demanda: nomeDemanda,
      status: "Criada" as const,
      responsavel_id: responsavelId,
      tempo_esperado: tempoMedio,
      campos_preenchidos: Object.entries(camposValores).map(([id_campo, valor]) => ({
        id_campo,
        valor,
      })),
      tarefas_status: templateSelecionado.tarefas.map((t) => ({
        id_tarefa: t.id_tarefa,
        concluida: false,
        responsavel_id: t.responsavel_id,
      })),
      data_criacao: dataCriacao.toISOString(),
      data_previsao: dataPrevisao.toISOString(),
      data_finalizacao: null,
      prazo: true,
      observacoes: "",
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
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nova Demanda</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 sm:py-4">
          <div className="space-y-2">
            <Label className="text-sm">Template *</Label>
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
            <Label className="text-sm">Responsável *</Label>
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
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tempo Médio:</strong> {templateSelecionado.tempo_medio || 7} dias
              </p>
            </div>
          )}

          {templateSelecionado && templateSelecionado.campos_preenchimento.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm sm:text-base">Campos de Preenchimento</Label>
              
              {abas.length > 1 ? (
                <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
                  <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-lg">
                    {abas.map((aba) => (
                      <TabsTrigger 
                        key={aba.id} 
                        value={aba.id}
                        className="flex-1 min-w-fit px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:hover:bg-muted data-[state=inactive]:text-muted-foreground rounded-md"
                      >
                        {aba.nome}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {abas.map((aba) => (
                    <TabsContent key={aba.id} value={aba.id} className="space-y-3 mt-3">
                      {getCamposVisiveis(aba.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum campo nesta aba
                        </p>
                      ) : (
                        getCamposVisiveis(aba.id).map((campo) => (
                          <div key={campo.id_campo} className="space-y-2">
                            <Label className="flex flex-wrap items-center gap-1 text-sm">
                              {campo.nome_campo}
                              {(campo.obrigatorio_criacao || campo.complementa_nome) && (
                                <span className="text-destructive">*</span>
                              )}
                              {campo.complementa_nome && (
                                <span className="text-xs text-muted-foreground">
                                  (complementa nome)
                                </span>
                              )}
                            </Label>
                            {renderCampoInput(campo)}
                          </div>
                        ))
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                // Se só tem uma aba, mostra sem tabs
                <div className="space-y-3">
                  {getCamposVisiveis(abas[0]?.id || "geral").map((campo) => (
                    <div key={campo.id_campo} className="space-y-2">
                      <Label className="flex flex-wrap items-center gap-1 text-sm">
                        {campo.nome_campo}
                        {(campo.obrigatorio_criacao || campo.complementa_nome) && (
                          <span className="text-destructive">*</span>
                        )}
                        {campo.complementa_nome && (
                          <span className="text-xs text-muted-foreground">
                            (complementa nome)
                          </span>
                        )}
                      </Label>
                      {renderCampoInput(campo)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">Criar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
