/**
 * Demandas Routes
 * 
 * Rotas consolidadas para demandas (CRUD + ações)
 */

const express = require('express');
const router = express.Router();
const demandaService = require('../services/demanda.service');
const { asyncHandler } = require('../middlewares/error.middleware');

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
  const db = req.app.get('db');
  const body = req.body;

  // Converter formato do frontend para formato do service
  // O frontend envia campos_preenchidos como array, convertemos para objeto
  let campos_valores = {};
  if (body.campos_preenchidos && Array.isArray(body.campos_preenchidos)) {
    for (const campo of body.campos_preenchidos) {
      campos_valores[campo.id_campo] = campo.valor;
    }
  }

  const novaDemanda = await demandaService.criarDemanda(db, {
    template_id: body.template_id,
    responsavel_id: body.responsavel_id,
    campos_valores
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
  const db = req.app.get('db');

  const demandaAtualizada = await demandaService.atualizarDemanda(db, id, updates);

  res.json(demandaAtualizada);
}));

/**
 * POST /api/demandas/:id/tarefas/:taskId/executar
 * Executa uma ação automática de uma tarefa
 */
router.post('/:id/tarefas/:taskId/executar', asyncHandler(async (req, res) => {
  const { id, taskId } = req.params;
  const db = req.app.get('db');

  const resultado = await demandaService.executarAcaoTarefa(db, id, taskId);

  res.json(resultado);
}));

module.exports = router;
