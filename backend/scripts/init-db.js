/**
 * Database Initialization Script
 * 
 * Verifica se o banco está vazio e cria estrutura inicial:
 * - Cargo "admin" com todas permissões
 * - Usuário admin (login: "admin", senha: "password")
 * 
 * Usage:
 *   node scripts/init-db.js
 */

require('dotenv').config({ path: '/app/.env' });
const { prisma } = require('../src/database/client');
const { hashPassword } = require('../services/auth.service');

/**
 * Verifica se o banco está vazio (sem usuários)
 */
async function isDatabaseEmpty() {
  const userCount = await prisma.usuario.count();
  return userCount === 0;
}

/**
 * Cria ou busca o cargo "admin" com todas permissões
 */
async function getOrCreateAdminCargo() {
  console.log('📋 Criando/buscando cargo admin...');
  
  const adminCargo = await prisma.cargo.upsert({
    where: { nome: 'admin' },
    create: {
      nome: 'admin',
      acesso_templates: true,
      acesso_acoes: true,
      acesso_usuarios: true,
      deletar_demandas: true,
      cargo_disponivel_como_responsavel: true,
      usuarios_disponiveis_como_responsaveis: true,
    },
    update: {
      // Garantir que todas permissões estão habilitadas
      acesso_templates: true,
      acesso_acoes: true,
      acesso_usuarios: true,
      deletar_demandas: true,
      cargo_disponivel_como_responsavel: true,
      usuarios_disponiveis_como_responsaveis: true,
    },
  });
  
  console.log(`✅ Cargo admin criado/encontrado (ID: ${adminCargo.id})`);
  return adminCargo;
}

/**
 * Cria usuário admin padrão
 */
async function createAdminUser(adminCargoId) {
  console.log('👤 Criando usuário admin...');
  
  // Verificar se usuário admin já existe
  const existingAdmin = await prisma.usuario.findUnique({
    where: { login: 'admin' }
  });
  
  if (existingAdmin) {
    console.log('⚠️  Usuário admin já existe, pulando criação...');
    return existingAdmin;
  }
  
  // Hash da senha padrão "password"
  const senhaHash = await hashPassword('password');
  
  const adminUser = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@demandflow.local',
      telefone: '00000000000',
      login: 'admin',
      senha_hash: senhaHash,
      cargo_id: adminCargoId,
      notificar_email: false,
      notificar_telefone: false,
    },
    include: { cargo: true }
  });
  
  console.log(`✅ Usuário admin criado (ID: ${adminUser.id})`);
  console.log(`   Login: admin`);
  console.log(`   Senha: password`);
  console.log(`   Cargo: ${adminUser.cargo.nome}`);
  
  return adminUser;
}

/**
 * Função principal de inicialização
 */
async function initializeDatabase() {
  try {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     Inicialização do Banco de Dados                 ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    
    // Conectar ao banco
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');
    console.log('');
    
    // Verificar se banco está vazio
    console.log('🔍 Verificando banco de dados...');
    const isEmpty = await isDatabaseEmpty();
    
    if (!isEmpty) {
      console.log('ℹ️  Banco de dados já possui usuários, inicialização não necessária');
      console.log('');
      return;
    }
    
    console.log('📦 Banco vazio detectado, inicializando...');
    console.log('');
    
    // Criar ou buscar cargo admin
    const adminCargo = await getOrCreateAdminCargo();
    console.log('');
    
    // Criar usuário admin
    await createAdminUser(adminCargo.id);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Inicialização concluída com sucesso!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Credenciais padrão:');
    console.log('   Login: admin');
    console.log('   Senha: password');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante inicialização:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar inicialização
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };

