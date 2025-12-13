/**
 * Campo Utils - Utilitários para manipulação de campos de demanda
 * 
 * Funções para buscar e mapear valores de campos, incluindo
 * suporte a campos de grupo com múltiplas réplicas
 */

/**
 * Busca o valor de um campo, considerando campos de grupo
 * Para campos de grupo (sem sufixo __N), busca todos os valores de todos os blocos
 * e retorna como lista separada por vírgula
 * @param {Array} camposPreenchidos - Array de campos preenchidos da demanda
 * @param {string} campoId - ID do campo a buscar
 * @returns {string} - Valor do campo ou lista de valores separados por vírgula
 */
function buscarValorCampo(camposPreenchidos, campoId) {
  // Primeiro, tentar busca direta (campo normal)
  const campoDirecto = camposPreenchidos.find(c => c.id_campo === campoId);
  if (campoDirecto) {
    return campoDirecto.valor || '';
  }
  
  // Se não encontrou, pode ser um campo de grupo - buscar todos os blocos
  // Campos de grupo são salvos como: campoId__0, campoId__1, campoId__2, etc.
  const regex = new RegExp(`^${campoId}__(\\d+)$`);
  const valoresGrupo = [];
  
  for (const campo of camposPreenchidos) {
    const match = campo.id_campo.match(regex);
    if (match) {
      const index = parseInt(match[1], 10);
      valoresGrupo[index] = campo.valor || '';
    }
  }
  
  // Se encontrou valores de grupo, retornar como lista
  if (valoresGrupo.length > 0) {
    // Filtrar valores vazios e juntar com vírgula
    return valoresGrupo.filter(v => v && v.trim()).join(', ');
  }
  
  return '';
}

/**
 * Busca todos os valores de um campo de grupo como array
 * @param {Array} camposPreenchidos - Array de campos preenchidos da demanda
 * @param {string} campoId - ID do campo base (sem sufixo __N)
 * @returns {Array<string>} - Array de valores do grupo
 */
function buscarValoresCampoGrupo(camposPreenchidos, campoId) {
  const regex = new RegExp(`^${campoId}__(\\d+)$`);
  const valoresGrupo = [];
  
  for (const campo of camposPreenchidos) {
    const match = campo.id_campo.match(regex);
    if (match) {
      const index = parseInt(match[1], 10);
      valoresGrupo[index] = campo.valor || '';
    }
  }
  
  return valoresGrupo;
}

/**
 * Sanitiza nome de campo para uso em payloads
 * Remove espaços e caracteres especiais
 * @param {string} nome - Nome do campo
 * @returns {string} - Nome sanitizado
 */
function sanitizarNomeCampo(nome) {
  return nome.replace(/\s+/g, '_');
}

/**
 * Mapeia campos da demanda para os campos da ação
 * @param {Object} demanda - Demanda com campos_preenchidos
 * @param {Object} acao - Ação com campos definidos
 * @param {Object} mapeamento - Mapeamento de campos (campoAcaoId -> campoDemandaId)
 * @returns {Object} - { payload, hasFile, fileField, filePath }
 */
function mapearCamposParaAcao(demanda, acao, mapeamento = {}) {
  const payload = {};
  let hasFile = false;
  let fileField = null;
  let filePath = null;

  for (const campoAcao of acao.campos) {
    const campoOrigemId = mapeamento[campoAcao.id_campo];
    
    if (campoOrigemId) {
      const valor = buscarValorCampo(demanda.campos_preenchidos, campoOrigemId);
      
      const nomeCampoSanitizado = sanitizarNomeCampo(campoAcao.nome_campo);
      
      if (campoAcao.tipo_campo === 'arquivo' && valor) {
        hasFile = true;
        fileField = nomeCampoSanitizado;
        filePath = valor;
      } else {
        payload[nomeCampoSanitizado] = valor;
      }
    }
  }

  return { payload, hasFile, fileField, filePath };
}

module.exports = {
  buscarValorCampo,
  buscarValoresCampoGrupo,
  sanitizarNomeCampo,
  mapearCamposParaAcao
};

