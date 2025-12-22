import type { Demanda } from "./index";

export type SocketEventMeta = {
  actorId?: string;
  timestamp?: string;
};

export type DemandaCreatedEvent = {
  demanda: Demanda;
  meta?: SocketEventMeta;
};

export type DemandaUpdatedEvent = {
  demanda: Demanda;
  meta?: SocketEventMeta;
};

export type DemandaDeletedEvent = {
  id: string;
  meta?: SocketEventMeta;
};

export type TarefaFinalizadaEvent = {
  demandaId: string;
  tarefaId: string;
  meta?: SocketEventMeta;
};

export interface ServerToClientEvents {
  "demanda:created": (payload: DemandaCreatedEvent) => void;
  "demanda:updated": (payload: DemandaUpdatedEvent) => void;
  "demanda:deleted": (payload: DemandaDeletedEvent) => void;
  "tarefa:finalizada": (payload: TarefaFinalizadaEvent) => void;
}

export interface ClientToServerEvents {
  // reservado para futuras features (rooms, presence, typing, etc.)
}


