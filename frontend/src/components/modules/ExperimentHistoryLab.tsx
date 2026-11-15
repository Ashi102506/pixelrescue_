import React, { useState, useEffect } from 'react';
import {
  History,
  Save,
  Trash2,
  Columns,
  Eye,
  Calendar,
  Sparkles,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { api } from '../../services/api';
import { ExperimentItem } from '../../types/dip';

export const ExperimentHistoryLab: React.FC = () => {
  const { originalImage, processedImage, activeAlgorithm, activeMetrics, setImage, setProcessedImage, setProcessing } =
    useWorkspaceStore();

  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [saveTitle, setSaveTitle] = useState<string>('');
  const [saveDesc, setSaveDesc] = useState<string>('');
  const [selectedExpA, setSelectedExpA] = useState<ExperimentItem | null>(null);
  const [selectedExpB, setSelectedExpB] = useState<ExperimentItem | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const fetchExperiments = async () => {
    try {
      const data = await api.listExperiments();
      setExperiments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleSaveCurrentExperiment = async () => {
    if (!originalImage || !processedImage) {
      alert('Workspace must have an active processed image to record an experiment.');
      return;
    }
    const title = saveTitle.trim() || `${activeAlgorithm} Trial ${experiments.length + 1}`;
    setProcessing(true, `Saving experiment: ${title}...`);
    try {
      await api.createExperiment({
        title,
        description: saveDesc,
        module: 'DIP Experiment',
        algorithm: activeAlgorithm,
        parameters: { algorithm: activeAlgorithm },
        metrics: activeMetrics || {},
        input_image_preview: originalImage,
        output_image_preview: processedImage,
      });
      setSaveTitle('');
      setSaveDesc('');
      await fetchExperiments();
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this recorded experiment?')) return;
    try {
      await api.deleteExperiment(id);
      fetchExperiments();
      if (selectedExpA?.id === id) setSelectedExpA(null);
      if (selectedExpB?.id === id) setSelectedExpB(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadToWorkspace = (exp: ExperimentItem) => {
    setImage(exp.input_preview);
    setProcessedImage(exp.output_preview, exp.algorithm, exp.metrics as any);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Header & Save Form */}
      <div className="bg-charcoal-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            Persistent Scientific Journal
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Experiment History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted in local SQLite database. Compare parameters, output fidelity, and metric convergence.
          </p>
        </div>

        {/* Save Current State Form */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Experiment Name..."
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            className="bg-charcoal-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48"
          />
          <button
            onClick={handleSaveCurrentExperiment}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-charcoal-950 font-bold rounded-lg text-xs shadow-glow-cyan transition-all"
          >
            <Save size={13} />
            <span>Record Experiment</span>
          </button>
        </div>
      </div>

      {/* Comparison Drawer (if activated) */}
      {isComparing && selectedExpA && selectedExpB && (
        <div className="bg-charcoal-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center space-x-1.5">
              <Columns size={14} />
              <span>Comparative Experiment Analysis</span>
            </span>
            <button
              onClick={() => setIsComparing(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trial A */}
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-cyan-400 font-bold">Experiment A: {selectedExpA.title}</span>
                <span className="text-slate-400">{selectedExpA.algorithm}</span>
              </div>
              <img
                src={selectedExpA.output_preview}
                alt="Exp A"
                className="h-48 w-full object-contain rounded-lg bg-black/40 border border-slate-800"
              />
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <div>PSNR: {selectedExpA.metrics?.psnr_db ?? 'N/A'} dB</div>
                <div>SSIM: {selectedExpA.metrics?.ssim?.toFixed(4) ?? 'N/A'}</div>
              </div>
            </div>

            {/* Trial B */}
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-violet-400 font-bold">Experiment B: {selectedExpB.title}</span>
                <span className="text-slate-400">{selectedExpB.algorithm}</span>
              </div>
              <img
                src={selectedExpB.output_preview}
                alt="Exp B"
                className="h-48 w-full object-contain rounded-lg bg-black/40 border border-slate-800"
              />
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <div>PSNR: {selectedExpB.metrics?.psnr_db ?? 'N/A'} dB</div>
                <div>SSIM: {selectedExpB.metrics?.ssim?.toFixed(4) ?? 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiments List / Grid */}
      {experiments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl bg-charcoal-900/50 p-8">
          <History size={40} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No Saved Experiments Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Apply algorithms in any laboratory and click "Record Experiment" above to track parameters and comparative quality scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-charcoal-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {exp.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal-950 text-cyan-400 border border-slate-800">
                    {exp.algorithm}
                  </span>
                </div>

                {/* Thumbnails Comparison */}
                <div className="grid grid-cols-2 gap-2 my-2">
                  <div className="relative rounded overflow-hidden border border-slate-800 bg-black/40">
                    <img src={exp.input_preview} alt="Input" className="h-24 w-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1 rounded text-slate-300">
                      Input
                    </span>
                  </div>
                  <div className="relative rounded overflow-hidden border border-slate-800 bg-black/40">
                    <img src={exp.output_preview} alt="Output" className="h-24 w-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1 rounded text-cyan-400">
                      Output
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                {exp.metrics && exp.metrics.psnr_db && (
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300 pt-1">
                    <span>PSNR: <strong className="text-cyan-400">{exp.metrics.psnr_db} dB</strong></span>
                    {exp.metrics.ssim && <span>SSIM: <strong className="text-violet-400">{exp.metrics.ssim.toFixed(3)}</strong></span>}
                  </div>
                )}

                <div className="text-[10px] text-slate-500 font-mono mt-2 flex items-center space-x-1">
                  <Calendar size={11} />
                  <span>{new Date(exp.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
                <button
                  onClick={() => handleLoadToWorkspace(exp)}
                  className="flex items-center space-x-1 text-slate-300 hover:text-cyan-400 font-medium transition-colors"
                >
                  <Eye size={13} />
                  <span>Open in Workspace</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      if (!selectedExpA) {
                        setSelectedExpA(exp);
                      } else {
                        setSelectedExpB(exp);
                        setIsComparing(true);
                      }
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      selectedExpA?.id === exp.id || selectedExpB?.id === exp.id
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Select for Side-by-Side Comparison"
                  >
                    <Columns size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                    title="Delete Experiment"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
