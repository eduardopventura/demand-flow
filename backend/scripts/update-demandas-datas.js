/**
 * Script de Atualização de Datas de Demandas
 * 
 * Atualiza as datas de criação e finalização de demandas conforme
 * especificado no arquivo mudança_data
 * 
 * Usage:
 *   node scripts/update-demandas-datas.js
 * 
 * O arquivo mudança_data deve estar na raiz do projeto ou copiado para /app/mudança_data
 */

require('dotenv').config({ path: '/app/.env' });
const fs = require('fs');
const path = require('path');
const { prisma } = require('../src/database/client');

/**
 * Converte data no formato DD/MM/YYYY para objeto Date
 * Cria a data como meia-noite em São Paulo (UTC-3)
 * Usa string ISO com timezone explícito para garantir o dia correto
 * @param {string} dataStr - Data no formato DD/MM/YYYY
 * @returns {Date} - Objeto Date no início do dia (00:00:00) no timezone de São Paulo
 */
function converterData(dataStr) {
  if (!dataStr || !dataStr.trim()) {
    return null;
  }

  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) {
    throw new Error(`Formato de data inválido: ${dataStr}. Esperado DD/MM/YYYY`);
  }

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const ano = parseInt(partes[2], 10);

  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
    throw new Error(`Data inválida: ${dataStr}`);
  }

  // Validar se a data é válida
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    throw new Error(`Data inválida: ${dataStr}`);
  }

  // Criar data usando string ISO com timezone de São Paulo (UTC-3)
  // Isso garante que a data seja interpretada como meia-noite em SP
  // Quando salva no PostgreSQL, será convertida para UTC automaticamente
  // Exemplo: 16/12/2025 00:00:00-03:00 = 16/12/2025 03:00:00 UTC
  const dataISO = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}T00:00:00-03:00`;
  const data = new Date(dataISO);
  
  // Validar se a data foi criada corretamente
  // Verificar se quando formatada em SP, mostra o dia correto
  const dataFormatadaSP = data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const dataEsperada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
  
  if (dataFormatadaSP !== dataEsperada) {
    throw new Error(`Data inválida ou inconsistente: ${dataStr} (resultado: ${dataFormatadaSP})`);
  }

  return data;
}

/**
 * Faz parse de uma linha do arquivo mudança_data
 * Formato: "Nome da Demanda; criação:DD/MM/YYYY; concluída:DD/MM/YYYY"
 * @param {string} linha - Linha do arquivo
 * @returns {Object|null} - Objeto com nome_demanda, data_criacao, data_finalizacao ou null se linha inválida
 */
function parseLinha(linha) {
  // Remover espaços extras e quebras de linha
  linha = linha.trim();
  
  // Ignorar linhas vazias ou que são apenas título
  if (!linha || linha.includes('Alterar data')) {
    return null;
  }

  // Separar por ponto e vírgula
  const partes = linha.split(';').map(p => p.trim());
  
  if (partes.length < 2) {
    return null;
  }

  const nomeDemanda = partes[0].trim();
  let dataCriacao = null;
  let dataFinalizacao = null;

  // Processar cada parte após o nome
  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i];
    
    if (parte.startsWith('criação:')) {
      const dataStr = parte.replace('criação:', '').trim();
      try {
        dataCriacao = converterData(dataStr);
      } catch (error) {
        console.warn(`⚠️  Erro ao converter data de criação "${dataStr}": ${error.message}`);
      }
    } else if (parte.startsWith('concluída:')) {
      const dataStr = parte.replace('concluída:', '').trim();
      try {
        dataFinalizacao = converterData(dataStr);
      } catch (error) {
        console.warn(`⚠️  Erro ao converter data de finalização "${dataStr}": ${error.message}`);
      }
    }
  }

  if (!nomeDemanda) {
    return null;
  }

  return {
    nome_demanda: nomeDemanda,
    data_criacao: dataCriacao,
    data_finalizacao: dataFinalizacao
  };
}

/**
 * Busca uma demanda no banco por nome_demanda
 * Tenta busca exata primeiro, depois busca parcial
 * @param {string} nomeDemanda - Nome da demanda a buscar
 * @returns {Promise<Object|null>} - Demanda encontrada ou null
 */
async function buscarDemanda(nomeDemanda) {
  // Tentar busca exata primeiro
  let demanda = await prisma.demanda.findFirst({
    where: { nome_demanda: nomeDemanda },
    include: { responsavel: true }
  });

  // Se não encontrar, tentar busca parcial (contains)
  if (!demanda) {
    demanda = await prisma.demanda.findFirst({
      where: { 
        nome_demanda: { 
          contains: nomeDemanda
        } 
      },
      include: { responsavel: true }
    });
  }

  // Verificar se há múltiplas correspondências (apenas para warning)
  if (demanda) {
    const countExato = await prisma.demanda.count({
      where: { nome_demanda: nomeDemanda }
    });

    if (countExato > 1) {
      console.warn(`⚠️  ATENÇÃO: Múltiplas demandas encontradas com nome exato "${nomeDemanda}" (${countExato} encontradas)`);
    }
  }

  return demanda;
}

/**
 * Atualiza as datas de uma demanda
 * @param {string} demandaId - ID da demanda
 * @param {Date|null} dataCriacao - Nova data de criação (ou null para não atualizar)
 * @param {Date|null} dataFinalizacao - Nova data de finalização (ou null para não atualizar)
 * @returns {Promise<Object>} - Demanda atualizada
 */
async function atualizarDatasDemanda(demandaId, dataCriacao, dataFinalizacao) {
  const updateData = {};

  if (dataCriacao) {
    updateData.data_criacao = dataCriacao;
  }

  if (dataFinalizacao) {
    updateData.data_finalizacao = dataFinalizacao;
  }

  if (Object.keys(updateData).length === 0) {
    return null; // Nada para atualizar
  }

  const demandaAtualizada = await prisma.demanda.update({
    where: { id: demandaId },
    data: updateData,
    include: { responsavel: true }
  });

  return demandaAtualizada;
}

/**
 * Lê o arquivo mudança_data e retorna array de objetos parseados
 * @param {string} filePath - Caminho do arquivo
 * @returns {Array} - Array de objetos parseados
 */
function lerArquivoMudancaData(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  const conteudo = fs.readFileSync(filePath, 'utf-8');
  const linhas = conteudo.split('\n');
  
  const resultados = [];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const parseado = parseLinha(linha);
    
    if (parseado) {
      resultados.push(parseado);
    }
  }

  return resultados;
}

/**
 * Função principal de atualização
 */
async function atualizarDatasDemandas() {
  try {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     Atualização de Datas de Demandas                ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    console.log('');

    // Tentar encontrar o arquivo mudança_data
    // Primeiro tenta na raiz do projeto (dentro do container seria /app)
    // Depois tenta caminho relativo
    const caminhosPossiveis = [
      '/app/mudança_data',
      path.join(__dirname, '../../mudança_data'),
      path.join(process.cwd(), 'mudança_data')
    ];

    let arquivoPath = null;
    for (const caminho of caminhosPossiveis) {
      if (fs.existsSync(caminho)) {
        arquivoPath = caminho;
        break;
      }
    }

    if (!arquivoPath) {
      throw new Error(`Arquivo mudança_data não encontrado. Tentou em: ${caminhosPossiveis.join(', ')}`);
    }

    console.log(`📄 Lendo arquivo: ${arquivoPath}`);
    const mudancas = lerArquivoMudancaData(arquivoPath);
    console.log(`✅ ${mudancas.length} linhas válidas encontradas no arquivo`);
    console.log('');

    if (mudancas.length === 0) {
      console.log('ℹ️  Nenhuma mudança para processar');
      return;
    }

    // Estatísticas
    let sucessos = 0;
    let naoEncontradas = 0;
    let erros = 0;
    const naoEncontradasList = [];

    // Processar cada mudança
    console.log('🔄 Processando mudanças...');
    console.log('');

    for (let i = 0; i < mudancas.length; i++) {
      const mudanca = mudancas[i];
      const numero = i + 1;
      
      console.log(`[${numero}/${mudancas.length}] Processando: "${mudanca.nome_demanda}"`);

      try {
        // Buscar demanda
        const demanda = await buscarDemanda(mudanca.nome_demanda);

        if (!demanda) {
          console.log(`   ❌ Demanda não encontrada`);
          naoEncontradas++;
          naoEncontradasList.push(mudanca.nome_demanda);
          continue;
        }

        // Atualizar datas
        const atualizada = await atualizarDatasDemanda(
          demanda.id,
          mudanca.data_criacao,
          mudanca.data_finalizacao
        );

        if (atualizada) {
          const mudancas = [];
          if (mudanca.data_criacao) {
            mudancas.push(`data_criacao: ${mudanca.data_criacao.toLocaleDateString('pt-BR')}`);
          }
          if (mudanca.data_finalizacao) {
            mudancas.push(`data_finalizacao: ${mudanca.data_finalizacao.toLocaleDateString('pt-BR')}`);
          }

          console.log(`   ✅ Atualizada (ID: ${demanda.id}) - ${mudancas.join(', ')}`);
          sucessos++;
        } else {
          console.log(`   ⚠️  Nenhuma data para atualizar`);
        }

      } catch (error) {
        console.error(`   ❌ Erro ao processar: ${error.message}`);
        erros++;
      }

      console.log('');
    }

    // Resumo
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 Resumo da Atualização');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Não encontradas: ${naoEncontradas}`);
    console.log(`⚠️  Erros: ${erros}`);
    console.log('');

    if (naoEncontradasList.length > 0) {
      console.log('📋 Demandas não encontradas:');
      naoEncontradasList.forEach(nome => {
        console.log(`   - ${nome}`);
      });
      console.log('');
    }

    console.log('✅ Processamento concluído!');
    console.log('');

  } catch (error) {
    console.error('❌ Erro durante atualização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar atualização
if (require.main === module) {
  atualizarDatasDemandas()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { atualizarDatasDemandas };

