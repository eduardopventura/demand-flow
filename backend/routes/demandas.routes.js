/**
 * Demandas Routes
 * 
 * Rotas consolidadas para demandas (CRUD + ações)
 */

const express = require('express');
const router = express.Router();
const demandaService = require('../services/demanda.service');
const DemandaRepository = require('../src/repositories/demanda.repository');
const { asyncHandler } = require('../middlewares/error.middleware');
const { requireCargoPermission } = require('../middlewares/permissions.middleware');

/**
 * GET /api/demandas
 * Lista todas as demandas (com filtros opcionais)
 * Query params: status, responsavel_id, template_id
 */
router.get('/', asyncHandler(async (req, res) => {
  const filters = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.responsavel_id) filters.responsavel_id = req.query.responsavel_id;
  if (req.query.template_id) filters.template_id = req.query.template_id;
  
  const demandas = await DemandaRepository.findAll(filters);
  res.json(demandas);
}));

/**
 * GET /api/demandas/:id
 * Busca uma demanda por ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const demanda = await DemandaRepository.findById(id);
  
  if (!demanda) {
    return res.status(404).json({ message: 'Demanda não encontrada' });
  }
  
  res.json(demanda);
}));

/**
 * POST /api/demandas
 * Cria uma nova demanda
 * 
 * Body esperado do frontend (formato atual):
 * {
 *   template_id: string,
 *   nome_demanda: string,
 *   status: string,
 *   responsavel_id: string,
 *   tempo_esperado: number,
 *   campos_preenchidos: Array<{id_campo, valor}>,
 *   tarefas_status: Array<{id_tarefa, concluida, responsavel_id?}>,
 *   data_criacao: string,
 *   data_previsao: string,
 *   data_finalizacao: null,
 *   prazo: boolean,
 *   observacoes: string
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const body = req.body;
  const userId = req.user?.id;

  // Converter formato do frontend para formato do service
  // O frontend envia campos_preenchidos como array, convertemos para objeto
  let campos_valores = {};
  if (body.campos_preenchidos && Array.isArray(body.campos_preenchidos)) {
    for (const campo of body.campos_preenchidos) {
      campos_valores[campo.id_campo] = campo.valor;
    }
  }

  const novaDemanda = await demandaService.criarDemanda({
    template_id: body.template_id,
    responsavel_id: body.responsavel_id,
    campos_valores,
    userId
  });

  res.status(201).json(novaDemanda);
}));

/**
 * PATCH /api/demandas/:id
 * Atualiza uma demanda existente
 */
router.patch('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      message: 'É necessário estar autenticado para atualizar uma demanda'
    });
  }

  const demandaAtualizada = await demandaService.atualizarDemanda(id, updates, userId);

  res.json(demandaAtualizada);
}));

/**
 * DELETE /api/demandas/:id
 * Deleta uma demanda (requer permissão deletar_demandas)
 */
router.delete('/:id', requireCargoPermission('deletar_demandas'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      error: 'Usuário não autenticado',
      message: 'É necessário estar autenticado para deletar uma demanda',
    });
  }

  const result = await demandaService.deletarDemanda(id, userId);
  res.json(result);
}));

/**
 * POST /api/demandas/:id/tarefas/:taskId/executar
 * Executa uma ação automática de uma tarefa
 */
router.post('/:id/tarefas/:taskId/executar', asyncHandler(async (req, res) => {
  const { id, taskId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ 
      error: 'Usuário não autenticado',
      message: 'É necessário estar autenticado para executar uma ação'
    });
  }

  const resultado = await demandaService.executarAcaoTarefa(id, taskId, userId);

  res.json(resultado);
}));

module.exports = router;
