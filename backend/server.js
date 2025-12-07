/**
 * JSON-Server Backend for Demand Flow
 * 
 * MVP Implementation with JSON-Server + Custom Business Logic
 * Ready for future upgrade to PostgreSQL + Express/Fastify
 * 
 * Features:
 * - Custom endpoints for demandas with business logic
 * - Notification system (email + WhatsApp)
 * - Scheduled job for deadline notifications
 */

const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Services
const notificationService = require('./services/notification.service');
const emailService = require('./services/email.service');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Enable CORS for all origins (configure properly in production)
server.use(cors());

// Default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Parse JSON body
server.use(jsonServer.bodyParser);

// Custom middleware for logging (useful for debugging)
server.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gera um ID único
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Busca um usuário pelo ID
 */
function getUsuarioById(db, id) {
  if (!id) return null;
  const usuarios = db.get('usuarios').value();
  return usuarios.find(u => u.id === id || u.id == id);
}

/**
 * Busca um template pelo ID
 */
function getTemplateById(db, id) {
  const templates = db.get('templates').value();
  // Template ID pode ser string ou número
  return templates.find(t => t.id == id || t.id === id);
}

/**
 * Busca uma demanda pelo ID
 */
function getDemandaById(db, id) {
  const demandas = db.get('demandas').value();
  return demandas.find(d => d.id == id || d.id === id);
}

/**
 * Busca o nome de uma tarefa pelo ID no template
 */
function getNomeTarefaById(template, tarefaId) {
  const tarefa = template.tarefas.find(t => t.id_tarefa === tarefaId);
  return tarefa ? tarefa.nome_tarefa : 'Tarefa';
}

/**
 * Retorna o responsável efetivo de uma tarefa
 * Se a tarefa tem responsavel_id próprio, usa esse
 * Senão, usa o responsável da demanda
 */
function getResponsavelEfetivoDaTarefa(tarefaStatus, demanda) {
  return tarefaStatus.responsavel_id || demanda.responsavel_id;
}

// ============================================================================
// CUSTOM ROUTES (before json-server router)
// ============================================================================

// Health check endpoint
server.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    database: 'json-server',
    features: ['notifications', 'deadline-checker']
  });
});

// API info endpoint
server.get('/api', (req, res) => {
  res.json({
    message: 'Demand Flow API',
    version: '1.1.0',
    endpoints: {
      usuarios: '/api/usuarios',
      templates: '/api/templates',
      demandas: '/api/demandas',
      'demandas/criar': '/api/demandas/criar (POST)',
      'demandas/atualizar': '/api/demandas/:id/atualizar (PATCH)',
    },
    documentation: 'https://github.com/typicode/json-server#routes'
  });
});

