import { useEffect, useState, useRef, useCallback } from "react";
import type { AbaTemplate } from "@/types";
import { cn } from "@/lib/utils";

interface StickyTabsProps {
  abas: AbaTemplate[];
  abaAtiva: string;
  onAbaChange: (abaId: string) => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

/**
 * StickyTabs - Componente de abas fixas no cabeçalho
 * 
 * Aparece apenas quando o elemento sentinel (a TabsList original) 
 * sai da área visível ao scrollar para baixo.
 */
export const StickyTabs = ({
  abas,
  abaAtiva,
  onAbaChange,
  sentinelRef,
  className,
}: StickyTabsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    // Mostrar sticky tabs quando o sentinel NÃO está visível
    setIsVisible(!entry.isIntersecting);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // viewport
      rootMargin: "0px",
      threshold: 0,
    });

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sentinelRef, handleIntersection]);

  if (!isVisible || abas.length <= 1) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm transition-all duration-200",
        "animate-in slide-in-from-top-2 fade-in-0",
        className
      )}
    >
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-none">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => onAbaChange(aba.id)}
            className={cn(
              "flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200",
              abaAtiva === aba.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {aba.nome}
          </button>
        ))}
      </div>
    </div>
  );
};

