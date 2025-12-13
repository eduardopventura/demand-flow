import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { CampoPreenchimento } from "@/types";
import { avaliarCondicaoVisibilidade, ordenarCamposPorAba } from "@/utils/campoUtils";
import { StickyTabs } from "@/components/StickyTabs";
import { CampoInput, ResponsavelSelect, GrupoCampos } from "@/components/form";
import { cn } from "@/lib/utils";

interface NovaDemandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovaDemandaModal = ({ open, onOpenChange }: NovaDemandaModalProps) => {
  const { templates, addDemanda, getTemplate } = useData();
  const [templateId, setTemplateId] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [camposValores, setCamposValores] = useState<Record<string, string>>({});
  const [abaAtiva, setAbaAtiva] = useState<string>("geral");
  const [grupoReplicas, setGrupoReplicas] = useState<Record<string, number>>({});
  
  const tabsSentinelRef = useRef<HTMLDivElement>(null);

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
      const initialReplicas: Record<string, number> = {};
      
      templateSelecionado.campos_preenchimento.forEach((campo) => {
        if (campo.tipo_campo === "grupo") {
          // Inicializar réplicas do grupo
          const qtdReplicas = campo.quantidade_replicas_padrao || 1;
          initialReplicas[campo.id_campo] = qtdReplicas;
          
          // Inicializar valores dos campos filhos para cada réplica
          (campo.campos || []).forEach((campoFilho) => {
            for (let i = 0; i < qtdReplicas; i++) {
              initialValues[`${campoFilho.id_campo}__${i}`] = "";
            }
          });
        } else {
          initialValues[campo.id_campo] = "";
        }
      });
      
      setCamposValores(initialValues);
      setGrupoReplicas(initialReplicas);
      
