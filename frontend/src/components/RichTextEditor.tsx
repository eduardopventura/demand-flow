import { useRef, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Underline,
  Strikethrough,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const PRESET_COLORS = [
  "#000000", "#374151", "#6b7280",
  "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f59e0b",
];

function getTextLength(html: string): number {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").length;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = "",
  maxLength = 500,
  className,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [colorOpen, setColorOpen] = useState(false);
  const savedSelection = useRef<Range | null>(null);
  const pendingColor = useRef(false);

  useEffect(() => {
    setActiveColor("#000000");
  }, []);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    const html = el.innerHTML;
    const textLen = getTextLength(html);

    if (maxLength && textLen > maxLength) {
      el.innerHTML = value;
      return;
    }

    isInternalChange.current = true;

    const cleanHtml = html === "<br>" || html === "<div><br></div>" ? "" : html;
    onChange(cleanHtml);
  }, [onChange, maxLength, value]);

  const execFormat = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  }, []);

  const applyColor = useCallback((color: string) => {
    setActiveColor(color);
    restoreSelection();
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      pendingColor.current = true;
    } else {
      document.execCommand("foreColor", false, color);
      handleInput();
    }
    setColorOpen(false);
  }, [restoreSelection, handleInput]);

  const applyPendingColor = useCallback(() => {
    if (!pendingColor.current) return;
    pendingColor.current = false;
    document.execCommand("foreColor", false, activeColor);
  }, [activeColor]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") {
        e.preventDefault();
        execFormat("bold");
        return;
      } else if (e.key === "u") {
        e.preventDefault();
        execFormat("underline");
        return;
      }
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      applyPendingColor();
    }
  }, [execFormat, applyPendingColor]);

  const handleFocus = useCallback(() => {
    if (pendingColor.current) return;
    pendingColor.current = true;
  }, []);

  const textLen = getTextLength(value);
  const isEmpty = textLen === 0;

  return (
    <div className={cn("rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
      <div className="flex items-center gap-0.5 border-b px-2 py-1 bg-muted/30">
        <ToolbarButton
          icon={<Bold className="w-3.5 h-3.5" />}
          tooltip="Negrito (Ctrl+B)"
          onClick={() => execFormat("bold")}
        />
        <ToolbarButton
          icon={<Underline className="w-3.5 h-3.5" />}
          tooltip="Sublinhado (Ctrl+U)"
          onClick={() => execFormat("underline")}
        />
        <ToolbarButton
          icon={<Strikethrough className="w-3.5 h-3.5" />}
          tooltip="Tachado"
          onClick={() => execFormat("strikeThrough")}
        />

        <div className="w-px h-4 bg-border mx-1" />

        <Popover open={colorOpen} onOpenChange={(open) => {
          if (open) saveSelection();
          setColorOpen(open);
        }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md h-7 w-7 text-sm hover:bg-muted transition-colors"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-0.5">
                    <Palette className="w-3.5 h-3.5" />
                    <div
                      className="w-3.5 h-0.5 rounded-full"
                      style={{ backgroundColor: activeColor }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Cor da fonte</p></TooltipContent>
              </Tooltip>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start" sideOffset={4}>
            <div className="grid grid-cols-4 gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                    activeColor === color ? "border-ring ring-1 ring-ring" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => applyColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <span className={cn(
            "text-xs",
            textLen > maxLength ? "text-destructive" : "text-muted-foreground"
          )}>
            {textLen}/{maxLength}
          </span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="min-h-[60px] max-h-[120px] overflow-y-auto px-3 py-2 text-sm outline-none"
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
        />
        {isEmpty && (
          <div className="absolute top-2 left-3 text-sm text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
};

function ToolbarButton({
  icon,
  tooltip,
  onClick,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          className="inline-flex items-center justify-center rounded-md h-7 w-7 text-sm hover:bg-muted transition-colors"
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent><p className="text-xs">{tooltip}</p></TooltipContent>
    </Tooltip>
  );
}
