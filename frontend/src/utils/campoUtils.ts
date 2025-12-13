/**
 * Utilitários para manipulação de campos de preenchimento
 */

import type { CondicaoVisibilidade, CampoPreenchimento } from "@/types";

/**
 * Avalia se um campo deve ser visível baseado na sua condição de visibilidade
 * @param condicao - Condição de visibilidade do campo (opcional)
 * @param camposValores - Objeto com os valores dos campos preenchidos
 * @returns true se o campo deve ser exibido, false caso contrário
 */
export const avaliarCondicaoVisibilidade = (
  condicao: CondicaoVisibilidade | undefined,
  camposValores: Record<string, string>
): boolean => {
  if (!condicao) return true; // Sem condição = sempre visível

  const valorCampoPai = camposValores[condicao.campo_id] || "";

  switch (condicao.operador) {
    case "igual":
      return valorCampoPai === condicao.valor;
    case "diferente":
      // Se o campo pai estiver vazio, não aplicar a regra (retornar false)
      if (valorCampoPai.trim() === "") {
        return false;
      }
      return valorCampoPai !== condicao.valor;
    case "preenchido":
      return valorCampoPai.trim() !== "";
    case "vazio":
      return valorCampoPai.trim() === "";
    default:
      return true;
  }
};

/**
 * Ordena os campos de acordo com a ordem específica de uma aba
 * Se o campo não tiver ordem definida para a aba, usa a posição original no array
 * @param campos - Array de campos a ordenar
 * @param abaId - ID da aba para a qual ordenar
 * @returns Array de campos ordenados para a aba específica
 */
export const ordenarCamposPorAba = (
  campos: CampoPreenchimento[],
  abaId: string
): CampoPreenchimento[] => {
  // Filtrar apenas campos que pertencem à aba
  const camposDaAba = campos.filter(c => c.abas_ids?.includes(abaId));
  
  // Ordenar por ordem_abas[abaId] se existir, senão mantém ordem original (índice no array filtrado)
  return [...camposDaAba].sort((a, b) => {
    const ordemA = a.ordem_abas?.[abaId] ?? Infinity;
    const ordemB = b.ordem_abas?.[abaId] ?? Infinity;
    
    // Se ambos têm ordem indefinida, manter ordem original
    if (ordemA === Infinity && ordemB === Infinity) {
      return camposDaAba.indexOf(a) - camposDaAba.indexOf(b);
    }
    
    return ordemA - ordemB;
  });
};

/**
 * Busca o valor de um campo, considerando campos de grupo
 * Para campos de grupo (sem sufixo __N), busca todos os valores de todos os blocos
 * @param camposValores - Objeto com os valores dos campos (id_campo -> valor)
 * @param campoId - ID do campo a buscar
 * @returns Valor do campo ou undefined se não encontrado
 */
export const buscarValorCampo = (
  camposValores: Record<string, string>,
  campoId: string
): string | undefined => {
  // Tentar busca direta (campo normal)
  const valorDireto = camposValores[campoId];
  if (valorDireto !== undefined) {
    return valorDireto;
  }

  // Se não encontrou, verificar se é um campo de grupo (buscar com sufixo __0, __1, etc.)
  const regex = new RegExp(`^${campoId}__(\\d+)$`);
  for (const [key, valor] of Object.entries(camposValores)) {
    if (regex.test(key) && valor && valor.trim() !== "") {
      return valor; // Retorna o primeiro valor preenchido encontrado
    }
  }

  return undefined;
};

/**
 * Busca todos os valores de um campo de grupo como array
 * @param camposValores - Objeto com os valores dos campos
 * @param campoId - ID do campo base (sem sufixo __N)
 * @returns Array de valores do grupo
 */
export const buscarValoresCampoGrupo = (
  camposValores: Record<string, string>,
  campoId: string
): string[] => {
  const regex = new RegExp(`^${campoId}__(\\d+)$`);
  const valoresGrupo: string[] = [];

  for (const [key, valor] of Object.entries(camposValores)) {
    const match = key.match(regex);
    if (match) {
      const index = parseInt(match[1], 10);
      valoresGrupo[index] = valor || "";
    }
  }

  return valoresGrupo;
};

