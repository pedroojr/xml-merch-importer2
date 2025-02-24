
import React from 'react';
import { RoundingType } from './productCalculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MarkupControlsProps {
  xapuriMarkup: number;
  epitaMarkup: number;
  roundingType: RoundingType;
  onXapuriMarkupChange: (value: number) => void;
  onEpitaMarkupChange: (value: number) => void;
  onRoundingChange: (value: RoundingType) => void;
}

export const MarkupControls: React.FC<MarkupControlsProps> = ({
  xapuriMarkup,
  epitaMarkup,
  roundingType,
  onXapuriMarkupChange,
  onEpitaMarkupChange,
  onRoundingChange,
}) => {
  return (
    <div className="p-4 border-b bg-slate-50 space-y-2">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
            Markup Xapuri (%)
          </label>
          <input
            type="number"
            value={xapuriMarkup}
            onChange={(e) => onXapuriMarkupChange(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            min="0"
            max="100"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
            Markup Epitaciolândia (%)
          </label>
          <input
            type="number"
            value={epitaMarkup}
            onChange={(e) => onEpitaMarkupChange(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            min="0"
            max="100"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
            Arredondamento
          </label>
          <Select value={roundingType} onValueChange={onRoundingChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">R$ 0,90</SelectItem>
              <SelectItem value="50">R$ 0,50</SelectItem>
              <SelectItem value="none">Sem arredondamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
