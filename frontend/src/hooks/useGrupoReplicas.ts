/**
 * useGrupoReplicas - Hook para gerenciamento de réplicas de grupos de campos
 * 
 * Gerencia a quantidade de réplicas de cada grupo e os valores dos campos
 * dentro dessas réplicas.
 */

import { useState, useCallback } from "react";
import type { CampoPreenchimento } from "@/types";

interface UseGrupoReplicasOptions {
  /** Campos do template (para inicializar grupos) */
  templateCampos?: CampoPreenchimento[];
  /** Valores iniciais dos campos (para detectar réplicas existentes) */
  initialValues?: Record<string, string>;
}

interface UseGrupoReplicasReturn {
  /** Estado das réplicas por grupo (grupoId -> quantidade) */
  grupoReplicas: Record<string, number>;
  /** Atualiza a quantidade de réplicas de um grupo */
  handleReplicaChange: (
    grupoId: string,
    newCount: number,
    camposValores: Record<string, string>,
    setCamposValores: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    grupo?: CampoPreenchimento
  ) => void;
  /** Inicializa as réplicas baseado nos valores existentes */
  initializeReplicas: (
    campos: CampoPreenchimento[],
    camposPreenchidos?: Array<{ id_campo: string; valor: string }>
  ) => { replicas: Record<string, number>; valores: Record<string, string> };
  /** Setter direto para grupoReplicas */
  setGrupoReplicas: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

/**
 * Detecta a quantidade de réplicas de cada grupo baseado nos campos salvos
 */
function detectarReplicasGrupos(
  camposPreenchidos: Array<{ id_campo: string; valor: string }>,
  templateCampos: CampoPreenchimento[]
): Record<string, number> {
  const replicas: Record<string, number> = {};

  for (const campo of templateCampos) {
    if (campo.tipo_campo === "grupo" && campo.campos) {
      // Encontrar o maior índice de réplica para este grupo
      let maxIndex = 0;
      for (const campoFilho of campo.campos) {
        const regex = new RegExp(`^${campoFilho.id_campo}__(\\d+)$`);
        for (const preenchido of camposPreenchidos) {
          const match = preenchido.id_campo.match(regex);
          if (match) {
            const index = parseInt(match[1], 10);
            if (index >= maxIndex) {
              maxIndex = index + 1;
            }
          }
        }
      }
      replicas[campo.id_campo] = maxIndex || (campo.quantidade_replicas_padrao || 1);
    }
  }

  return replicas;
}

export function useGrupoReplicas(options: UseGrupoReplicasOptions = {}): UseGrupoReplicasReturn {
  const [grupoReplicas, setGrupoReplicas] = useState<Record<string, number>>({});

  /**
   * Atualiza a quantidade de réplicas de um grupo
   * Gerencia automaticamente a adição/remoção de campos
   */
  const handleReplicaChange = useCallback(
    (
      grupoId: string,
      newCount: number,
      camposValores: Record<string, string>,
      setCamposValores: React.Dispatch<React.SetStateAction<Record<string, string>>>,
      grupo?: CampoPreenchimento
    ) => {
      const oldCount = grupoReplicas[grupoId] || 1;
      const camposFilhos = grupo?.campos || [];

      const newValues = { ...camposValores };

      if (newCount > oldCount) {
        // Adicionar campos para novas réplicas
        camposFilhos.forEach((campoFilho) => {
          for (let i = oldCount; i < newCount; i++) {
            newValues[`${campoFilho.id_campo}__${i}`] = "";
          }
        });
      } else if (newCount < oldCount) {
        // Remover campos das réplicas removidas
        camposFilhos.forEach((campoFilho) => {
          for (let i = newCount; i < oldCount; i++) {
            delete newValues[`${campoFilho.id_campo}__${i}`];
          }
        });
      }

      setCamposValores(newValues);
      setGrupoReplicas((prev) => ({ ...prev, [grupoId]: newCount }));
    },
    [grupoReplicas]
  );

  /**
   * Inicializa as réplicas e valores baseado nos campos do template
   * e nos valores já preenchidos (se existirem)
   */
  const initializeReplicas = useCallback(
    (
      campos: CampoPreenchimento[],
      camposPreenchidos?: Array<{ id_campo: string; valor: string }>
    ): { replicas: Record<string, number>; valores: Record<string, string> } => {
      const valores: Record<string, string> = {};
      const replicas: Record<string, number> = {};

      // Se há campos preenchidos, detectar réplicas existentes
      if (camposPreenchidos && camposPreenchidos.length > 0) {
        // Converter array para objeto
        camposPreenchidos.forEach((campo) => {
          valores[campo.id_campo] = campo.valor;
        });
        // Detectar réplicas
        Object.assign(replicas, detectarReplicasGrupos(camposPreenchidos, campos));
      } else {
        // Inicializar com valores padrão
        campos.forEach((campo) => {
          if (campo.tipo_campo === "grupo") {
            const qtdReplicas = campo.quantidade_replicas_padrao || 1;
            replicas[campo.id_campo] = qtdReplicas;

            // Inicializar valores dos campos filhos para cada réplica
            (campo.campos || []).forEach((campoFilho) => {
              for (let i = 0; i < qtdReplicas; i++) {
                valores[`${campoFilho.id_campo}__${i}`] = "";
              }
            });
          } else {
            valores[campo.id_campo] = "";
          }
        });
      }

      return { replicas, valores };
    },
    []
  );

  return {
    grupoReplicas,
    handleReplicaChange,
    initializeReplicas,
    setGrupoReplicas,
  };
}

