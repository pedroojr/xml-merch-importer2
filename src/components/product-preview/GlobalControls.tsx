
import React from 'react';
import { Input } from "@/components/ui/input";

interface GlobalControlsProps {
  markup: number;
  roundingType: '90' | '50';
  onMarkupChange: (value: number) => void;
  onRoundingChange: (type: '90' | '50') => void;
}

export const GlobalControls: React.FC<GlobalControlsProps> = ({
  markup,
  roundingType,
  onMarkupChange,
  onRoundingChange,
}) => {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg border">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium">Markup Global (%)</label>
          <Input
            type="number"
            value={markup}
            onChange={(e) => onMarkupChange(parseFloat(e.target.value) || 0)}
            className="w-24"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Arredondamento</label>
          <div className="flex gap-2">
            <button
              onClick={() => onRoundingChange('90')}
              className={`px-3 py-1 rounded text-sm ${
                roundingType === '90' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              .90
            </button>
            <button
              onClick={() => onRoundingChange('50')}
              className={`px-3 py-1 rounded text-sm ${
                roundingType === '50' ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              .50
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
