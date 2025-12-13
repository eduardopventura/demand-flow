/**
 * useCamposForm - Hook para gerenciamento de formulário de campos
 * 
 * Gerencia o estado dos valores dos campos, visibilidade condicional,
 * ordenação por aba e validação.
 */

import { useState, useCallback, useMemo } from "react";
import type { CampoPreenchimento, Template, AbaTemplate } from "@/types";
import { avaliarCondicaoVisibilidade, ordenarCamposPorAba } from "@/utils/campoUtils";

interface UseCamposFormOptions {
  /** Template selecionado */
  template?: Template | null;
  /** Valores iniciais dos campos */
  initialValues?: Record<string, string>;
}

interface UseCamposFormReturn {
  /** Valores dos campos */
  camposValores: Record<string, string>;
  /** Setter para valores dos campos */
  setCamposValores: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** Atualiza o valor de um campo */
  handleCampoChange: (idCampo: string, valor: string) => void;
  /** Retorna os campos visíveis para uma aba específica */
  getCamposVisiveis: (abaId: string) => CampoPreenchimento[];
  /** Abas do template (com fallback para aba Geral) */
  abas: AbaTemplate[];
  /** Aba atualmente selecionada */
  abaAtiva: string;
  /** Setter para aba ativa */
  setAbaAtiva: React.Dispatch<React.SetStateAction<string>>;
  /** Valida campos obrigatórios e retorna campos faltando */
  validarCamposObrigatorios: (grupoReplicas?: Record<string, number>) => {
    valido: boolean;
    camposFaltando: string[];
  };
}

const ABA_GERAL_DEFAULT: AbaTemplate = { id: "geral", nome: "Geral", ordem: 0 };

export function useCamposForm(options: UseCamposFormOptions = {}): UseCamposFormReturn {
  const { template, initialValues = {} } = options;

  const [camposValores, setCamposValores] = useState<Record<string, string>>(initialValues);
  const [abaAtiva, setAbaAtiva] = useState<string>("geral");

  // Abas do template (com fallback para aba Geral)
  const abas = useMemo<AbaTemplate[]>(() => {
    if (!template?.abas?.length) {
      return [ABA_GERAL_DEFAULT];
    }
    return [...template.abas].sort((a, b) => a.ordem - b.ordem);
  }, [template]);

  // Atualiza o valor de um campo
  const handleCampoChange = useCallback((idCampo: string, valor: string) => {
    setCamposValores((prev) => ({ ...prev, [idCampo]: valor }));
  }, []);

  // Retorna os campos visíveis para uma aba específica
  const getCamposVisiveis = useCallback(
    (abaId: string): CampoPreenchimento[] => {
      if (!template) return [];

      // Primeiro ordenar por aba
      const camposOrdenados = ordenarCamposPorAba(template.campos_preenchimento, abaId);

      // Depois filtrar por visibilidade (não aplicável para grupos)
      return camposOrdenados.filter((campo) => {
        if (campo.tipo_campo !== "grupo") {
          return avaliarCondicaoVisibilidade(campo.condicao_visibilidade, camposValores);
        }
        return true;
      });
    },
    [template, camposValores]
  );

  // Valida campos obrigatórios
  const validarCamposObrigatorios = useCallback(
    (grupoReplicas?: Record<string, number>): { valido: boolean; camposFaltando: string[] } => {
      if (!template) return { valido: true, camposFaltando: [] };

      const camposFaltando: string[] = [];

      // Validar campos simples obrigatórios (somente os visíveis e não grupos)
      const camposObrigatorios = template.campos_preenchimento.filter(
        (c) =>
          c.tipo_campo !== "grupo" &&
          c.obrigatorio_criacao &&
          avaliarCondicaoVisibilidade(c.condicao_visibilidade, camposValores)
      );

      for (const campo of camposObrigatorios) {
        if (!camposValores[campo.id_campo]?.trim()) {
          camposFaltando.push(campo.nome_campo);
        }
      }

      // Validar campos obrigatórios dentro de grupos
      if (grupoReplicas) {
        for (const campo of template.campos_preenchimento) {
          if (campo.tipo_campo === "grupo") {
            const qtdReplicas = grupoReplicas[campo.id_campo] || 1;
            for (const campoFilho of campo.campos || []) {
              if (campoFilho.obrigatorio_criacao) {
                for (let i = 0; i < qtdReplicas; i++) {
                  const key = `${campoFilho.id_campo}__${i}`;
                  if (!camposValores[key]?.trim()) {
                    camposFaltando.push(`${campoFilho.nome_campo} (${campo.nome_campo} #${i + 1})`);
                  }
                }
              }
            }
          }
        }
      }

      // Verificar campo "complementa_nome"
      const campoComplementaNome = template.campos_preenchimento.find(
        (c) => c.complementa_nome && c.tipo_campo !== "grupo"
      );

      if (campoComplementaNome && !camposValores[campoComplementaNome.id_campo]?.trim()) {
        if (!camposFaltando.includes(campoComplementaNome.nome_campo)) {
          camposFaltando.push(campoComplementaNome.nome_campo);
        }
      }

      return {
        valido: camposFaltando.length === 0,
        camposFaltando,
      };
    },
    [template, camposValores]
  );

  return {
    camposValores,
    setCamposValores,
    handleCampoChange,
    getCamposVisiveis,
    abas,
    abaAtiva,
    setAbaAtiva,
    validarCamposObrigatorios,
  };
}

