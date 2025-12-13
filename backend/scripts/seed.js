/**
 * Seed Script - Reset database to initial state
 * 
 * Usage:
 *   node backend/scripts/seed.js
 * 
 * This will reset db.json to initial demo data
 */

const fs = require('fs');
const path = require('path');

// Helper para gerar datas ISO
const getISODate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

const initialData = {
  usuarios: [
    {
      id: "u1",
      nome: "João Silva",
      email: "joao@empresa.com",
      telefone: "5511999998888",
      login: "joao",
      senha: "123456",
      notificar_email: true,
      notificar_telefone: false
    },
    {
      id: "u2",
      nome: "Maria Santos",
      email: "maria@empresa.com",
      telefone: "5511988887777",
      login: "maria",
      senha: "123456",
      notificar_email: true,
      notificar_telefone: true
    },
    {
      id: "u3",
      nome: "Pedro Costa",
      email: "pedro@empresa.com",
      telefone: "5511977776666",
      login: "pedro",
      senha: "123456",
      notificar_email: false,
      notificar_telefone: true
    }
  ],
  templates: [
    {
      id: "t1",
      nome: "Cadastro de Novo Aluno",
      tempo_medio: 7,
      abas: [
        { id: "geral", nome: "Geral", ordem: 0 },
        { id: "documentos", nome: "Documentos", ordem: 1 }
      ],
      campos_preenchimento: [
        {
          id_campo: "c1",
          nome_campo: "Nome do Aluno",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: true,
          abas_ids: ["geral"]
        },
        {
          id_campo: "c2",
          nome_campo: "Email",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: false,
          abas_ids: ["geral"]
        },
        {
          id_campo: "c3",
          nome_campo: "Telefone",
          tipo_campo: "numero",
          obrigatorio_criacao: false,
          complementa_nome: false,
          abas_ids: ["geral"]
        },
        {
          id_campo: "c4",
          nome_campo: "RG",
          tipo_campo: "texto",
          obrigatorio_criacao: false,
          complementa_nome: false,
          abas_ids: ["documentos"]
        },
        {
          id_campo: "c5",
          nome_campo: "CPF",
          tipo_campo: "texto",
          obrigatorio_criacao: false,
          complementa_nome: false,
          abas_ids: ["documentos"]
        }
      ],
      tarefas: [
        {
          id_tarefa: "ta1",
          nome_tarefa: "Gerar Contrato",
          link_pai: null
        },
        {
          id_tarefa: "ta2",
          nome_tarefa: "Enviar Boleto",
          link_pai: "ta1"
        },
        {
          id_tarefa: "ta3",
          nome_tarefa: "Confirmar Pagamento",
          link_pai: "ta2"
        }
      ]
    },
    {
      id: "t2",
      nome: "Renovação de Matrícula",
      tempo_medio: 5,
      abas: [
        { id: "geral", nome: "Geral", ordem: 0 }
      ],
      campos_preenchimento: [
        {
          id_campo: "c6",
          nome_campo: "Matrícula",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: true,
          abas_ids: ["geral"]
        },
        {
          id_campo: "c7",
          nome_campo: "Série Atual",
          tipo_campo: "dropdown",
          opcoes_dropdown: [
            "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano",
            "6º Ano", "7º Ano", "8º Ano", "9º Ano"
          ],
          obrigatorio_criacao: true,
          complementa_nome: false,
          abas_ids: ["geral"]
        }
      ],
      tarefas: [
        {
          id_tarefa: "ta4",
          nome_tarefa: "Verificar Pendências",
          link_pai: null
        },
        {
          id_tarefa: "ta5",
          nome_tarefa: "Gerar Nova Matrícula",
          link_pai: "ta4"
        }
      ]
    }
  ],
  demandas: [
    {
      id: "d1",
      template_id: "t1",
      nome_demanda: "Cadastro de Novo Aluno - Ana Paula",
      status: "Criada",
      responsavel_id: "u1",
      tempo_esperado: 7,
      campos_preenchidos: [
        { id_campo: "c1", valor: "Ana Paula" },
        { id_campo: "c2", valor: "ana@email.com" },
        { id_campo: "c3", valor: "11999998888" }
      ],
      tarefas_status: [
        { id_tarefa: "ta1", concluida: false },
        { id_tarefa: "ta2", concluida: false },
        { id_tarefa: "ta3", concluida: false }
      ],
      data_criacao: getISODate(-3),
      data_previsao: getISODate(4),
      data_finalizacao: null,
      prazo: true,
      observacoes: "",
      notificacao_prazo_enviada: false
    },
    {
      id: "d2",
      template_id: "t1",
      nome_demanda: "Cadastro de Novo Aluno - Carlos Eduardo",
      status: "Em Andamento",
      responsavel_id: "u2",
      tempo_esperado: 7,
      campos_preenchidos: [
        { id_campo: "c1", valor: "Carlos Eduardo" },
        { id_campo: "c2", valor: "carlos@email.com" },
        { id_campo: "c3", valor: "11988887777" }
      ],
      tarefas_status: [
        { id_tarefa: "ta1", concluida: true },
        { id_tarefa: "ta2", concluida: false },
        { id_tarefa: "ta3", concluida: false }
      ],
      data_criacao: getISODate(-5),
      data_previsao: getISODate(2),
      data_finalizacao: null,
      prazo: true,
      observacoes: "Aguardando confirmação de pagamento",
      notificacao_prazo_enviada: false
    },
    {
      id: "d3",
      template_id: "t2",
      nome_demanda: "Renovação de Matrícula - MAT2023001",
      status: "Finalizada",
      responsavel_id: "u3",
      tempo_esperado: 5,
      campos_preenchidos: [
        { id_campo: "c6", valor: "MAT2023001" },
        { id_campo: "c7", valor: "8º Ano" }
      ],
      tarefas_status: [
        { id_tarefa: "ta4", concluida: true },
        { id_tarefa: "ta5", concluida: true }
      ],
      data_criacao: getISODate(-10),
      data_previsao: getISODate(-5),
      data_finalizacao: getISODate(-6),
      prazo: true,
      observacoes: "Renovação concluída com sucesso",
      notificacao_prazo_enviada: true
    }
  ]
};

const dbPath = path.join(__dirname, '..', 'db.json');

try {
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  console.log('✅ Database seeded successfully!');
  console.log(`📁 Location: ${dbPath}`);
  console.log('');
  console.log('Initial data:');
  console.log(`  👥 Usuarios: ${initialData.usuarios.length}`);
  console.log(`  📋 Templates: ${initialData.templates.length}`);
  console.log(`  📝 Demandas: ${initialData.demandas.length}`);
} catch (error) {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
}
