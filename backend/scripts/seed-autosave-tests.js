/**
 * Seed para Testes de Autosave
 * 
 * Cria dados de teste:
 * - Template com campos variados (texto, arquivo, data, dropdown, grupo)
 * - Ação com webhook de teste
 * - Demandas de exemplo
 * 
 * Usage:
 *   node scripts/seed-autosave-tests.js
 */

require('dotenv').config({ path: '/app/.env' });
const { prisma } = require('../src/database/client');
const { v4: uuidv4 } = require('uuid');

const WEBHOOK_URL = 'https://n8n.ventclick.click/webhook/teste';

async function seedAutosaveTests() {
  try {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     Seed para Testes de Autosave                    ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');

    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    console.log('');

    // 1. Buscar usuário admin
    const admin = await prisma.usuario.findFirst({
      where: { login: 'admin' }
    });

    if (!admin) {
      throw new Error('Usuário admin não encontrado. Execute init-db.js primeiro.');
    }
    console.log(`✅ Usuário admin encontrado (ID: ${admin.id})`);

    // 2. Criar Ação de teste com webhook
    console.log('\n📋 Criando ação de teste...');
    const acaoId = uuidv4();
    const acao = await prisma.acao.upsert({
      where: { id: acaoId },
      create: {
        id: acaoId,
        nome: 'Enviar Documento para Teste',
        url: WEBHOOK_URL,
        campos: [
          {
            id_campo: 'campo_nome_doc',
            nome_campo: 'Nome do Documento',
            tipo_campo: 'texto',
            obrigatorio: true
          },
          {
            id_campo: 'campo_arquivo_doc',
            nome_campo: 'Arquivo',
            tipo_campo: 'arquivo',
            obrigatorio: true
          },
          {
            id_campo: 'campo_data_envio',
            nome_campo: 'Data de Envio',
            tipo_campo: 'data',
            obrigatorio: false
          }
        ]
      },
      update: {
        url: WEBHOOK_URL
      }
    });
    console.log(`✅ Ação criada: ${acao.nome} (ID: ${acao.id})`);

    // 3. Criar Template de teste
    console.log('\n📋 Criando template de teste...');
    const templateId = uuidv4();
    const template = await prisma.template.upsert({
      where: { id: templateId },
      create: {
        id: templateId,
        nome: 'Template Teste Autosave',
        tempo_medio: 7,
        abas: [
          { id: 'aba_geral', nome: 'Geral', ordem: 0 },
          { id: 'aba_docs', nome: 'Documentos', ordem: 1 }
        ],
        campos_preenchimento: [
          {
            id_campo: 'campo_titulo',
            nome_campo: 'Título',
            tipo_campo: 'texto',
            obrigatorio_criacao: true,
            complementa_nome: true,
            abas_ids: ['aba_geral'],
            ordem_abas: { aba_geral: 0 }
          },
          {
            id_campo: 'campo_descricao',
            nome_campo: 'Descrição',
            tipo_campo: 'texto',
            obrigatorio_criacao: false,
            complementa_nome: false,
            abas_ids: ['aba_geral'],
            ordem_abas: { aba_geral: 1 }
          },
          {
            id_campo: 'campo_prioridade',
            nome_campo: 'Prioridade',
            tipo_campo: 'dropdown',
            opcoes_dropdown: ['Baixa', 'Média', 'Alta', 'Urgente'],
            obrigatorio_criacao: true,
            complementa_nome: false,
            abas_ids: ['aba_geral'],
            ordem_abas: { aba_geral: 2 }
          },
          {
            id_campo: 'campo_data_limite',
            nome_campo: 'Data Limite',
            tipo_campo: 'data',
            obrigatorio_criacao: false,
            complementa_nome: false,
            abas_ids: ['aba_geral'],
            ordem_abas: { aba_geral: 3 }
          },
          {
            id_campo: 'campo_valor',
            nome_campo: 'Valor Estimado',
            tipo_campo: 'numero_decimal',
            obrigatorio_criacao: false,
            complementa_nome: false,
            abas_ids: ['aba_geral'],
            ordem_abas: { aba_geral: 4 }
          },
          {
            id_campo: 'campo_documento',
            nome_campo: 'Documento Principal',
            tipo_campo: 'arquivo',
            obrigatorio_criacao: false,
            complementa_nome: false,
            abas_ids: ['aba_docs'],
            ordem_abas: { aba_docs: 0 }
          },
          {
            id_campo: 'grupo_anexos',
            nome_campo: 'Anexos Adicionais',
            tipo_campo: 'grupo',
            obrigatorio_criacao: false,
            complementa_nome: false,
            abas_ids: ['aba_docs'],
            ordem_abas: { aba_docs: 1 },
            quantidade_replicas_padrao: 1,
            campos: [
              {
                id_campo: 'anexo_nome',
                nome_campo: 'Nome do Anexo',
                tipo_campo: 'texto',
                obrigatorio_criacao: false
              },
              {
                id_campo: 'anexo_arquivo',
                nome_campo: 'Arquivo',
                tipo_campo: 'arquivo',
                obrigatorio_criacao: false
              }
            ]
          }
        ],
        tarefas: [
          {
            id_tarefa: 'tarefa_revisar',
            nome_tarefa: 'Revisar Documentos',
            link_pai: null,
            responsavel_id: null,
            cargo_responsavel_id: null,
            acao_id: null,
            mapeamento_campos: null
          },
          {
            id_tarefa: 'tarefa_enviar',
            nome_tarefa: 'Enviar para Processamento',
            link_pai: 'tarefa_revisar',
            responsavel_id: null,
            cargo_responsavel_id: null,
            acao_id: acao.id,
            mapeamento_campos: {
              'campo_nome_doc': 'campo_titulo',
              'campo_arquivo_doc': 'campo_documento',
              'campo_data_envio': 'campo_data_limite'
            }
          },
          {
            id_tarefa: 'tarefa_finalizar',
            nome_tarefa: 'Finalizar',
            link_pai: 'tarefa_enviar',
            responsavel_id: null,
            cargo_responsavel_id: null,
            acao_id: null,
            mapeamento_campos: null
          }
        ]
      },
      update: {
        nome: 'Template Teste Autosave'
      }
    });
    console.log(`✅ Template criado: ${template.nome} (ID: ${template.id})`);

    // 4. Criar Demandas de teste
    console.log('\n📋 Criando demandas de teste...');

    // Demanda 1: Status "Criada" (para testar iniciar andamento)
    const demanda1Id = uuidv4();
    const demanda1 = await prisma.demanda.upsert({
      where: { id: demanda1Id },
      create: {
        id: demanda1Id,
        template_id: template.id,
        nome_demanda: 'Template Teste Autosave - Demanda Teste 1',
        status: 'Criada',
        responsavel_id: admin.id,
        tempo_esperado: 7,
        data_criacao: new Date(),
        data_previsao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        data_finalizacao: null,
        prazo: true,
        observacoes: '',
        notificacao_prazo_enviada: false,
        modificado_por_id: admin.id,
        tarefas_status: {
          create: [
            { id_tarefa: 'tarefa_revisar', concluida: false },
            { id_tarefa: 'tarefa_enviar', concluida: false },
            { id_tarefa: 'tarefa_finalizar', concluida: false }
          ]
        },
        campos_preenchidos: {
          create: [
            { id_campo: 'campo_titulo', valor: 'Demanda Teste 1' },
            { id_campo: 'campo_prioridade', valor: 'Média' }
          ]
        }
      },
      update: {}
    });
    console.log(`✅ Demanda 1 criada: ${demanda1.nome_demanda} (Status: Criada)`);

    // Demanda 2: Status "Em Andamento" (para testar autosave e ação)
    const demanda2Id = uuidv4();
    const demanda2 = await prisma.demanda.upsert({
      where: { id: demanda2Id },
      create: {
        id: demanda2Id,
        template_id: template.id,
        nome_demanda: 'Template Teste Autosave - Demanda Teste 2',
        status: 'Em Andamento',
        responsavel_id: admin.id,
        tempo_esperado: 7,
        data_criacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        data_previsao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        data_finalizacao: null,
        prazo: true,
        observacoes: 'Demanda para testar autosave',
        notificacao_prazo_enviada: false,
        modificado_por_id: admin.id,
        tarefas_status: {
          create: [
            { id_tarefa: 'tarefa_revisar', concluida: true, responsavel_id: admin.id },
            { id_tarefa: 'tarefa_enviar', concluida: false },
            { id_tarefa: 'tarefa_finalizar', concluida: false }
          ]
        },
        campos_preenchidos: {
          create: [
            { id_campo: 'campo_titulo', valor: 'Demanda Teste 2' },
            { id_campo: 'campo_descricao', valor: 'Descrição inicial para testes' },
            { id_campo: 'campo_prioridade', valor: 'Alta' },
            { id_campo: 'campo_valor', valor: '1500,00' }
          ]
        }
      },
      update: {}
    });
    console.log(`✅ Demanda 2 criada: ${demanda2.nome_demanda} (Status: Em Andamento)`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Seed concluído com sucesso!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📝 Dados criados:');
    console.log(`   - Ação: ${acao.nome} (webhook: ${WEBHOOK_URL})`);
    console.log(`   - Template: ${template.nome}`);
    console.log(`   - Demanda 1: Status "Criada" (para testar iniciar andamento)`);
    console.log(`   - Demanda 2: Status "Em Andamento" (para testar autosave + ação)`);
    console.log('\n🧪 Testes sugeridos:');
    console.log('   1. Abrir Demanda 2 no frontend');
    console.log('   2. Fazer upload de arquivo no campo "Documento Principal"');
    console.log('   3. Verificar indicador "Salvo" no header');
    console.log('   4. Concluir tarefa "Revisar Documentos" (já concluída)');
    console.log('   5. Executar ação "Enviar para Processamento"');
    console.log('   6. Verificar webhook recebendo o arquivo');
    console.log('');

    return {
      acao,
      template,
      demandas: [demanda1, demanda2]
    };

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  seedAutosaveTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedAutosaveTests };
