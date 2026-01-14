import * as React from "react";
import ReactDatePicker, { registerLocale, setDefaultLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/utils/prazoUtils";
import "react-datepicker/dist/react-datepicker.css";

// Registrar locale pt-BR
registerLocale("pt-BR", ptBR);
setDefaultLocale("pt-BR");

export interface DatePickerProps {
  /** Data selecionada */
  selected?: Date | null;
  /** Callback quando data é alterada */
  onChange: (date: Date | null) => void;
  /** Placeholder quando não há data selecionada */
  placeholder?: string;
  /** Desabilitar o componente */
  disabled?: boolean;
  /** Classe CSS adicional para o container */
  className?: string;
  /** Classe CSS adicional para o trigger/botão */
  triggerClassName?: string;
  /** Data mínima permitida */
  minDate?: Date;
  /** Data máxima permitida */
  maxDate?: Date;
  /** Mostrar seletor de hora */
  showTimeSelect?: boolean;
  /** Formato de exibição da data */
  dateFormat?: string;
  /** Se o popover abre inline */
  inline?: boolean;
  /** Callback quando popover abre */
  onCalendarOpen?: () => void;
  /** Callback quando popover fecha */
  onCalendarClose?: () => void;
}

/**
 * DatePicker component com estilo shadcn/ui
 * 
 * Usa react-datepicker internamente com:
 * - Locale pt-BR
 * - Input manual de data (DD/MM/YYYY)
 * - Validação de ano (1900-2100)
 * - Estilização consistente com shadcn/ui
 */
export function DatePicker({
  selected,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  className,
  triggerClassName,
  minDate,
  maxDate,
  showTimeSelect = false,
  dateFormat = "dd/MM/yyyy",
  inline = false,
  onCalendarOpen,
  onCalendarClose,
}: DatePickerProps) {
  // Validar e limitar ano entre 1900 e 2100
  const handleChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      if (year < 1900 || year > 2100) {
        // Corrigir ano para limites válidos
        const correctedDate = new Date(date);
        correctedDate.setFullYear(Math.min(Math.max(year, 1900), 2100));
        onChange(correctedDate);
        return;
      }
    }
    onChange(date);
  };

  // Filtrar datas com anos inválidos
  const filterDate = (date: Date) => {
    const year = date.getFullYear();
    return year >= 1900 && year <= 2100;
  };

  if (inline) {
    return (
      <div className={cn("date-picker-container", className)}>
        <ReactDatePicker
          selected={selected}
          onChange={handleChange}
          locale="pt-BR"
          dateFormat={dateFormat}
          inline
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          showTimeSelect={showTimeSelect}
          filterDate={filterDate}
          calendarClassName="react-datepicker-shadcn"
          onCalendarOpen={onCalendarOpen}
          onCalendarClose={onCalendarClose}
        />
      </div>
    );
  }

  return (
    <div className={cn("date-picker-container w-full", className)}>
      <ReactDatePicker
        selected={selected}
        onChange={handleChange}
        locale="pt-BR"
        dateFormat={dateFormat}
        disabled={disabled}
        minDate={minDate}
        maxDate={maxDate}
        showTimeSelect={showTimeSelect}
        filterDate={filterDate}
        placeholderText={placeholder}
        onCalendarOpen={onCalendarOpen}
        onCalendarClose={onCalendarClose}
        preventOpenOnFocus={true}
        shouldCloseOnSelect={true}
        customInput={
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !selected && "text-muted-foreground",
              triggerClassName
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? formatarData(selected.toISOString()) : placeholder}
          </Button>
        }
        calendarClassName="react-datepicker-shadcn"
        wrapperClassName="w-full"
        popperClassName="react-datepicker-popper-shadcn"
        showPopperArrow={false}
      />
    </div>
  );
}

DatePicker.displayName = "DatePicker";
