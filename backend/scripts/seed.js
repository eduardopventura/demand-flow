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

const initialData = {
  usuarios: [
    {
      id: "u1",
      nome: "João Silva",
      email: "joao@empresa.com",
      login: "joao",
      senha: "123456"
    },
    {
      id: "u2",
      nome: "Maria Santos",
      email: "maria@empresa.com",
      login: "maria",
      senha: "123456"
    },
    {
      id: "u3",
      nome: "Pedro Costa",
      email: "pedro@empresa.com",
      login: "pedro",
      senha: "123456"
    }
  ],
  templates: [
    {
      id: "t1",
      nome: "Cadastro de Novo Aluno",
      prioridade: "Alta",
      campos_preenchimento: [
        {
          id_campo: "c1",
          nome_campo: "Nome do Aluno",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: true
        },
        {
          id_campo: "c2",
          nome_campo: "Email",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: false
        },
        {
          id_campo: "c3",
          nome_campo: "Telefone",
          tipo_campo: "numero",
          obrigatorio_criacao: false,
          complementa_nome: false
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
      prioridade: "Média",
      campos_preenchimento: [
        {
          id_campo: "c4",
          nome_campo: "Matrícula",
          tipo_campo: "texto",
          obrigatorio_criacao: true,
          complementa_nome: false
        },
        {
          id_campo: "c5",
          nome_campo: "Série Atual",
          tipo_campo: "dropdown",
          opcoes_dropdown: [
            "1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano",
            "6º Ano", "7º Ano", "8º Ano", "9º Ano"
          ],
          obrigatorio_criacao: true,
          complementa_nome: false
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
      prioridade: "Alta",
      responsavel_id: "u1",
      campos_preenchidos: [
        { id_campo: "c1", valor: "Ana Paula" },
        { id_campo: "c2", valor: "ana@email.com" },
        { id_campo: "c3", valor: "11999998888" }
      ],
      tarefas_status: [
        { id_tarefa: "ta1", concluida: false },
        { id_tarefa: "ta2", concluida: false },
        { id_tarefa: "ta3", concluida: false }
      ]
    },
    {
      id: "d2",
      template_id: "t1",
      nome_demanda: "Cadastro de Novo Aluno - Carlos Eduardo",
      status: "Em Andamento",
      prioridade: "Alta",
      responsavel_id: "u2",
      campos_preenchidos: [
        { id_campo: "c1", valor: "Carlos Eduardo" },
        { id_campo: "c2", valor: "carlos@email.com" },
        { id_campo: "c3", valor: "11988887777" }
      ],
      tarefas_status: [
        { id_tarefa: "ta1", concluida: true },
        { id_tarefa: "ta2", concluida: false },
        { id_tarefa: "ta3", concluida: false }
      ]
    },
    {
      id: "d3",
      template_id: "t2",
      nome_demanda: "Renovação de Matrícula",
      status: "Finalizada",
      prioridade: "Média",
      responsavel_id: "u3",
      campos_preenchidos: [
        { id_campo: "c4", valor: "MAT2023001" },
        { id_campo: "c5", valor: "8º Ano" }
      ],
      tarefas_status: [
        { id_tarefa: "ta4", concluida: true },
        { id_tarefa: "ta5", concluida: true }
      ]
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

