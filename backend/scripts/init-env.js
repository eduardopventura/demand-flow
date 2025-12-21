/**
 * Environment Initialization Script
 * 
 * Verifica se .env existe e cria a partir de .env.example se necessário.
 * Gera JWT_SECRET automaticamente se não existir.
 * Cria diretório uploads se não existir.
 * 
 * Usage:
 *   node scripts/init-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = '/app/.env';
const ENV_EXAMPLE_PATH = '/app/.env.example';
const UPLOADS_DIR = '/app/uploads';

/**
 * Gera JWT_SECRET aleatório (64 caracteres hex)
 */
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Lê arquivo .env e retorna como objeto
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    // Ignorar comentários e linhas vazias
    if (!line || line.startsWith('#')) {
      return;
    }
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

/**
 * Escreve objeto env para arquivo .env
 */
function writeEnvFile(filePath, env) {
  const lines = [];
  
  // Ordenar chaves para manter organização
  const sortedKeys = Object.keys(env).sort();
  
  sortedKeys.forEach(key => {
    const value = env[key];
    lines.push(`${key}=${value}`);
  });
  
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

/**
 * Função principal de inicialização
 */
async function initializeEnv() {
  try {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     Inicialização do Arquivo .env                  ║');
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
    
    // Verificar se .env já existe
    console.log('🔍 Verificando arquivo .env...');
    const envExists = fs.existsSync(ENV_PATH);
    
    let env = {};
    
    if (envExists) {
      console.log('✅ Arquivo .env já existe');
      env = parseEnvFile(ENV_PATH);
    } else {
      console.log('⚠️  Arquivo .env não encontrado');
      
      // Tentar copiar de .env.example
      if (fs.existsSync(ENV_EXAMPLE_PATH)) {
        console.log('📋 Copiando de .env.example...');
        const exampleContent = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf8');
        fs.writeFileSync(ENV_PATH, exampleContent, 'utf8');
        env = parseEnvFile(ENV_PATH);
        console.log('✅ Arquivo .env criado a partir de .env.example');
      } else {
        console.log('⚠️  .env.example não encontrado, criando template básico...');
        // Criar template básico
        env = {
          SMTP_HOST: 'smtp.zoho.com',
          SMTP_PORT: '465',
          SMTP_SECURE: 'true',
          SMTP_USER: '',
          SMTP_PASS: '',
          SMTP_FROM_NAME: 'Gestor de Demandas',
          SMTP_FROM_EMAIL: '',
          WHATSAPP_WEBHOOK_URL: '',
          WHATSAPP_ENABLED: 'true',
        };
        writeEnvFile(ENV_PATH, env);
        console.log('✅ Template básico criado');
      }
      console.log('');
    }
    
    // Gerar JWT_SECRET se não existir
    if (!env.JWT_SECRET || env.JWT_SECRET.trim() === '') {
      console.log('🔐 Gerando JWT_SECRET...');
      env.JWT_SECRET = generateJWTSecret();
      writeEnvFile(ENV_PATH, env);
      console.log('✅ JWT_SECRET gerado automaticamente');
      console.log('');
    } else {
      console.log('✅ JWT_SECRET já existe no .env');
      console.log('');
    }
    
    // Criar diretório uploads se não existir
    console.log('📁 Verificando diretório uploads...');
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      console.log(`✅ Diretório uploads criado: ${UPLOADS_DIR}`);
      
      // Comentário sobre permissões
      console.log('');
      console.log('💡 Nota sobre permissões:');
      console.log('   Se encontrar erros de permissão ao salvar arquivos,');
      console.log('   você pode precisar ajustar o UID/GID no docker-compose.yml');
      console.log('   Exemplo: user: "1000:1000" (descomentar se necessário)');
      console.log('');
    } else {
      console.log('✅ Diretório uploads já existe');
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Inicialização do .env concluída!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Edite o arquivo .env com suas credenciais SMTP');
    console.log('   2. Configure o webhook do WhatsApp (se necessário)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante inicialização:', error);
    throw error;
  }
}

// Executar inicialização
if (require.main === module) {
  initializeEnv()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { initializeEnv };

