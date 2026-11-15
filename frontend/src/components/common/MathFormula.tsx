import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ formula, displayMode = true, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && formula) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode,
          throwOnError: false,
          output: 'html',
        });
      } catch (err) {
        if (containerRef.current) {
          containerRef.current.innerText = formula;
        }
      }
    }
  }, [formula, displayMode]);

  return <div ref={containerRef} className={`text-slate-200 overflow-x-auto select-all ${className}`} />;
};
