/**
 * Email Service - Envio de emails via SMTP
 * 
 * Configuração via variáveis de ambiente (.env)
 * 
 * Variáveis necessárias:
 * - SMTP_HOST: Host do servidor SMTP
 * - SMTP_PORT: Porta (465 para SSL, 587 para TLS)
 * - SMTP_SECURE: true para SSL (porta 465)
 * - SMTP_USER: Email do remetente
 * - SMTP_PASS: Senha de app do email
 * - SMTP_FROM_NAME: Nome exibido no remetente
 * - SMTP_FROM_EMAIL: Email do remetente
 */

const nodemailer = require('nodemailer');

// Configuração do transporter SMTP via variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false', // SSL por padrão
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Configuração do remetente
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Gestor de Demandas';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

/**
 * Verifica se a conexão com o servidor SMTP está funcionando
 */
async function verificarConexao() {
  try {
    await transporter.verify();
    console.log('✅ Conexão SMTP Zoho verificada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão SMTP Zoho:', error.message);
    return false;
  }
}

/**
 * Envia um email
 * @param {Object} options - Opções do email
 * @param {string} options.para - Email do destinatário
 * @param {string} options.assunto - Assunto do email
 * @param {string} options.mensagem - Corpo da mensagem (texto)
 * @param {string} [options.html] - Corpo da mensagem (HTML, opcional)
 * @returns {Promise<Object>} - Resultado do envio
 */
async function enviarEmail({ para, assunto, mensagem, html }) {
  // Verificar se as credenciais estão configuradas
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP não configurado. Defina SMTP_USER e SMTP_PASS no .env');
    return {
      success: false,
      error: 'SMTP não configurado'
    };
  }

  try {
    const mailOptions = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: para,
      subject: assunto,
      text: mensagem,
      html: html || mensagem.replace(/\n/g, '<br>')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado para ${para}: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error(`❌ Erro ao enviar email para ${para}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Importar módulo de templates HTML
const emailTemplates = require('../templates/emails');

/**
 * Templates de email para notificações
 * Usa o módulo de templates para gerar HTML, mantendo texto simples como fallback
 */
const templates = {
  /**
   * Nova demanda atribuída
   */
  novaDemanda: (nomeDemanda, dataPrevisao, nomeResponsavel) => ({
    assunto: `📋 Nova Demanda Atribuída: ${nomeDemanda}`,
    mensagem: `Olá ${nomeResponsavel},

Uma nova demanda foi atribuída a você:

📋 Demanda: ${nomeDemanda}
📅 Prazo: ${dataPrevisao}

Acesse o sistema para mais detalhes.

--
Gestor de Demandas Kumon`,
    html: emailTemplates.html.novaDemanda(nomeDemanda, dataPrevisao, nomeResponsavel)
  }),

  /**
   * Tarefa atribuída
   */
  tarefaAtribuida: (nomeTarefa, nomeDemanda, nomeResponsavel) => ({
    assunto: `✅ Tarefa Atribuída: ${nomeTarefa}`,
    mensagem: `Olá ${nomeResponsavel},

Uma tarefa foi atribuída a você:

✅ Tarefa: ${nomeTarefa}
📋 Demanda: ${nomeDemanda}

Acesse o sistema para mais detalhes.

--
Gestor de Demandas Kumon`,
    html: emailTemplates.html.tarefaAtribuida(nomeTarefa, nomeDemanda, nomeResponsavel)
  }),

  /**
   * Tarefa concluída
   */
  tarefaConcluida: (nomeTarefa, nomeDemanda, nomeResponsavelDemanda, nomeQuemConcluiu) => ({
    assunto: `🎉 Tarefa Concluída: ${nomeTarefa}`,
    mensagem: `Olá ${nomeResponsavelDemanda},

Uma tarefa da sua demanda foi concluída:

✅ Tarefa: ${nomeTarefa}
📋 Demanda: ${nomeDemanda}
👤 Concluída por: ${nomeQuemConcluiu}

Acesse o sistema para mais detalhes.

--
Gestor de Demandas Kumon`,
    html: emailTemplates.html.tarefaConcluida(nomeTarefa, nomeDemanda, nomeResponsavelDemanda, nomeQuemConcluiu)
  }),

  /**
   * Prazo próximo
   */
  prazoProximo: (nomeDemanda, dataPrevisao, nomeResponsavel) => ({
    assunto: `⚠️ Prazo Próximo: ${nomeDemanda}`,
    mensagem: `Olá ${nomeResponsavel},

ATENÇÃO! A demanda abaixo vence amanhã:

📋 Demanda: ${nomeDemanda}
📅 Prazo: ${dataPrevisao}

Acesse o sistema e verifique o status das tarefas.

--
Gestor de Demandas Kumon`,
    html: emailTemplates.html.prazoProximo(nomeDemanda, dataPrevisao, nomeResponsavel)
  })
};

module.exports = {
  enviarEmail,
  verificarConexao,
  templates
};

