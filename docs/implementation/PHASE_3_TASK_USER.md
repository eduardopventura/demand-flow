# Fase 3: Controle de Responsáveis e Auditoria

**Status**: ⏳ Pendente  
**Prioridade**: 🟡 Média  
**Complexidade**: Média  
**Duração Estimada**: 4-5 dias

**Dependência**: Fase 2 (Login) deve estar completa

---

## 🎯 Objetivo

Implementar controle automático de responsáveis de tarefas baseado no usuário logado ao salvar demandas, garantindo que as notificações sejam acionadas corretamente. Adicionar rastreabilidade de modificações nas demandas com indicador visual discreto.

---

## ✅ Checklist de Implementação

### 1. Atualizar Schema do Banco

- [ ] Adicionar campo em `Demanda`:
  - [ ] `modificado_por_id` (foreign key → usuarios.id, nullable)
- [ ] Criar migration: `npx prisma migrate dev --name add_demanda_modificado_por`
- [ ] Validar schema atualizado

### 2. Backend - Lógica de Controle de Responsáveis

- [ ] Atualizar `demanda.service.js`:
  - [ ] Em `atualizarDemanda()`: antes de salvar, verificar se alguma `TarefaStatus` foi modificada
  - [ ] Para cada tarefa modificada: verificar se `responsavel_id` é diferente do `req.user.id`
  - [ ] Se diferente: atualizar `responsavel_id` para `req.user.id`
  - [ ] Registrar `modificado_por_id` com `req.user.id` ao salvar demanda
  - [ ] **IMPORTANTE**: Acionar notificações APENAS após validação e atualização de responsáveis
- [ ] Validar: não permitir salvar demanda sem usuário autenticado
- [ ] Atualizar queries para incluir dados do usuário modificador (joins)

### 3. Backend - Ordem de Processamento

- [ ] Garantir ordem correta:
  1. Receber atualização da demanda
  2. Verificar tarefas modificadas
  3. Atualizar responsáveis se necessário
  4. Salvar demanda com `modificado_por_id`
  5. Acionar notificações

### 4. Frontend - Atualizar Tipos

- [ ] Atualizar interface `Demanda` em `frontend/src/types/index.ts`:
  ```typescript
  export interface Demanda {
    // ... campos existentes ...
    modificado_por_id?: string;  // NOVO
    modificado_por?: Usuario;    // NOVO (relacionamento)
  }
  ```

### 5. Frontend - Exibição no Footer

- [ ] Atualizar `DetalhesDemandaModal.tsx`:
  - [ ] Adicionar no `DialogFooter` (canto esquerdo) indicador discreto
  - [ ] Mostrar "Modificado por: [Nome do Usuário]" em texto pequeno e discreto
  - [ ] Usar classe de texto muted/foreground para discreção
  - [ ] Exibir apenas se `modificado_por_id` existir
  - [ ] Formato: texto pequeno, cor discreta, alinhado à esquerda

### 6. Testes e Validação

- [ ] Testar salvamento de demanda com tarefas modificadas
- [ ] Validar que responsáveis são atualizados automaticamente
- [ ] Validar que `modificado_por_id` é preenchido automaticamente
- [ ] Testar tentativa de salvar sem autenticação (deve falhar)
- [ ] Validar que notificações são acionadas após atualização de responsáveis
- [ ] Validar que indicador aparece corretamente no frontend
- [ ] Testar com múltiplas tarefas modificadas simultaneamente

### 7. Documentação

- [ ] Documentar novos campos no schema
- [ ] Atualizar documentação da API (se existir)
- [ ] Documentar comportamento de atualização de responsáveis
- [ ] Documentar ordem de processamento e notificações

---

## 📁 Estrutura de Arquivos

```
backend/
├── prisma/
│   ├── schema.prisma (atualizar Demanda)
│   └── migrations/
│       └── [timestamp]_add_demanda_modificado_por/
└── src/
    └── services/
        └── demanda.service.js (atualizar)

frontend/
├── src/
│   ├── types/
│   │   └── index.ts (atualizar Demanda)
│   └── components/
│       └── modals/
│           └── DetalhesDemandaModal.tsx (atualizar footer)
```

---

## 🔧 Implementação Detalhada

### Schema Prisma Atualizado

```prisma
model Demanda {
  id                String   @id @default(uuid())
  template_id       String
  nome_demanda      String
  status            String
  responsavel_id    String
  tempo_esperado    Int
  data_criacao      DateTime @default(now())
  data_previsao     DateTime
  data_finalizacao  DateTime?
  prazo             Boolean  @default(true)
  observacoes       String?
  notificacao_prazo_enviada Boolean @default(false)
  modificado_por_id String?  // NOVO
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  
  template          Template @relation(fields: [template_id], references: [id])
  responsavel       Usuario  @relation("DemandaResponsavel", fields: [responsavel_id], references: [id])
  modificado_por    Usuario? @relation("DemandaModificada", fields: [modificado_por_id], references: [id]) // NOVO
  tarefas_status     TarefaStatus[]
  campos_preenchidos CampoPreenchido[]
  
  @@index([modificado_por_id]) // NOVO
}

model Usuario {
  // ... campos existentes ...
  demandas_modificadas Demanda[] @relation("DemandaModificada") // NOVO
}
```

### Backend - Atualizar Demanda Service

