
import React from 'react';

interface MarkupControlsProps {
  xapuriMarkup: number;
  epitaMarkup: number;
  onXapuriMarkupChange: (value: number) => void;
  onEpitaMarkupChange: (value: number) => void;
}

export const MarkupControls: React.FC<MarkupControlsProps> = ({
  xapuriMarkup,
  epitaMarkup,
  onXapuriMarkupChange,
  onEpitaMarkupChange,
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
      </div>
    </div>
  );
};
