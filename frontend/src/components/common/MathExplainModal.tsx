import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Clock, Activity, Variable } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { MathFormula } from './MathFormula';

export const MathExplainModal: React.FC = () => {
  const { mathModalOpen, mathModalData, closeMathModal } = useWorkspaceStore();

  if (!mathModalOpen || !mathModalData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-surface-raised border border-hairline rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-hairline bg-obsidian-900">
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 uppercase tracking-wider">
                {mathModalData.category || 'THEORETICAL FORMULATION'}
              </span>
              <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{mathModalData.title}</h3>
            </div>
            <button
              onClick={closeMathModal}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-surface-overlay transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Primary Formula Box */}
            <div className="bg-obsidian-950 border border-hairline rounded-lg p-4 shadow-inner">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Activity size={12} className="text-cyan-400" />
                <span>Governing Mathematical Formulation</span>
              </div>
              <div className="py-2 flex justify-center text-base overflow-x-auto">
                <MathFormula formula={mathModalData.formula} />
              </div>
            </div>

            {/* Variable Definitions */}
            {mathModalData.variables && mathModalData.variables.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Variable size={12} className="text-purple-400" />
                  <span>Variable Definitions & Parameters</span>
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {mathModalData.variables.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 bg-obsidian-950 border border-hairline px-3 py-2 rounded text-xs"
                    >
                      <code className="font-mono text-cyan-400 font-semibold min-w-[65px]">{v.symbol}</code>
                      <span className="text-slate-300 leading-snug">{v.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Explanation */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Algorithm Theory</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-obsidian-950 p-3 rounded border border-hairline">
                {mathModalData.explanation}
              </p>
            </div>

            {/* Complexity & Reference Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-hairline text-[11px] text-slate-400 font-mono">
              {mathModalData.complexity && (
                <div className="flex items-center space-x-1.5">
                  <Clock size={12} className="text-amber-400" />
                  <span>Complexity: <strong className="text-slate-200">{mathModalData.complexity}</strong></span>
                </div>
              )}
              {mathModalData.reference && (
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="text-cyan-400">Ref:</span>
                  <span>{mathModalData.reference}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
