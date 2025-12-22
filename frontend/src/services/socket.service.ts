import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types";
import { log, error as logError } from "@/utils/logger";

function getDefaultSocketUrl(): string {
  const envUrl = (import.meta.env.VITE_WS_URL as string | undefined) || "";
  if (envUrl) return envUrl;

  if (typeof window !== "undefined") {
    // Preferir mesma origem: Nginx/Vite fazem proxy de /socket.io para o backend
    return window.location.origin;
  }

  return "http://localhost:3060";
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(token: string) {
    if (!token) return;

    // Recriar conexão se já existir (garante token atualizado)
    if (this.socket) {
      this.disconnect();
    }

    const url = getDefaultSocketUrl();

    this.socket = io<ServerToClientEvents, ClientToServerEvents>(url, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on("connect", () => {
      log("✅ [WS] Conectado");
    });

    this.socket.on("disconnect", (reason) => {
      log("❌ [WS] Desconectado:", reason);
    });

    this.socket.on("connect_error", (err) => {
      logError("❌ [WS] Erro de conexão:", err?.message || err);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  on<E extends keyof ServerToClientEvents>(event: E, handler: ServerToClientEvents[E]) {
    this.socket?.on(event, handler);
  }

  off<E extends keyof ServerToClientEvents>(event: E, handler?: ServerToClientEvents[E]) {
    // socket.io permite off sem handler para remover todos listeners do evento
    // mas o tipo do TS exige handler; então fazemos cast seguro aqui.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket?.off(event as any, handler as any);
  }

  isConnected(): boolean {
    return !!this.socket?.connected;
  }
}

export const socketService = new SocketService();


