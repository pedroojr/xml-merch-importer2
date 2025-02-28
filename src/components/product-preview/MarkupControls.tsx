
import React from 'react';
import { RoundingType } from './productCalculations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface MarkupControlsProps {
  xapuriMarkup: number;
  epitaMarkup: number;
  roundingType: RoundingType;
  onXapuriMarkupChange: (value: number) => void;
  onEpitaMarkupChange: (value: number) => void;
  onRoundingChange: (value: RoundingType) => void;
  xapuriSuggestedMarkup?: number;
  epitaSuggestedMarkup?: number;
}

export const MarkupControls: React.FC<MarkupControlsProps> = ({
  xapuriMarkup,
  epitaMarkup,
  roundingType,
  onXapuriMarkupChange,
  onEpitaMarkupChange,
  onRoundingChange,
  xapuriSuggestedMarkup,
  epitaSuggestedMarkup,
}) => {
  return (
    <div className="p-4 border-b bg-slate-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="xapuri-markup" className="text-sm font-medium text-blue-700">
              Markup Xapuri (%)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[220px] text-sm">
                    Markup sugerido para Xapuri
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="relative">
            <Input
              id="xapuri-markup"
              type="number"
              value={xapuriMarkup}
              onChange={(e) => onXapuriMarkupChange(Number(e.target.value))}
              className="w-full border-blue-200 focus:border-blue-400 pr-32"
              step="5"
            />
            {xapuriSuggestedMarkup && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-blue-600">
                % Sugerido: {xapuriSuggestedMarkup}%
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="epita-markup" className="text-sm font-medium text-emerald-700">
              Markup Epitaciolândia (%)
            </Label>
          </div>
          <div className="relative">
            <Input
              id="epita-markup"
              type="number"
              value={epitaMarkup}
              onChange={(e) => onEpitaMarkupChange(Number(e.target.value))}
              className="w-full border-emerald-200 focus:border-emerald-400 pr-32"
              step="5"
            />
            {epitaSuggestedMarkup && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-emerald-600">
                % Sugerido: {epitaSuggestedMarkup}%
              </div>
            )}
          </div>
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
