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
        <span className="font-medium text-slate-300">{label}</span>
        <div className="flex items-center space-x-1">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            className="w-16 bg-charcoal-950 border border-slate-700/80 rounded px-1.5 py-0.5 text-right font-mono text-cyan-400 text-xs focus:outline-none focus:border-cyan-500"
          />
          {unit && <span className="text-slate-400 font-mono text-[11px]">{unit}</span>}
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
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50"
      />

      {description && <p className="text-[11px] text-slate-400 leading-tight">{description}</p>}
    </div>
  );
};
