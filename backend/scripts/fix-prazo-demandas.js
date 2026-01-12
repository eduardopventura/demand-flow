/**
 * Script de Migração: Corrigir campo "prazo" em demandas finalizadas
 * 
 * Este script recalcula o campo "prazo" de todas as demandas finalizadas
 * usando a nova lógica que compara apenas datas (ignorando horas).
 * 
 * Problema original: Demandas finalizadas no mesmo dia da previsão
 * estavam sendo marcadas como "fora do prazo" devido à comparação
 * incluir as horas.
 * 
 * Usage:
 *   node scripts/fix-prazo-demandas.js           # Modo dry-run (apenas mostra o que seria alterado)
 *   node scripts/fix-prazo-demandas.js --apply   # Aplica as correções
 */

require('dotenv').config({ path: '/app/.env' });
const { prisma } = require('../src/database/client');

/**
 * Verifica se a demanda está dentro do prazo (lógica corrigida)
 * Compara apenas ano/mês/dia em UTC
 */
function verificarPrazoCorrigido(dataFinalizacao, dataPrevisao) {
  const finalizacao = new Date(dataFinalizacao);
  const previsao = new Date(dataPrevisao);
  
  // Extrair apenas ano, mês e dia em UTC para comparar sem hora
  const finalizacaoDate = Date.UTC(
    finalizacao.getUTCFullYear(),
    finalizacao.getUTCMonth(),
    finalizacao.getUTCDate()
  );
  const previsaoDate = Date.UTC(
    previsao.getUTCFullYear(),
    previsao.getUTCMonth(),
    previsao.getUTCDate()
  );
  
  return finalizacaoDate <= previsaoDate;
}

async function fixPrazoDemandas() {
  const isDryRun = !process.argv.includes('--apply');
  
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║  Correção de Prazo em Demandas Finalizadas                ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (isDryRun) {
    console.log('🔍 MODO: DRY-RUN (apenas análise, sem alterações)');
    console.log('   Para aplicar as correções, execute com --apply');
  } else {
    console.log('⚠️  MODO: APLICAÇÃO DE CORREÇÕES');
    console.log('   As alterações serão salvas no banco de dados!');
  }
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    console.log('');

    // Buscar todas as demandas finalizadas
    console.log('🔍 Buscando demandas finalizadas...');
    const demandasFinalizadas = await prisma.demanda.findMany({
      where: {
        status: 'Finalizada',
        data_finalizacao: { not: null }
      },
      select: {
        id: true,
        nome_demanda: true,
        data_previsao: true,
        data_finalizacao: true,
        prazo: true
      }
    });

    console.log(`📊 Total de demandas finalizadas: ${demandasFinalizadas.length}`);
    console.log('');

    // Analisar cada demanda
    const demandasParaCorrigir = [];
    const demandasCorretas = [];

    for (const demanda of demandasFinalizadas) {
      const prazoCorreto = verificarPrazoCorrigido(
        demanda.data_finalizacao,
        demanda.data_previsao
      );
      
      if (demanda.prazo !== prazoCorreto) {
        demandasParaCorrigir.push({
          ...demanda,
          prazoAtual: demanda.prazo,
          prazoCorreto
        });
      } else {
        demandasCorretas.push(demanda);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 RESUMO DA ANÁLISE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ✅ Demandas com prazo correto: ${demandasCorretas.length}`);
    console.log(`   ❌ Demandas para corrigir: ${demandasParaCorrigir.length}`);
    console.log('');

    if (demandasParaCorrigir.length === 0) {
      console.log('🎉 Nenhuma demanda precisa ser corrigida!');
      return;
    }

    // Mostrar detalhes das demandas a corrigir
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DEMANDAS A SEREM CORRIGIDAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Separar por tipo de correção
    const falsePraTrue = demandasParaCorrigir.filter(d => d.prazoAtual === false && d.prazoCorreto === true);
    const truePraFalse = demandasParaCorrigir.filter(d => d.prazoAtual === true && d.prazoCorreto === false);

    if (falsePraTrue.length > 0) {
      console.log('');
      console.log(`🔴→🟢 Corrigir de FORA DO PRAZO para DENTRO DO PRAZO: ${falsePraTrue.length}`);
      console.log('   (Estas demandas estavam incorretamente marcadas como atrasadas)');
      for (const d of falsePraTrue.slice(0, 10)) {
        const finDate = new Date(d.data_finalizacao).toISOString().split('T')[0];
        const prevDate = new Date(d.data_previsao).toISOString().split('T')[0];
        console.log(`   • ${d.nome_demanda.substring(0, 50)}`);
        console.log(`     Previsão: ${prevDate} | Finalização: ${finDate}`);
      }
      if (falsePraTrue.length > 10) {
        console.log(`   ... e mais ${falsePraTrue.length - 10} demandas`);
      }
    }

    if (truePraFalse.length > 0) {
      console.log('');
      console.log(`🟢→🔴 Corrigir de DENTRO DO PRAZO para FORA DO PRAZO: ${truePraFalse.length}`);
      console.log('   (Estas demandas estavam incorretamente marcadas como no prazo)');
      for (const d of truePraFalse.slice(0, 10)) {
        const finDate = new Date(d.data_finalizacao).toISOString().split('T')[0];
        const prevDate = new Date(d.data_previsao).toISOString().split('T')[0];
        console.log(`   • ${d.nome_demanda.substring(0, 50)}`);
        console.log(`     Previsão: ${prevDate} | Finalização: ${finDate}`);
      }
      if (truePraFalse.length > 10) {
        console.log(`   ... e mais ${truePraFalse.length - 10} demandas`);
      }
    }

    console.log('');

    // Aplicar correções se não for dry-run
    if (!isDryRun) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚙️  APLICANDO CORREÇÕES...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      let corrigidas = 0;
      let erros = 0;

      for (const demanda of demandasParaCorrigir) {
        try {
          await prisma.demanda.update({
            where: { id: demanda.id },
            data: { prazo: demanda.prazoCorreto }
          });
          corrigidas++;
          
          // Feedback a cada 10 demandas
          if (corrigidas % 10 === 0) {
            console.log(`   Processadas: ${corrigidas}/${demandasParaCorrigir.length}`);
          }
        } catch (error) {
          console.error(`   ❌ Erro ao corrigir demanda ${demanda.id}: ${error.message}`);
          erros++;
        }
      }

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 RESULTADO FINAL');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   ✅ Demandas corrigidas: ${corrigidas}`);
      if (erros > 0) {
        console.log(`   ❌ Erros: ${erros}`);
      }
      console.log('');
      console.log('🎉 Correção concluída!');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('ℹ️  Para aplicar as correções, execute:');
      console.log('   node scripts/fix-prazo-demandas.js --apply');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

  } catch (error) {
    console.error('❌ Erro durante execução:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  fixPrazoDemandas()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixPrazoDemandas, verificarPrazoCorrigido };
