
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
  return (
    <div className="w-full p-4 border-b bg-white">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full">
        <div className="w-full lg:w-auto">
          <MarkupControls
            xapuriMarkup={xapuriMarkup}
            epitaMarkup={epitaMarkup}
            roundingType={roundingType}
            onXapuriMarkupChange={onXapuriMarkupChange}
            onEpitaMarkupChange={onEpitaMarkupChange}
            onRoundingChange={onRoundingChange}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onNewFileRequest}
            className="flex-1 lg:flex-none"
          >
            <FileText className="h-4 w-4 mr-2" />
            Nova Nota
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCompactMode}
            className="flex-1 lg:flex-none"
          >
            {compactMode ? 'Modo Detalhado' : 'Modo Compacto'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 lg:flex-none"
              >
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
                  onCheckedChange={() => onToggleColumn(column.id)}
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
