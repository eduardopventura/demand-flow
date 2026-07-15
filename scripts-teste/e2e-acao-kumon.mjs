/**
 * E2E: Ação de sistema do demand-flow → POST /api/v1/students/import-mol do kumon.
 *
 * Usa a Ação FIXA "Realizar Cadastro Kumon" (slug kumon_cadastro), semeada quando
 * SISTEMA_GESTAO_KUMON=true. Cria Template + Demanda (com o PDF do MOL), executa a
 * tarefa e reporta o resultado.
 *
 * Pré-requisitos:
 *   - Demand-flow com SISTEMA_GESTAO_KUMON=true e KUMON_API_KEY configurada.
 *   - A URL da Ação apontando para o endpoint do kumon (editável na tela de Ações).
 *
 * Uso: MOL_PDF=/caminho/mol-preenchido.pdf node scripts-teste/e2e-acao-kumon.mjs
 */
import { readFile } from 'node:fs/promises';

const DF = 'http://localhost:3000/api'; // backend do demand-flow (exposto em dev)
const KUMON_SLUG = 'kumon_cadastro';
const MOL_PDF = process.env.MOL_PDF; // caminho de um PDF do MOL preenchido

let token = '';

async function api(path, opts = {}) {
  const res = await fetch(DF + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) {
    throw new Error(`${opts.method || 'GET'} ${path} => ${res.status}\n${JSON.stringify(body, null, 2)}`);
  }
  return body;
}

const step = (n, msg) => console.log(`\n[${n}] ${msg}`);

// --- 1) Login -----------------------------------------------------------------
step(1, 'Login no demand-flow (admin/password)...');
const login = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ login: 'admin', senha: 'password' }),
});
token = login.token;
const userId = login.usuario?.id || login.user?.id;
console.log('    OK — usuário:', userId);

// --- 2) Buscar a Ação fixa do Kumon ------------------------------------------
step(2, 'Buscando a Ação de sistema "Realizar Cadastro Kumon"...');
const acoes = await api('/acoes');
const acao = acoes.find((a) => a.slug === KUMON_SLUG);
if (!acao) {
  throw new Error(
    'Ação de sistema Kumon não encontrada. Garanta SISTEMA_GESTAO_KUMON=true e rode o init-db (seed).',
  );
}
console.log('    OK — Ação:', acao.id, '| fixa:', acao.fixa, '| url:', acao.url);
console.log('    segredo vazou na resposta?', JSON.stringify(acao).includes('kmn_') ? 'SIM (RUIM!)' : 'não ✅');

// --- 3) Upload do PDF do MOL --------------------------------------------------
step(3, 'Enviando o PDF do MOL...');
if (!MOL_PDF) {
  throw new Error('Defina MOL_PDF=/caminho/para/mol-preenchido.pdf antes de rodar.');
}
const pdfBuffer = await readFile(MOL_PDF);
const uploadForm = new FormData();
uploadForm.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), 'mol-preenchido.pdf');
const uploadRes = await fetch(DF + '/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: uploadForm,
});
const upload = await uploadRes.json();
if (!uploadRes.ok) throw new Error(`upload => ${uploadRes.status}\n${JSON.stringify(upload, null, 2)}`);
console.log('    OK — arquivo:', upload.path);

// --- 4) Criar o Template com a tarefa vinculada à Ação -----------------------
step(4, 'Criando o Template espelhando os campos da Ação...');
const abaId = 'aba1';
// Campos da demanda espelham os da Ação (usa texto; a coerção final é feita pelo handler do Kumon).
const camposDemanda = acao.campos.map((c) => ({
  id_campo: 'd_' + c.id_campo,
  nome_campo: c.nome_campo,
  tipo_campo: 'texto',
  obrigatorio_criacao: false,
  complementa_nome: c.id_campo === 'escola',
  abas_ids: [abaId],
}));
const mapeamento = Object.fromEntries(acao.campos.map((c) => [c.id_campo, 'd_' + c.id_campo]));

const template = await api('/templates', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'Cadastro Kumon via MOL (teste E2E)',
    tempo_medio: 3,
    abas: [{ id: abaId, nome: 'Dados', ordem: 0 }],
    campos_preenchimento: camposDemanda,
    tarefas: [{
      id_tarefa: 't_cadastrar',
      nome_tarefa: 'Cadastrar aluno no Kumon',
      link_pai: null,
      acao_id: acao.id,
      mapeamento_campos: mapeamento,
    }],
  }),
});
console.log('    OK — Template:', template.id);

// --- 5) Criar a Demanda com os campos preenchidos ----------------------------
step(5, 'Criando a Demanda (só campos não extraídos do MOL + o PDF)...');
// Valores canônicos por id_campo da Ação (o handler traduz/coage).
const valores = {
  escola: 'Escola Municipal Teste',
  needs_attention: 'Não',
  matricula_valor: '250',
  mensalidade_valor: '480,00',
  contrato_data_inicio: '13/07/2026',       // BR → 2026-07-13
  contrato_data_ksis: '2026-07-13',
  contrato_tipo: 'resp_sem_imagem',
  contrato_tipo_fidelidade: '12 Meses',     // → fidelidade: true, mesesFidelidade: 12
  contrato_forma_recorrencia: 'Boleto Bancário', // → boleto
  fp_data: '2026-07-15',
  fp_forma: 'pix',
  fp_status: 'nao_pago',
  cep: '01234-567',
  dia1: '2',
  hora1: '14:00',
  mod1: 'P',                                 // → in_person
  arquivo_mol: upload.path,
};
const campos_preenchidos = acao.campos
  .filter((c) => valores[c.id_campo] !== undefined)
  .map((c) => ({ id_campo: 'd_' + c.id_campo, valor: String(valores[c.id_campo]) }));

const demanda = await api('/demandas', {
  method: 'POST',
  body: JSON.stringify({
    template_id: template.id,
    responsavel_id: userId,
    campos_preenchidos,
  }),
});
console.log('    OK — Demanda:', demanda.id);

// --- 6) Executar a Ação -------------------------------------------------------
step(6, 'Executando a tarefa (dispara a chamada real ao kumon)...');
try {
  const exec = await api(`/demandas/${demanda.id}/tarefas/t_cadastrar/executar`, { method: 'POST' });
  console.log('    ✅ SUCESSO:', exec.message, '| HTTP do kumon:', exec.webhookStatus);
  const tarefa = exec.demanda?.tarefas_status?.find((t) => t.id_tarefa === 't_cadastrar');
  console.log('    tarefa concluída?', tarefa?.concluida ? 'SIM ✅' : 'não ❌');
  console.log('    status da demanda:', exec.demanda?.status);
} catch (e) {
  console.log('    ❌ FALHOU:\n' + e.message);
}
