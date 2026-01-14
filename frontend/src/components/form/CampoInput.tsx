/**
 * Componente reutilizável para renderizar campos de preenchimento
 * baseado no tipo de campo definido no template
 */

import { useState, useRef, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileCheck, X, Download } from "lucide-react";
import { apiService } from "@/services/api.service";
import { toast } from "sonner";
import type { CampoPreenchimento } from "@/types";
import { error as logError } from "@/utils/logger";

interface CampoInputProps {
  campo: CampoPreenchimento;
  value: string;
  onChange: (value: string) => void;
  showCurrentValue?: boolean; // Para mostrar valor atual em campos de arquivo
}

export const CampoInput = memo(function CampoInput({ campo, value, onChange, showCurrentValue = false }: CampoInputProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler de upload de arquivo
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await apiService.uploadFile(file);
      onChange(result.path); // Salva o caminho completo (ex: /uploads/arquivo-123.pdf)
      toast.success(`Arquivo "${result.originalName}" enviado com sucesso!`);
    } catch (error) {
      logError("Erro no upload:", error);
      toast.error("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  // Extrair nome do arquivo do path
  const getFileName = (path: string) => {
    if (!path) return "";
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  switch (campo.tipo_campo) {
    case "numero":
      return (
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            // Permitir apenas números (incluindo negativos e decimais com ponto)
            const val = e.target.value;
            if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
              onChange(val);
            }
          }}
          onKeyPress={(e) => {
            // Bloquear caracteres não numéricos (exceto ponto, vírgula, menos e backspace)
            const char = String.fromCharCode(e.which || e.keyCode);
            if (!/[0-9.\-,]/.test(char) && e.which !== 8 && e.which !== 0) {
              e.preventDefault();
            }
          }}
          placeholder={campo.obrigatorio_criacao ? "Obrigatório" : "Opcional"}
        />
      );
    
    case "data": {
      // Converter string para Date se existir valor válido
      let dateValue: Date | null = null;
      if (value) {
        const parsed = new Date(value);
        dateValue = isNaN(parsed.getTime()) ? null : parsed;
      }
      
      return (
        <DatePicker
          selected={dateValue}
          onChange={(date) => {
            // Salvar como ISO string (YYYY-MM-DD) para compatibilidade com backend
            onChange(date ? date.toISOString().split('T')[0] : "");
          }}
          placeholder={campo.obrigatorio_criacao ? "Selecione uma data" : "Data (opcional)"}
        />
      );
    }
    
    case "arquivo":
      return (
        <div className="space-y-2">
          {/* Arquivo já enviado */}
          {value && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
              <FileCheck className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-sm truncate flex-1" title={value}>
                {getFileName(value)}
              </span>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => window.open(value, "_blank")}
                  title="Baixar arquivo"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => {
                    onChange("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  title="Remover arquivo"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Input de upload */}
          <div className="relative">
            <Input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando arquivo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {value ? "Substituir arquivo" : "Selecionar arquivo"}
                </>
              )}
            </Button>
          </div>
        </div>
      );
    
    case "numero_decimal":
      // Formatação decimal brasileira (vírgula, 2 decimais)
      // Lógica: digitação da direita (200 = 2,00, 20000 = 200,00)
      const formatarDecimal = (val: string): string => {
        // Remove tudo que não é número
        const apenasNumeros = val.replace(/\D/g, "");
        if (apenasNumeros === "") return "";
        
        // Converte para número e divide por 100 para ter 2 decimais
        const numero = parseInt(apenasNumeros, 10) / 100;
        
        // Formata com vírgula e 2 decimais
        return numero.toFixed(2).replace(".", ",");
      };

      const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Permitir apenas números e vírgula
        if (val === "" || /^\d*,\d{0,2}$|^\d+$/.test(val)) {
          onChange(val);
        }
      };

      const handleDecimalKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const char = String.fromCharCode(e.which || e.keyCode);
        // Permitir apenas números, vírgula, backspace, delete, setas
        if (!/[0-9,]/.test(char) && e.which !== 8 && e.which !== 46 && e.which !== 37 && e.which !== 39 && e.which !== 0) {
          e.preventDefault();
        }
      };

      const handleDecimalBlur = () => {
        // Ao perder o foco, formatar o valor
        if (value && value.trim() !== "") {
          const apenasNumeros = value.replace(/\D/g, "");
          if (apenasNumeros !== "") {
            const formatado = formatarDecimal(apenasNumeros);
            onChange(formatado);
          }
        }
      };

      return (
        <Input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleDecimalChange}
          onKeyPress={handleDecimalKeyPress}
          onBlur={handleDecimalBlur}
          placeholder={campo.obrigatorio_criacao ? "Ex: 0,00" : "Opcional"}
        />
      );
    
    case "dropdown":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            {campo.opcoes_dropdown?.map((opcao: string) => (
              <SelectItem key={opcao} value={opcao}>
                {opcao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    
    default: // texto
      return (
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={campo.obrigatorio_criacao ? "Obrigatório" : "Opcional"}
        />
      );
  }
});

