import React from 'react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  description,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-300 tracking-tight">{label}</span>
        <div className="flex items-center space-x-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            className="w-14 bg-obsidian-950 border border-slate-700/60 rounded px-1.5 py-0.5 text-right font-mono text-slate-100 text-xs focus:outline-none focus:border-laser-cyan"
          />
          {unit && <span className="text-slate-500 font-mono text-[10px]">{unit}</span>}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-obsidian-800 rounded appearance-none cursor-pointer accent-slate-300 disabled:opacity-30"
      />

      {description && (
        <p className="text-[10px] text-slate-500 leading-tight font-mono">{description}</p>
      )}
    </div>
  );
};
