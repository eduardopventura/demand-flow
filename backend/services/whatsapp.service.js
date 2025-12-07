/**
 * WhatsApp Service - Envio de mensagens via webhook n8n
 * 
 * Envia dados para o webhook do n8n que aciona uma API de WhatsApp
 * 
 * Configuração via variáveis de ambiente (.env):
 * - WHATSAPP_WEBHOOK_URL: URL do webhook n8n
 * - WHATSAPP_ENABLED: true/false para habilitar/desabilitar
 */

const WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || '';
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED !== 'false';

/**
 * Tipos de notificação
 */
const TipoNotificacao = {
  NOVA_DEMANDA: 'nova_demanda',
  TAREFA_ATRIBUIDA: 'tarefa_atribuida',
  TAREFA_CONCLUIDA: 'tarefa_concluida',
  PRAZO_PROXIMO: 'prazo_proximo'
};

/**
 * Envia uma mensagem via WhatsApp através do webhook n8n
 * @param {Object} options - Opções da mensagem
 * @param {string} options.telefone - Número completo com código país e região (ex: 5561999999999)
 * @param {string} options.mensagem - Corpo da mensagem
 * @param {string} options.tipo - Tipo da notificação (nova_demanda, tarefa_atribuida, etc)
 * @param {Object} [options.demanda] - Dados adicionais da demanda para contexto
 * @returns {Promise<Object>} - Resultado do envio
 */
async function enviarWhatsApp({ telefone, mensagem, tipo, demanda }) {
  // Verificar se WhatsApp está habilitado
  if (!WHATSAPP_ENABLED || !WEBHOOK_URL) {
    console.warn('⚠️ WhatsApp não configurado. Defina WHATSAPP_WEBHOOK_URL no .env');
    return {
      success: false,
      error: 'WhatsApp não configurado'
    };
  }

  try {
    // Validar telefone (deve ter pelo menos 12 dígitos: código país + DDD + número)
    const telefoneNumerico = telefone.replace(/\D/g, '');
    if (telefoneNumerico.length < 12) {
      console.warn(`⚠️ Telefone inválido para WhatsApp: ${telefone}`);
      return {
        success: false,
        error: 'Telefone inválido. Deve conter código do país + DDD + número'
      };
    }

    const payload = {
      telefone: telefoneNumerico,
      mensagem,
      tipo,
      demanda: demanda || null,
      timestamp: new Date().toISOString()
    };

    console.log(`📱 Enviando WhatsApp para ${telefoneNumerico}...`);
    console.log(`   Tipo: ${tipo}`);
    console.log(`   Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json().catch(() => ({}));
    
    console.log(`✅ WhatsApp enviado para ${telefoneNumerico}`);
    
    return {
      success: true,
      response: result
    };
  } catch (error) {
    console.error(`❌ Erro ao enviar WhatsApp para ${telefone}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Templates de mensagem WhatsApp para notificações
 */
const templates = {
  /**
   * Nova demanda atribuída
   */
  novaDemanda: (nomeDemanda, dataPrevisao, nomeResponsavel) => ({
    mensagem: `📋 *Nova Demanda Atribuída*\n\nOlá ${nomeResponsavel}!\n\nUma nova demanda foi atribuída a você:\n\n*Demanda:* ${nomeDemanda}\n*Prazo:* ${dataPrevisao}\n\nAcesse o sistema para mais detalhes.`,
    tipo: TipoNotificacao.NOVA_DEMANDA
  }),

  /**
   * Tarefa atribuída
   */
  tarefaAtribuida: (nomeTarefa, nomeDemanda, nomeResponsavel) => ({
    mensagem: `✅ *Tarefa Atribuída*\n\nOlá ${nomeResponsavel}!\n\nUma tarefa foi atribuída a você:\n\n*Tarefa:* ${nomeTarefa}\n*Demanda:* ${nomeDemanda}\n\nAcesse o sistema para mais detalhes.`,
    tipo: TipoNotificacao.TAREFA_ATRIBUIDA
  }),

  /**
   * Tarefa concluída
   */
  tarefaConcluida: (nomeTarefa, nomeDemanda, nomeResponsavelDemanda, nomeQuemConcluiu) => ({
    mensagem: `🎉 *Tarefa Concluída*\n\nOlá ${nomeResponsavelDemanda}!\n\nUma tarefa da sua demanda foi concluída:\n\n*Tarefa:* ${nomeTarefa}\n*Demanda:* ${nomeDemanda}\n*Concluída por:* ${nomeQuemConcluiu}\n\nAcesse o sistema para mais detalhes.`,
    tipo: TipoNotificacao.TAREFA_CONCLUIDA
  }),

  /**
   * Prazo próximo
   */
  prazoProximo: (nomeDemanda, dataPrevisao, nomeResponsavel) => ({
    mensagem: `⚠️ *ATENÇÃO: Prazo Próximo!*\n\nOlá ${nomeResponsavel}!\n\nA demanda abaixo vence *amanhã*:\n\n*Demanda:* ${nomeDemanda}\n*Prazo:* ${dataPrevisao}\n\nAcesse o sistema e verifique o status das tarefas.`,
    tipo: TipoNotificacao.PRAZO_PROXIMO
  })
};

module.exports = {
  enviarWhatsApp,
  templates,
  TipoNotificacao,
  WEBHOOK_URL,
  WHATSAPP_ENABLED
};