      // Selecionar primeira aba
      if (abas.length > 0) {
        setAbaAtiva(abas[0].id);
      }
    }
  }, [templateSelecionado, abas]);

  // Atualizar valores quando número de réplicas muda
  const handleReplicaChange = (grupoId: string, newCount: number) => {
    const grupo = templateSelecionado?.campos_preenchimento.find(c => c.id_campo === grupoId);
    if (!grupo || grupo.tipo_campo !== "grupo") return;
    
    const oldCount = grupoReplicas[grupoId] || 1;
    const newValues = { ...camposValores };
    
    if (newCount > oldCount) {
      // Adicionar campos para novas réplicas
      (grupo.campos || []).forEach((campoFilho) => {
        for (let i = oldCount; i < newCount; i++) {
          newValues[`${campoFilho.id_campo}__${i}`] = "";
        }
      });
    } else if (newCount < oldCount) {
      // Remover campos das réplicas removidas
      (grupo.campos || []).forEach((campoFilho) => {
        for (let i = newCount; i < oldCount; i++) {
          delete newValues[`${campoFilho.id_campo}__${i}`];
        }
      });
    }
    
    setCamposValores(newValues);
    setGrupoReplicas({ ...grupoReplicas, [grupoId]: newCount });
  };

  // Filtrar e ordenar campos visíveis para uma aba específica
  const getCamposVisiveis = (abaId: string): CampoPreenchimento[] => {
    if (!templateSelecionado) return [];

    // Primeiro ordenar por aba
    const camposOrdenados = ordenarCamposPorAba(templateSelecionado.campos_preenchimento, abaId);

    // Depois filtrar por visibilidade
    return camposOrdenados.filter((campo) => {
      // Verificar condição de visibilidade (não aplicável para grupos)
      if (campo.tipo_campo !== "grupo") {
        return avaliarCondicaoVisibilidade(campo.condicao_visibilidade, camposValores);
      }
      
      return true;
    });
  };

  // Validar se há campos obrigatórios não preenchidos em uma aba
  const validarAba = (abaId: string): { valido: boolean; temObrigatorios: boolean } => {
    if (!templateSelecionado) return { valido: true, temObrigatorios: false };

    const camposVisiveis = getCamposVisiveis(abaId);
    let temObrigatorios = false;
    let todosPreenchidos = true;

    for (const campo of camposVisiveis) {
      if (campo.tipo_campo === "grupo") {
        // Verificar campos dentro do grupo
        const qtdReplicas = grupoReplicas[campo.id_campo] || 1;
        for (const campoFilho of campo.campos || []) {
          if (campoFilho.obrigatorio_criacao) {
            temObrigatorios = true;
            for (let i = 0; i < qtdReplicas; i++) {
              const key = `${campoFilho.id_campo}__${i}`;
              if (!camposValores[key]?.trim()) {
                todosPreenchidos = false;
                break;
              }
            }
            if (!todosPreenchidos) break;
          }
        }
      } else {
        // Verificar campo simples
        if (campo.obrigatorio_criacao || campo.complementa_nome) {
          temObrigatorios = true;
          if (!camposValores[campo.id_campo]?.trim()) {
            todosPreenchidos = false;
            break;
          }
        }
      }
      if (!todosPreenchidos) break;
    }

    return { valido: todosPreenchidos, temObrigatorios };
  };

  const handleCampoChange = (idCampo: string, valor: string) => {
    setCamposValores({ ...camposValores, [idCampo]: valor });
  };

  const handleSubmit = () => {
    if (!templateId || !responsavelId) {
      toast.error("Selecione um template e um responsável");
      return;
    }

    if (!templateSelecionado) return;

    // Validar campos obrigatórios (somente os visíveis e não grupos)
    const camposObrigatorios = templateSelecionado.campos_preenchimento.filter(
      (c) => c.tipo_campo !== "grupo" && c.obrigatorio_criacao && avaliarCondicaoVisibilidade(c.condicao_visibilidade, camposValores)
    );
    const camposFaltando = camposObrigatorios.filter((c) => !camposValores[c.id_campo]?.trim());

    if (camposFaltando.length > 0) {
      toast.error(`Preencha todos os campos obrigatórios`);
      return;
    }

    // Validar campos obrigatórios dentro de grupos
    for (const campo of templateSelecionado.campos_preenchimento) {
      if (campo.tipo_campo === "grupo") {
        const qtdReplicas = grupoReplicas[campo.id_campo] || 1;
        for (const campoFilho of (campo.campos || [])) {
          if (campoFilho.obrigatorio_criacao) {
            for (let i = 0; i < qtdReplicas; i++) {
              const key = `${campoFilho.id_campo}__${i}`;
              if (!camposValores[key]?.trim()) {
                toast.error(`Preencha o campo "${campoFilho.nome_campo}" no grupo "${campo.nome_campo}" (bloco ${i + 1})`);
                return;
              }
            }
          }
        }
      }
    }

    // Verificar se campo "complementa_nome" está preenchido
    const campoComplementaNome = templateSelecionado.campos_preenchimento.find(
      (c) => c.complementa_nome && c.tipo_campo !== "grupo"
    );
    
    if (campoComplementaNome && !camposValores[campoComplementaNome.id_campo]?.trim()) {
      toast.error(`O campo "${campoComplementaNome.nome_campo}" é obrigatório`);
      return;
    }

    // Enviar para o backend (que calcula nome_demanda, data_previsao, tarefas_status, etc.)
    // O backend processa via POST /api/demandas e converte campos_preenchidos automaticamente
    addDemanda({
      template_id: templateId,
      responsavel_id: responsavelId,
      campos_preenchidos: Object.entries(camposValores).map(([id_campo, valor]) => ({
        id_campo,
        valor,
      })),
    } as any); // Type assertion: backend aceita formato simplificado

    onOpenChange(false);
    
    // Reset
    setTemplateId("");
    setResponsavelId("");
    setCamposValores({});
    setGrupoReplicas({});
  };

  // Renderizar um campo (simples ou grupo)
  const renderCampo = (campo: CampoPreenchimento) => {
    if (campo.tipo_campo === "grupo") {
      return renderGrupo(campo);
    }
    
    return (
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
        <CampoInput
          campo={campo}
          value={camposValores[campo.id_campo] || ""}
          onChange={(valor) => handleCampoChange(campo.id_campo, valor)}
        />
      </div>
    );
  };

  // Renderizar um grupo com réplicas usando o componente GrupoCampos
  const renderGrupo = (grupo: CampoPreenchimento) => (
    <GrupoCampos
      grupo={grupo}
      qtdReplicas={grupoReplicas[grupo.id_campo] || 1}
      camposValores={camposValores}
      onCampoChange={handleCampoChange}
      onReplicaChange={handleReplicaChange}
      showObrigatorio={true}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-muted/30">
          <DialogTitle className="text-lg sm:text-xl">Nova Demanda</DialogTitle>
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
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Configuração</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <ResponsavelSelect
                  value={responsavelId}
                  onValueChange={setResponsavelId}
                />
              </div>
            </div>

            {templateSelecionado && (
              <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Tempo Médio:</strong> {templateSelecionado.tempo_medio || 7} dias
                </p>
              </div>
            )}
          </div>

          {/* Seção: Campos de Preenchimento */}
          {templateSelecionado && templateSelecionado.campos_preenchimento.length > 0 && (
            <div className="p-4 rounded-lg border bg-card space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Campos de Preenchimento</h3>
              
              {/* Sentinel para StickyTabs */}
              <div ref={tabsSentinelRef} />
              
              {abas.length > 1 ? (
                <Tabs value={abaAtiva} onValueChange={setAbaAtiva}>
                  <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-lg border">
                    {abas.map((aba) => {
                      const validacaoAba = validarAba(aba.id);
                      return (
                        <TabsTrigger 
                          key={aba.id} 
                          value={aba.id}
                          className="flex-1 min-w-fit px-4 py-2 text-sm font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=inactive]:text-muted-foreground rounded-md relative"
                        >
                          {aba.nome}
                          {validacaoAba.temObrigatorios && (
                            <span
                              className={cn(
                                "absolute -top-1 -right-1 text-xs font-bold",
                                validacaoAba.valido ? "text-green-500" : "text-red-500"
                              )}
                            >
                              *
                            </span>
                          )}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  
                  {abas.map((aba) => (
                    <TabsContent key={aba.id} value={aba.id} className="mt-4 space-y-4">
                      {getCamposVisiveis(aba.id).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-background">
                          Nenhum campo nesta aba
                        </p>
                      ) : (
                        getCamposVisiveis(aba.id).map((campo) => renderCampo(campo))
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                // Se só tem uma aba, mostra sem tabs
                <div className="space-y-4">
                  {getCamposVisiveis(abas[0]?.id || "geral").map((campo) => renderCampo(campo))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">Criar Demanda</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