```javascript
// backend/src/services/demanda.service.js

async function atualizarDemanda(id, updates, userId) {
  // Buscar demanda atual
  const demandaAtual = await getDemandaById(id);
  if (!demandaAtual) {
    throw { status: 404, error: 'Demanda não encontrada' };
  }

  // IMPORTANTE: Verificar e atualizar responsáveis ANTES de salvar
  if (updates.tarefas_status && userId) {
    const tarefasStatusAtuais = demandaAtual.tarefas_status || [];
    
    updates.tarefas_status = updates.tarefas_status.map(tarefa => {
      // Verificar se esta tarefa foi modificada (comparar com estado atual)
      const tarefaAtual = tarefasStatusAtuais.find(
        t => t.id_tarefa === tarefa.id_tarefa
      );
      
      const foiModificada = !tarefaAtual || 
        tarefaAtual.concluida !== tarefa.concluida ||
        tarefaAtual.responsavel_id !== tarefa.responsavel_id;
      
      // Se tarefa foi modificada E responsável é diferente do usuário logado
      if (foiModificada && tarefa.responsavel_id && tarefa.responsavel_id !== userId) {
        // Atualizar responsável para o usuário logado
        return {
          ...tarefa,
          responsavel_id: userId
        };
      }
      
      return tarefa;
    });
  }

  // Registrar usuário que modificou
  updates.modificado_por_id = userId;

  // Salvar demanda
  const demandaAtualizada = await updateDemanda(id, updates, tarefasStatus, camposPreenchidos);

  // IMPORTANTE: Acionar notificações APENAS após salvar e atualizar responsáveis
  // (lógica de notificações existente continua aqui)
  if (updates.responsavel_id && updates.responsavel_id !== demandaAtual.responsavel_id) {
    try {
      await notificationService.notificarNovaDemandaParaResponsavel(
        demandaAtualizada, 
        updates.responsavel_id
      );
    } catch (err) {
      console.error('Erro ao notificar novo responsável da demanda:', err);
    }
  }

  if (tarefasStatus && template) {
    await processarNotificacoesTarefas(
      demandaAtual, 
      demandaAtualizada, 
      template, 
      tarefasStatus
    );
  }

  return demandaAtualizada;
}
```

### Frontend - Exibir no Footer

```tsx
// frontend/src/components/modals/DetalhesDemandaModal.tsx

// No DialogFooter, adicionar antes dos botões:
<DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-col sm:flex-row gap-2 sm:gap-0">
  {/* Indicador de último modificador - canto esquerdo */}
  {demanda.modificado_por && (
    <div className="flex-1 text-xs text-muted-foreground">
      Modificado por: {demanda.modificado_por.nome}
    </div>
  )}
  
  <div className="flex gap-2 w-full sm:w-auto">
    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
      Cancelar
    </Button>
    <Button onClick={handleSalvar} className="w-full sm:w-auto">
      Salvar
    </Button>
  </div>
</DialogFooter>
```

### Backend - Query com Join

```javascript
// Ao buscar demandas, incluir dados do modificador
const demanda = await prisma.demanda.findUnique({
  where: { id },
  include: {
    template: true,
    responsavel: true,
    modificado_por: {
      select: { id: true, nome: true, email: true }
    },
    tarefas_status: {
      include: {
        responsavel: {
          select: { id: true, nome: true }
        }
      }
    },
    campos_preenchidos: true
  }
});
```

---

## ⚠️ Pontos de Atenção

### Ordem de Processamento
- [ ] **CRÍTICO**: Verificar e atualizar responsáveis ANTES de salvar
- [ ] **CRÍTICO**: Acionar notificações APENAS após salvar e atualizar responsáveis
- [ ] Garantir que todas as validações ocorram antes das notificações

### Validação
- [ ] Não permitir salvar demanda sem usuário autenticado
- [ ] Validar que `req.user` existe antes de usar
- [ ] Tratar caso de usuário deletado (modificado_por_id pode ser null)
- [ ] Comparar corretamente estado anterior vs novo estado das tarefas

### Performance
- [ ] Queries com joins podem ser mais lentas - considerar índices
- [ ] Cache de usuários no frontend para evitar múltiplas queries
- [ ] Evitar loops desnecessários na comparação de tarefas

### UX
- [ ] Indicador no footer deve ser discreto e não interferir na usabilidade
- [ ] Texto pequeno e cor muted para não chamar atenção excessiva
- [ ] Alinhado à esquerda conforme especificado

---

## 🧪 Testes de Validação

- [ ] Salvar demanda com tarefa modificada → responsável atualizado para usuário logado
- [ ] Salvar demanda sem autenticação → erro 401
- [ ] Salvar demanda com múltiplas tarefas modificadas → todas atualizadas corretamente
- [ ] Frontend exibe nome do modificador corretamente no footer
- [ ] Notificações são acionadas após atualização de responsáveis
- [ ] Query com join retorna dados do usuário modificador
- [ ] Tarefa com responsável igual ao usuário logado → não altera
- [ ] Tarefa sem responsável → não altera (mantém null)

---

## 📚 Referências

- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Prisma Include](https://www.prisma.io/docs/concepts/components/prisma-client/select-fields)

---

**Próxima Fase**: [Fase 4: Sistema de Cargos e Permissões](./PHASE_4_ROLES.md)  
**Fase Anterior**: [Fase 2: Login](./PHASE_2_AUTH.md)  
**Voltar**: [Plano de Implementação](../IMPLEMENTATION_PHASES.md)
