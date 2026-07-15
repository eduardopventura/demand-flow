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

/**
 * Coage o valor (string) de um campo da demanda para o tipo esperado pela API alvo.
 * Retorna `undefined` para valores vazios — assim campos opcionais são omitidos do payload
 * (importante para não enviar strings vazias em campos opcionais do endpoint do kumon).
 * @param {string} valor - Valor bruto do campo (sempre string na demanda)
 * @param {string} tipoCampo - Tipo do campo da Ação (texto, numero, numero_decimal, data, booleano, ...)
 * @returns {*} - Valor coagido, ou undefined se vazio/ inválido
 */
function coagirValor(valor, tipoCampo) {
  if (valor === null || valor === undefined) return undefined;
  const str = String(valor).trim();
  if (str === '') return undefined;

  switch (tipoCampo) {
    case 'numero': {
      const n = parseInt(str, 10);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'dias_semana': {
      // Dia da semana canônico (0=Domingo ... 6=Sábado); a UI já envia o número.
      const n = parseInt(str, 10);
      return Number.isNaN(n) || n < 0 || n > 6 ? undefined : n;
    }
    case 'numero_decimal': {
      // Aceita vírgula decimal (pt-BR) além de ponto
      const n = parseFloat(str.replace(',', '.'));
      return Number.isNaN(n) ? undefined : n;
    }
    case 'booleano': {
      return ['true', 'sim', '1', 'x', 'verdadeiro'].includes(str.toLowerCase());
    }
    case 'data': {
      // Normaliza para "YYYY-MM-DD". Aceita já-ISO ou "DD/MM/YYYY".
      const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
      const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (br) return `${br[3]}-${br[2]}-${br[1]}`;
      return str; // deixa o backend do kumon validar/rejeitar formatos inesperados
    }
    default:
      // texto, dropdown, uuid, etc.
      return str;
  }
}

/**
 * Define um valor em um objeto seguindo um caminho com segmentos e índices de array.
 * Ex.: setByPath(obj, 'guardians[0].email', 'x') => obj.guardians[0].email = 'x'
 * Cria objetos/arrays intermediários conforme necessário.
 * @param {Object} obj - Objeto raiz a ser mutado
 * @param {string} caminho - Caminho dotted com suporte a [n] (ex.: 'enrollments[0].disciplineId')
 * @param {*} valor - Valor a definir
 */
function setByPath(obj, caminho, valor) {
  // Transforma "guardians[0].email" em ['guardians', 0, 'email']
  const tokens = [];
  for (const parte of String(caminho).split('.')) {
    const regex = /([^[\]]+)|\[(\d+)\]/g;
    let match;
    while ((match = regex.exec(parte)) !== null) {
      if (match[1] !== undefined) tokens.push(match[1]);
      else tokens.push(parseInt(match[2], 10));
    }
  }
  if (tokens.length === 0) return;

  let atual = obj;
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const proximoEhIndice = typeof tokens[i + 1] === 'number';
    if (atual[token] === undefined || atual[token] === null) {
      atual[token] = proximoEhIndice ? [] : {};
    }
    atual = atual[token];
  }
  atual[tokens[tokens.length - 1]] = valor;
}

module.exports = {
  buscarValorCampo,
  buscarValoresCampoGrupo,
  sanitizarNomeCampo,
  mapearCamposParaAcao,
  coagirValor,
  setByPath,
};

