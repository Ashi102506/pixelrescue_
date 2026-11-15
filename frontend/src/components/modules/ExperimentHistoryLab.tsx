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
    <div className="flex-1 p-5 space-y-4 overflow-y-auto h-full max-w-7xl mx-auto bg-obsidian-950 font-sans">
      {/* Header & Save Form */}
      <div className="bg-surface-raised border border-hairline rounded-lg p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
              LOG · PERSISTENCE
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Experiment History Journal
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Persisted in local SQLite database. Track parameters, output fidelity, and metric convergence.
          </p>
        </div>

        {/* Save Current State Form */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Experiment label..."
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            className="bg-obsidian-950 border border-hairline rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-slate-500 font-mono w-52 placeholder:text-slate-600"
          />
          <button
            onClick={handleSaveCurrentExperiment}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-white text-obsidian-950 font-semibold rounded text-xs border border-white/20 transition-all shadow-sm active:scale-[0.99]"
          >
            <Save size={12} />
            <span>Record Trial</span>
          </button>
        </div>
      </div>

      {/* Comparison Drawer (if activated) */}
      {isComparing && selectedExpA && selectedExpB && (
        <div className="bg-surface-raised border border-cyan-800/60 rounded-lg p-4 shadow-xl space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-hairline">
            <span className="text-xs text-cyan-400 font-semibold uppercase flex items-center space-x-1.5">
              <Columns size={13} />
              <span>Comparative Experiment Analysis</span>
            </span>
            <button
              onClick={() => setIsComparing(false)}
              className="text-[11px] text-slate-400 hover:text-slate-200 font-mono"
            >
              Close Comparison [×]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trial A */}
            <div className="bg-obsidian-950 p-3 rounded border border-hairline space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-bold">A: {selectedExpA.title}</span>
                <span className="text-slate-500 text-[10px]">{selectedExpA.algorithm}</span>
              </div>
              <img
                src={selectedExpA.output_preview}
                alt="Exp A"
                className="h-44 w-full object-contain rounded bg-black/40 border border-hairline"
              />
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>PSNR: <strong className="text-white tabular-nums">{selectedExpA.metrics?.psnr_db ?? 'N/A'} dB</strong></div>
                <div>SSIM: <strong className="text-white tabular-nums">{selectedExpA.metrics?.ssim?.toFixed(4) ?? 'N/A'}</strong></div>
              </div>
            </div>

            {/* Trial B */}
            <div className="bg-obsidian-950 p-3 rounded border border-hairline space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-purple-400 font-bold">B: {selectedExpB.title}</span>
                <span className="text-slate-500 text-[10px]">{selectedExpB.algorithm}</span>
              </div>
              <img
                src={selectedExpB.output_preview}
                alt="Exp B"
                className="h-44 w-full object-contain rounded bg-black/40 border border-hairline"
              />
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>PSNR: <strong className="text-white tabular-nums">{selectedExpB.metrics?.psnr_db ?? 'N/A'} dB</strong></div>
                <div>SSIM: <strong className="text-white tabular-nums">{selectedExpB.metrics?.ssim?.toFixed(4) ?? 'N/A'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiments List / Grid */}
      {experiments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-hairline rounded-lg bg-surface-raised/40 p-8">
          <History size={32} className="mx-auto text-slate-600 mb-2" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
            No Saved Experiments Recorded
          </h3>
          <p className="text-[11px] font-mono text-slate-500 max-w-sm mx-auto">
            Apply algorithms in any laboratory and click "Record Trial" above to track parameters and comparative quality scores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface-raised border border-hairline hover:border-slate-600 rounded-lg p-3.5 flex flex-col justify-between shadow-sm transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[170px]">
                    {exp.title}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-obsidian-950 text-cyan-400 border border-hairline">
                    {exp.algorithm}
                  </span>
                </div>

                {/* Thumbnails Comparison */}
                <div className="grid grid-cols-2 gap-2 my-2">
                  <div className="relative rounded overflow-hidden border border-hairline bg-obsidian-950">
                    <img src={exp.input_preview} alt="Input" className="h-24 w-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-obsidian-950/80 text-[9px] font-mono px-1 rounded text-slate-400 border border-hairline">
                      Input
                    </span>
                  </div>
                  <div className="relative rounded overflow-hidden border border-hairline bg-obsidian-950">
                    <img src={exp.output_preview} alt="Output" className="h-24 w-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-obsidian-950/80 text-[9px] font-mono px-1 rounded text-cyan-400 border border-hairline">
                      Output
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                {exp.metrics && exp.metrics.psnr_db && (
                  <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300 pt-1">
                    <span>PSNR: <strong className="text-cyan-400 tabular-nums">{exp.metrics.psnr_db} dB</strong></span>
                    {exp.metrics.ssim && <span>SSIM: <strong className="text-purple-400 tabular-nums">{exp.metrics.ssim.toFixed(3)}</strong></span>}
                  </div>
                )}

                <div className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center space-x-1">
                  <Calendar size={11} />
                  <span>{new Date(exp.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-hairline text-xs font-mono">
                <button
                  onClick={() => handleLoadToWorkspace(exp)}
                  className="flex items-center space-x-1 text-slate-400 hover:text-cyan-400 transition-colors text-[11px]"
                >
                  <Eye size={12} />
                  <span>Load</span>
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
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/50'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-surface-overlay'
                    }`}
                    title="Compare Trials"
                  >
                    <Columns size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-surface-overlay rounded transition-colors"
                    title="Delete Trial"
                  >
                    <Trash2 size={12} />
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
