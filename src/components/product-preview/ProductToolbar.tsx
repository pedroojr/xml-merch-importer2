
import React from 'react';
import { Button } from "@/components/ui/button";
import { Columns, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MarkupControls } from './MarkupControls';
import { Column } from './types/column';
import { RoundingType } from './productCalculations';

interface ProductToolbarProps {
  xapuriMarkup: number;
  epitaMarkup: number;
  roundingType: RoundingType;
  onXapuriMarkupChange: (value: number) => void;
  onEpitaMarkupChange: (value: number) => void;
  onRoundingChange: (value: RoundingType) => void;
  compactMode: boolean;
  toggleCompactMode: () => void;
  columns: Column[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
  onNewFileRequest: () => void;
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  xapuriMarkup,
  epitaMarkup,
  roundingType,
  onXapuriMarkupChange,
  onEpitaMarkupChange,
  onRoundingChange,
  compactMode,
  toggleCompactMode,
  columns,
  visibleColumns,
  onToggleColumn,
  onNewFileRequest,
}) => {
  const handleColumnToggle = (columnId: string) => {
    onToggleColumn(columnId);
    // Salva a configuração atual no localStorage
    const currentConfig = new Set(visibleColumns);
    if (currentConfig.has(columnId)) {
      currentConfig.delete(columnId);
    } else {
      currentConfig.add(columnId);
    }
    localStorage.setItem('visibleColumns', JSON.stringify(Array.from(currentConfig)));
  };

  return (
    <div className="p-4 border-b">
      <div className="flex items-center justify-between mb-4">
        <MarkupControls
          xapuriMarkup={xapuriMarkup}
          epitaMarkup={epitaMarkup}
          roundingType={roundingType}
          onXapuriMarkupChange={onXapuriMarkupChange}
          onEpitaMarkupChange={onEpitaMarkupChange}
          onRoundingChange={onRoundingChange}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewFileRequest}
            className="min-w-[140px]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Nova Nota
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCompactMode}
            className="min-w-[140px]"
          >
            {compactMode ? 'Modo Detalhado' : 'Modo Compacto'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[160px]">
                <Columns className="h-4 w-4 mr-2" />
                Personalizar Visão
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Colunas Visíveis</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => handleColumnToggle(column.id)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