// Custom route for authentication (placeholder - implement properly for production)
server.post('/api/auth/login', (req, res) => {
  const { login, senha } = req.body;
  
  const db = router.db;
  const usuarios = db.get('usuarios').value();
  
  const usuario = usuarios.find(u => u.login === login && u.senha === senha);
  
  if (usuario) {
    const { senha: _, ...usuarioSemSenha } = usuario;
    res.json({
      success: true,
      usuario: usuarioSemSenha,
      token: 'mock-jwt-token-' + usuario.id
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

// ============================================================================
// CUSTOM ENDPOINT: Criar Demanda (com notificação)
// POST /api/demandas/criar
// ============================================================================
server.post('/api/demandas/criar', async (req, res) => {
  try {
    const { template_id, responsavel_id, campos_valores } = req.body;
    const db = router.db;

    // Validar dados
    if (!template_id || !responsavel_id) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'template_id e responsavel_id são obrigatórios'
      });
    }

    // Buscar template
    const template = getTemplateById(db, template_id);
    if (!template) {
      return res.status(404).json({
        error: 'Template não encontrado',
        message: `Template com ID ${template_id} não existe`
      });
    }

    // Buscar responsável
    const responsavel = getUsuarioById(db, responsavel_id);
    if (!responsavel) {
      return res.status(404).json({
        error: 'Responsável não encontrado',
        message: `Usuário com ID ${responsavel_id} não existe`
      });
    }

    // Calcular nome da demanda
    let nomeDemanda = template.nome;
    const campoComplementaNome = template.campos_preenchimento.find(c => c.complementa_nome);
    if (campoComplementaNome && campos_valores && campos_valores[campoComplementaNome.id_campo]) {
      nomeDemanda = `${template.nome} - ${campos_valores[campoComplementaNome.id_campo]}`;
    }

    // Calcular data de previsão
    const dataCriacao = new Date();
    const tempoMedio = template.tempo_medio || 7;
    const dataPrevisao = new Date(dataCriacao);
    dataPrevisao.setDate(dataPrevisao.getDate() + tempoMedio);

    // Criar demanda
    const novaDemanda = {
      id: generateId(),
      template_id: template_id,
      nome_demanda: nomeDemanda,
      status: 'Criada',
      prioridade: template.prioridade,
      responsavel_id: responsavel_id,
      tempo_esperado: tempoMedio,
      campos_preenchidos: campos_valores 
        ? Object.entries(campos_valores).map(([id_campo, valor]) => ({ id_campo, valor }))
        : [],
      tarefas_status: template.tarefas.map(t => ({
        id_tarefa: t.id_tarefa,
        concluida: false,
        responsavel_id: t.responsavel_id
      })),
      data_criacao: dataCriacao.toISOString(),
      data_previsao: dataPrevisao.toISOString(),
      data_finalizacao: null,
      prazo: true,
      observacoes: '',
      notificacao_prazo_enviada: false // Controle para notificação de prazo
    };

    // Salvar no banco
    db.get('demandas').push(novaDemanda).write();

    console.log(`\n✅ Demanda criada: ${novaDemanda.nome_demanda}`);

    // Enviar notificação ao responsável
    try {
      await notificationService.notificarNovaDemanda(novaDemanda, responsavel);
    } catch (notifError) {
      console.error('Erro ao enviar notificação:', notifError);
      // Não falha a requisição por erro de notificação
    }

    res.status(201).json(novaDemanda);
  } catch (error) {
    console.error('Erro ao criar demanda:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    });
  }
});

// ============================================================================
// CUSTOM ENDPOINT: Atualizar Demanda (com notificações)
// PATCH /api/demandas/:id/atualizar
// ============================================================================
server.patch('/api/demandas/:id/atualizar', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const db = router.db;

    // Buscar demanda atual
    const demandaAtual = getDemandaById(db, id);
    if (!demandaAtual) {
      return res.status(404).json({
        error: 'Demanda não encontrada',
        message: `Demanda com ID ${id} não existe`
      });
    }

    // Buscar template para referência
    const template = getTemplateById(db, demandaAtual.template_id);

    // Detectar mudanças que requerem notificação
    const notificacoes = [];

    // Verificar mudanças nas tarefas
    if (updates.tarefas_status && template) {
      for (const novoStatus of updates.tarefas_status) {
        const statusAntes = demandaAtual.tarefas_status.find(t => t.id_tarefa === novoStatus.id_tarefa);
        
        if (statusAntes) {
          // Responsável efetivo antes e depois
          const respAntes = getResponsavelEfetivoDaTarefa(statusAntes, demandaAtual);
          const respDepois = getResponsavelEfetivoDaTarefa(novoStatus, demandaAtual);
          
          // 1. Mudança de responsável da tarefa
          // Notifica apenas se o novo responsável é diferente do anterior
          // E se o novo responsável é diferente do responsável da demanda (senão não faz sentido notificar)
          if (respDepois !== respAntes && respDepois !== demandaAtual.responsavel_id) {
            const novoResponsavel = getUsuarioById(db, respDepois);
            if (novoResponsavel) {
              const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
              console.log(`   📌 Tarefa "${nomeTarefa}" atribuída para ${novoResponsavel.nome}`);
              notificacoes.push({
                tipo: 'tarefa_atribuida',
                tarefa: nomeTarefa,
                responsavel: novoResponsavel
              });
            }
          }

          // 2. Tarefa foi concluída
          if (novoStatus.concluida && !statusAntes.concluida) {
            // Quem concluiu é o responsável efetivo da tarefa
            const quemConcluidId = respDepois;
            
            // Só notifica o responsável da demanda se quem concluiu é diferente dele
            if (quemConcluidId && quemConcluidId !== demandaAtual.responsavel_id) {
              const responsavelDemanda = getUsuarioById(db, demandaAtual.responsavel_id);
              const quemConcluiu = getUsuarioById(db, quemConcluidId);
              
              if (responsavelDemanda && quemConcluiu) {
                const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
                console.log(`   ✅ Tarefa "${nomeTarefa}" concluída por ${quemConcluiu.nome} - notificando ${responsavelDemanda.nome}`);
                notificacoes.push({
                  tipo: 'tarefa_concluida',
                  tarefa: nomeTarefa,
                  responsavelDemanda,
                  quemConcluiu
                });
              }
            }
          }
        }
      }
    }

    // Calcular novo status baseado nas tarefas
    if (updates.tarefas_status) {
      const todasConcluidas = updates.tarefas_status.every(t => t.concluida);
      const algumaConcluida = updates.tarefas_status.some(t => t.concluida);

      if (todasConcluidas) {
        updates.status = 'Finalizada';
        if (!demandaAtual.data_finalizacao) {
          updates.data_finalizacao = new Date().toISOString();
          // Calcular se está dentro do prazo
          const finalizacao = new Date(updates.data_finalizacao);
          const previsao = new Date(demandaAtual.data_previsao);
          updates.prazo = finalizacao <= previsao;
        }
      } else if (algumaConcluida) {
        updates.status = 'Em Andamento';
        if (demandaAtual.status === 'Finalizada') {
          updates.data_finalizacao = null;
        }
      } else {
        updates.status = 'Criada';
        updates.data_finalizacao = null;
        updates.prazo = true;
      }
    }

    // Atualizar demanda no banco
    const demandaAtualizada = { ...demandaAtual, ...updates };
    db.get('demandas')
      .find(d => d.id == id || d.id === id)
      .assign(demandaAtualizada)
      .write();

    console.log(`\n✅ Demanda atualizada: ${demandaAtualizada.nome_demanda}`);

    // Enviar notificações
    for (const notif of notificacoes) {
      try {
        if (notif.tipo === 'tarefa_atribuida') {
          await notificationService.notificarTarefaAtribuida(
            notif.tarefa,
            demandaAtualizada,
            notif.responsavel
          );
        } else if (notif.tipo === 'tarefa_concluida') {
          await notificationService.notificarTarefaConcluida(
            notif.tarefa,
            demandaAtualizada,
            notif.responsavelDemanda,
            notif.quemConcluiu
          );
        }
      } catch (notifError) {
        console.error('Erro ao enviar notificação:', notifError);
      }
    }

    res.json(demandaAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar demanda:', error);
    res.status(500).json({
      error: 'Erro interno',
      message: error.message
    });
  }
});

// ============================================================================
// MIDDLEWARE: Interceptar POST /api/demandas para notificações
// (compatibilidade com frontend atual)
// ============================================================================
server.post('/api/demandas', async (req, res, next) => {
  // Continuar com o fluxo normal do json-server
  // Mas interceptar a resposta para enviar notificação
  const originalSend = res.send;
  res.send = async function(data) {
    try {
      const demandaCriada = JSON.parse(data);
      const db = router.db;
      const responsavel = getUsuarioById(db, demandaCriada.responsavel_id);
      
      if (responsavel) {
        console.log(`\n📬 Interceptado POST /api/demandas - enviando notificação...`);
        await notificationService.notificarNovaDemanda(demandaCriada, responsavel);
      }
    } catch (err) {
      console.error('Erro ao processar notificação pós-criação:', err);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// ============================================================================
// MIDDLEWARE: Interceptar PATCH /api/demandas/:id para notificações
// (compatibilidade com frontend atual)
// ============================================================================
server.patch('/api/demandas/:id', async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  const db = router.db;
  
  // Buscar estado atual antes da atualização
  const demandaAntes = getDemandaById(db, id);
  
  if (!demandaAntes) {
    return next();
  }
  
  // Armazenar para comparação
  req._demandaAntes = JSON.parse(JSON.stringify(demandaAntes)); // Deep copy
  req._template = getTemplateById(db, demandaAntes.template_id);
  req._updates = updates;
  
  // Interceptar resposta para enviar notificações
  const originalSend = res.send;
  res.send = async function(data) {
    try {
      const demandaDepois = JSON.parse(data);
      const demandaAntes = req._demandaAntes;
      const template = req._template;
      const updates = req._updates;
      
      if (demandaAntes && template && updates.tarefas_status) {
        console.log(`\n📬 Interceptado PATCH /api/demandas/${id} - verificando notificações...`);
        
        for (const novoStatus of updates.tarefas_status) {
          const statusAntes = demandaAntes.tarefas_status.find(t => t.id_tarefa === novoStatus.id_tarefa);
          
          if (statusAntes) {
            // Responsável efetivo antes e depois
            const respAntes = getResponsavelEfetivoDaTarefa(statusAntes, demandaAntes);
            const respDepois = getResponsavelEfetivoDaTarefa(novoStatus, demandaAntes);
            
            // 1. Mudança de responsável da tarefa
            if (respDepois !== respAntes && respDepois !== demandaAntes.responsavel_id) {
              const novoResponsavel = getUsuarioById(db, respDepois);
              if (novoResponsavel) {
                const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
                console.log(`   📌 Tarefa "${nomeTarefa}" atribuída para ${novoResponsavel.nome}`);
                await notificationService.notificarTarefaAtribuida(nomeTarefa, demandaDepois, novoResponsavel);
              }
            }
            
            // 2. Tarefa concluída por outro responsável
            if (novoStatus.concluida && !statusAntes.concluida) {
              const quemConcluidId = respDepois;
              
              if (quemConcluidId && quemConcluidId !== demandaAntes.responsavel_id) {
                const responsavelDemanda = getUsuarioById(db, demandaAntes.responsavel_id);
                const quemConcluiu = getUsuarioById(db, quemConcluidId);
                
                if (responsavelDemanda && quemConcluiu) {
                  const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
                  console.log(`   ✅ Tarefa "${nomeTarefa}" concluída por ${quemConcluiu.nome}`);
                  await notificationService.notificarTarefaConcluida(nomeTarefa, demandaDepois, responsavelDemanda, quemConcluiu);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao processar notificações pós-atualização:', err);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
});

// ============================================================================
// JSON-SERVER ROUTER
// ============================================================================
server.use('/api', router);

// Custom error handler
server.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================================================
// SCHEDULED JOB: Verificar demandas com prazo próximo (1 dia)
// Executa a cada hora - envia notificação apenas UMA VEZ por demanda
// ============================================================================
async function verificarPrazosProximos() {
  console.log('\n⏰ Executando verificação de prazos próximos...');
  
  try {
    const db = router.db;
    const demandas = db.get('demandas').value();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    let notificacoesEnviadas = 0;
    
    // Filtrar demandas não finalizadas com prazo próximo (vence amanhã)
    // E que ainda não receberam notificação de prazo
    for (const demanda of demandas) {
      // Pular se já finalizada
      if (demanda.status === 'Finalizada') continue;
      
      // Pular se já enviou notificação de prazo
      if (demanda.notificacao_prazo_enviada === true) {
        continue;
      }
      
      const dataPrevisao = new Date(demanda.data_previsao);
      dataPrevisao.setHours(0, 0, 0, 0);
      
      // Calcular diferença em dias
      const diffMs = dataPrevisao.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Se vence amanhã (1 dia)
      if (diffDias === 1) {
        const responsavel = getUsuarioById(db, demanda.responsavel_id);
        
        if (responsavel) {
          console.log(`   ⚠️ Demanda "${demanda.nome_demanda}" vence amanhã - notificando ${responsavel.nome}`);
          
          try {
            await notificationService.notificarPrazoProximo(demanda, responsavel);
            
            // Marcar que já enviou notificação de prazo
            db.get('demandas')
              .find(d => d.id == demanda.id || d.id === demanda.id)
              .assign({ notificacao_prazo_enviada: true })
              .write();
            
            notificacoesEnviadas++;
          } catch (notifError) {
            console.error(`   ❌ Erro ao notificar prazo da demanda ${demanda.id}:`, notifError.message);
          }
        }
      }
    }
    
    console.log(`   Notificações de prazo enviadas: ${notificacoesEnviadas}`);
    console.log('✅ Verificação de prazos concluída\n');
  } catch (error) {
    console.error('❌ Erro na verificação de prazos:', error);
  }
}

// Agendar verificação a cada hora
cron.schedule('0 * * * *', verificarPrazosProximos);

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                                                   ║');
  console.log('║         🚀 Demand Flow Backend Server            ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check:      http://localhost:${PORT}/health`);
  console.log(`📚 API docs:          http://localhost:${PORT}/api`);
  console.log('');
  console.log('📦 Database: JSON-Server (db.json)');
  console.log('⚡ Mode: MVP/Development');
  console.log('🔔 Notifications: Enabled (Email + WhatsApp)');
  console.log('⏰ Deadline checker: Running every hour');
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET    /api/usuarios');
  console.log('  POST   /api/usuarios');
  console.log('  GET    /api/templates');
  console.log('  POST   /api/templates');
  console.log('  GET    /api/demandas');
  console.log('  POST   /api/demandas');
  console.log('  POST   /api/demandas/criar       (custom with notifications)');
  console.log('  PATCH  /api/demandas/:id/atualizar (custom with notifications)');
  console.log('  POST   /api/auth/login');
  console.log('');
  
  // Verificar conexão SMTP
  console.log('🔌 Verificando conexão SMTP...');
  await emailService.verificarConexao();
  
  console.log('');
  console.log('💡 Tip: Use Postman or curl to test the API');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Executar verificação de prazos na inicialização
  setTimeout(verificarPrazosProximos, 5000);
});

module.exports = server;
