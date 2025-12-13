/**
 * GrupoCampos - Componente reutilizável para renderização de grupos de campos
 * 
 * Renderiza campos agrupados com suporte a múltiplas réplicas,
 * controle de quantidade e layout responsivo.
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CampoInput } from "./CampoInput";
import { Layers, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampoPreenchimento } from "@/types";
import { avaliarCondicaoVisibilidade } from "@/utils/campoUtils";

interface GrupoCamposProps {
  /** Definição do grupo de campos */
  grupo: CampoPreenchimento;
  /** Quantidade atual de réplicas */
  qtdReplicas: number;
  /** Objeto com valores dos campos (fieldKey -> valor) */
  camposValores: Record<string, string>;
  /** Callback quando o valor de um campo muda */
  onCampoChange: (fieldKey: string, valor: string) => void;
  /** Callback quando a quantidade de réplicas muda */
  onReplicaChange: (grupoId: string, qtd: number) => void;
  /** Se deve mostrar indicador de obrigatório nos campos */
  showObrigatorio?: boolean;
  /** Se está em modo de visualização (sem labels de obrigatório) */
  viewMode?: boolean;
}

export const GrupoCampos = memo(function GrupoCampos({
  grupo,
  qtdReplicas,
  camposValores,
  onCampoChange,
  onReplicaChange,
  showObrigatorio = true,
  viewMode = false,
}: GrupoCamposProps) {
  const camposFilhos = grupo.campos || [];

  return (
    <div className="p-4 rounded-lg border-2 border-dashed bg-muted/20 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">{grupo.nome_campo}</span>
        </div>

        {/* Controle de quantidade de réplicas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Quantidade:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => onReplicaChange(grupo.id_campo, Math.max(1, qtdReplicas - 1))}
              disabled={qtdReplicas <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Input
              type="number"
              min={1}
              max={20}
              value={qtdReplicas}
              onChange={(e) =>
                onReplicaChange(
                  grupo.id_campo,
                  Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                )
              }
              className="w-14 h-7 text-center"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => onReplicaChange(grupo.id_campo, Math.min(20, qtdReplicas + 1))}
              disabled={qtdReplicas >= 20}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Réplicas do grupo */}
      <div className="space-y-4">
        {Array.from({ length: qtdReplicas }, (_, replicaIndex) => (
          <div
            key={replicaIndex}
            className={cn(
              "p-3 rounded-lg border bg-background space-y-3",
              qtdReplicas > 1 && "relative"
            )}
          >
            {qtdReplicas > 1 && (
              <div className="absolute -top-2 left-3 px-2 bg-primary text-primary-foreground text-xs rounded-full">
                {replicaIndex + 1}
              </div>
            )}

            {/* Campos do grupo em 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {camposFilhos
                .map((campoFilho) => {
                  const fieldKey = `${campoFilho.id_campo}__${replicaIndex}`;
                  
                  // Criar um objeto de valores para esta réplica específica
                  // Para avaliar condições de visibilidade, precisamos buscar valores dos campos do mesmo grupo e mesma réplica
                  const valoresReplica: Record<string, string> = {};
                  camposFilhos.forEach((cf) => {
                    const key = `${cf.id_campo}__${replicaIndex}`;
                    valoresReplica[cf.id_campo] = camposValores[key] || "";
                  });
                  
                  // Verificar condição de visibilidade
                  const isVisible = avaliarCondicaoVisibilidade(campoFilho.condicao_visibilidade, valoresReplica);
                  
                  if (!isVisible) {
                    return null;
                  }
                  
                  return (
                    <div key={fieldKey} className="space-y-1">
                      <Label className={cn("flex items-center gap-1", viewMode ? "text-xs" : "text-xs")}>
                        {campoFilho.nome_campo}
                        {showObrigatorio && !viewMode && campoFilho.obrigatorio_criacao && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      <CampoInput
                        campo={campoFilho}
                        value={camposValores[fieldKey] || ""}
                        onChange={(valor) => onCampoChange(fieldKey, valor)}
                        showCurrentValue={campoFilho.tipo_campo === "arquivo"}
                      />
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

