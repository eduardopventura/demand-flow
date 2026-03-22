import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Settings2 } from "lucide-react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { DemandaCard } from "@/components/kanban/DemandaCard";
import { NovaDemandaModal } from "@/components/modals/NovaDemandaModal";
import { DetalhesDemandaModal } from "@/components/modals/DetalhesDemandaModal";
import { GerenciarColunasModal } from "@/components/modals/GerenciarColunasModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Demanda } from "@/types";
import { STATUS_FIXOS } from "@/types";
import { buildStatusConfig } from "@/constants";
import { ordenarDemandasCriadasOuEmAndamento, ordenarDemandasFinalizadas } from "@/utils/prazoUtils";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/utils/permissions";
import { log } from "@/utils/logger";

export default function PainelDemandas() {
  const { demandas, updateDemanda, colunasKanban } = useData();
  const { user } = useAuth();
  const canManageKanban = hasPermission(user, "gerenciar_kanban");
  const hasLoggedConnection = useRef(false);
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [gerenciarColunasOpen, setGerenciarColunasOpen] = useState(false);
  const [demandaSelecionadaId, setDemandaSelecionadaId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(STATUS_FIXOS.CRIADA);
  const [pendingMove, setPendingMove] = useState<{ demandaId: string; newStatus: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    if (demandas.length >= 0 && !hasLoggedConnection.current) {
      const apiUrl = window.location.origin + '/api';
      log("✅ [FRONTEND] Conectado ao backend com sucesso!");
      log(`🔗 [FRONTEND] API URL: ${apiUrl}`);
      log(`📊 [FRONTEND] Dados carregados: ${demandas.length} demandas disponíveis`);
      log(`⏰ [FRONTEND] Timestamp: ${new Date().toLocaleString('pt-BR')}`);
      hasLoggedConnection.current = true;
    }
  }, [demandas.length]);

  const statusConfig = useMemo(() => buildStatusConfig(colunasKanban), [colunasKanban]);

  const totalFinalizadas = useMemo(() => {
    return demandas.filter((d) => d.status === STATUS_FIXOS.FINALIZADA).length;
  }, [demandas]);

  const demandaPorStatus = useMemo(() => {
    const result: Record<string, Demanda[]> = {};
    for (const col of colunasKanban) {
      const filtered = demandas.filter((d) => d.status === col.nome);
      if (col.nome === STATUS_FIXOS.FINALIZADA) {
        result[col.nome] = ordenarDemandasFinalizadas(filtered).slice(0, 15);
      } else {
        result[col.nome] = ordenarDemandasCriadasOuEmAndamento(filtered);
      }
    }
    return result;
  }, [demandas, colunasKanban]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const demandaId = active.id as string;
    const newStatus = over.id as string;

    const demanda = demandas.find((d) => d.id === demandaId);
    if (demanda && demanda.status !== newStatus) {
      // Block: cannot move back to "Criada"
      if (newStatus === STATUS_FIXOS.CRIADA && demanda.status !== STATUS_FIXOS.CRIADA) {
        toast.error("Não é possível voltar uma demanda para o status 'Criada' após ela ter sido movida para outro status");
        return;
      }

      // Moving FROM Finalizada: show confirmation
      if (demanda.status === STATUS_FIXOS.FINALIZADA) {
        setPendingMove({ demandaId, newStatus });
      } else if (newStatus === STATUS_FIXOS.FINALIZADA) {
        updateDemanda(demandaId, { 
          status: newStatus,
          data_finalizacao: new Date().toISOString()
        });
      } else {
        // Any intermediate column transition
        const updates: Partial<Demanda> = { status: newStatus };
        if (demanda.data_finalizacao) {
          updates.data_finalizacao = null;
        }
        updateDemanda(demandaId, updates);
      }
    }
  }, [demandas, updateDemanda]);

  const handleConfirmMoveFromFinalizada = useCallback(() => {
    if (pendingMove) {
      updateDemanda(pendingMove.demandaId, { 
        status: pendingMove.newStatus,
        data_finalizacao: null,
      });
      setPendingMove(null);
    }
  }, [pendingMove, updateDemanda]);

  const handleCancelMoveFromFinalizada = useCallback(() => {
    setPendingMove(null);
  }, []);

  const activeDemanda = useMemo(
    () => (activeId ? demandas.find((d) => d.id === activeId) : null),
    [activeId, demandas]
  );

  const demandaSelecionada = useMemo(
    () => (demandaSelecionadaId ? demandas.find((d) => d.id === demandaSelecionadaId) ?? null : null),
    [demandaSelecionadaId, demandas]
  );

  const colCount = colunasKanban.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Painel de Demandas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie todas as demandas em um quadro Kanban
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManageKanban && (
              <Button variant="outline" onClick={() => setGerenciarColunasOpen(true)} className="gap-2">
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">Colunas</span>
              </Button>
            )}
            <Button onClick={() => setNovaDemandaOpen(true)} size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="w-5 h-5" />
              <span className="sm:inline">Nova Demanda</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Kanban Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto hidden lg:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="grid gap-6 h-full"
            style={{ gridTemplateColumns: `repeat(${colCount}, minmax(280px, 1fr))` }}
          >
            {colunasKanban.map((col) => (
              <KanbanColumn
                key={col.id}
                columnName={col.nome}
                config={statusConfig[col.nome] || { bg: "bg-muted", border: "border-muted", label: col.nome }}
                demandas={demandaPorStatus[col.nome] || []}
                onCardClick={(d) => setDemandaSelecionadaId(d.id)}
                totalCount={col.nome === STATUS_FIXOS.FINALIZADA ? totalFinalizadas : undefined}
                showViewAllLink={col.nome === STATUS_FIXOS.FINALIZADA && totalFinalizadas > 15}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDemanda && <DemandaCard demanda={activeDemanda} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile/Tablet Tabs View */}
      <div className="flex-1 overflow-hidden lg:hidden flex flex-col">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="flex flex-col h-full"
        >
          <div className="px-4 pt-4 bg-background sticky top-0 z-10">
            <TabsList className={cn("w-full grid", `grid-cols-${Math.min(colCount, 5)}`)}>
              {colunasKanban.map((col) => {
                const config = statusConfig[col.nome];
                const count = (demandaPorStatus[col.nome] || []).length;
                return (
                  <TabsTrigger 
                    key={col.id} 
                    value={col.nome}
                    className="text-xs sm:text-sm flex gap-1 items-center"
                  >
                    <span className="truncate">{col.nome}</span>
                    {config && (
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        config.bg
                      )}>
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {colunasKanban.map((col) => (
              <TabsContent 
                key={col.id} 
                value={col.nome} 
                className="flex-1 overflow-auto px-4 pb-4 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <KanbanColumn
                  columnName={col.nome}
                  config={statusConfig[col.nome] || { bg: "bg-muted", border: "border-muted", label: col.nome }}
                  demandas={demandaPorStatus[col.nome] || []}
                  onCardClick={(d) => setDemandaSelecionadaId(d.id)}
                  isMobile
                />
              </TabsContent>
            ))}

            <DragOverlay>
              {activeDemanda && <DemandaCard demanda={activeDemanda} isDragging />}
            </DragOverlay>
          </DndContext>
        </Tabs>
      </div>

      <NovaDemandaModal open={novaDemandaOpen} onOpenChange={setNovaDemandaOpen} />
      <DetalhesDemandaModal
        demanda={demandaSelecionada}
        open={!!demandaSelecionada}
        onOpenChange={(open) => !open && setDemandaSelecionadaId(null)}
      />
      {canManageKanban && (
        <GerenciarColunasModal
          open={gerenciarColunasOpen}
          onOpenChange={setGerenciarColunasOpen}
        />
      )}

      {/* Confirmation Dialog for moving from Finalizada */}
      <AlertDialog open={!!pendingMove} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent className="mx-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir Demanda</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Esta demanda já foi finalizada. Ao movê-la para outro status, a data de finalização será removida e as regras de prazo serão aplicadas novamente.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tem certeza que deseja continuar?
            </p>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleCancelMoveFromFinalizada} className="w-full sm:w-auto">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMoveFromFinalizada} className="w-full sm:w-auto">
              Sim, reabrir demanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
