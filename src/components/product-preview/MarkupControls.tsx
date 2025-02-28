
import React, { useEffect } from 'react';
import { RoundingType } from './productCalculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  useEffect(() => {
    // Calcular o markup como 120% (equivalente a multiplicar por 2.2)
    const calculatedMarkup = 120;
    onXapuriMarkupChange(calculatedMarkup);
  }, [onXapuriMarkupChange]);

  return (
    <div className="p-4 border-b bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="xapuri-markup" className="text-sm font-medium text-blue-700">
            Markup Xapuri (%) - Fixo em 120%
          </Label>
          <Input
            id="xapuri-markup"
            type="number"
            value={xapuriMarkup}
            disabled
            className="w-full border-blue-200 focus:border-blue-400 bg-blue-50 opacity-70"
            title="Markup fixo: Custo Bruto × 2.2 (equivalente a 120%)"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="epita-markup" className="text-sm font-medium text-emerald-700">
            Markup Epitaciolândia (%)
          </Label>
          <Input
            id="epita-markup"
            type="number"
            value={epitaMarkup}
            onChange={(e) => onEpitaMarkupChange(Number(e.target.value))}
            className="w-full border-emerald-200 focus:border-emerald-400"
            step="5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rounding-type" className="text-sm font-medium">
            Arredondamento
          </Label>
          <Select value={roundingType} onValueChange={onRoundingChange}>
            <SelectTrigger id="rounding-type" className="w-full">
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
