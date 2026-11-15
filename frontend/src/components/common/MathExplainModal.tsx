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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-charcoal-900 border border-slate-700/80 rounded-xl shadow-2xl shadow-cyan-950/30 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-charcoal-850">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono">
                  {mathModalData.category || 'Mathematical Model'}
                </span>
                <h3 className="text-lg font-semibold text-white tracking-tight">{mathModalData.title}</h3>
              </div>
            </div>
            <button
              onClick={closeMathModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Primary Formula Box */}
            <div className="bg-charcoal-950 border border-violet-500/30 rounded-lg p-5 shadow-inner">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Activity size={14} className="text-cyan-400" />
                <span>Governing Mathematical Formulation</span>
              </div>
              <div className="py-2 flex justify-center text-lg">
                <MathFormula formula={mathModalData.formula} />
              </div>
            </div>

            {/* Variable Definitions */}
            {mathModalData.variables && mathModalData.variables.length > 0 && (
              <div>
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Variable size={14} className="text-violet-400" />
                  <span>Variable Definitions & Parameters</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {mathModalData.variables.map((v, i) => (
                    <div
                      key={i}
                      className="flex items-start space-x-3 bg-charcoal-850/60 border border-slate-800/80 px-3.5 py-2.5 rounded-lg"
                    >
                      <code className="text-sm font-mono text-cyan-400 font-semibold min-w-[50px]">{v.symbol}</code>
                      <span className="text-sm text-slate-300">{v.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Explanation */}
            <div>
              <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Algorithm Theory</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-charcoal-850/40 p-3.5 rounded-lg border border-slate-800">
                {mathModalData.explanation}
              </p>
            </div>

            {/* Complexity & Reference Footer */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800 text-xs text-slate-400">
              {mathModalData.complexity && (
                <div className="flex items-center space-x-1.5 font-mono">
                  <Clock size={14} className="text-amber-400" />
                  <span>Complexity: <strong className="text-slate-200">{mathModalData.complexity}</strong></span>
                </div>
              )}
              {mathModalData.reference && (
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <span className="text-cyan-400 font-mono">Ref:</span>
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
