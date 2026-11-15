import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { api } from '../../services/api';
import { SampleImage } from '../../types/dip';

export const TopNav: React.FC = () => {
  const {
    originalImage,
    processedImage,
    metadata,
    isProcessing,
    statusMessage,
    historyIndex,
    historyStack,
    setImage,
    undo,
    redo,
    resetProcessed,
    setProcessing,
  } = useWorkspaceStore();

  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [selectedSample, setSelectedSample] = useState<string>('cameraman');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load samples on mount
  useEffect(() => {
    api.getSamples().then((data) => {
      setSamples(data);
      // Auto-load cameraman if workspace has no image
      if (!originalImage && data.length > 0) {
        const cam = data.find((s) => s.id === 'cameraman') || data[0];
        setImage(cam.thumbnail, cam.metadata);
      }
    });
  }, []);

  const handleSelectSample = async (sampleId: string) => {
    setSelectedSample(sampleId);
    setProcessing(true, `Loading ${sampleId}...`);
    try {
      const data = await api.getSampleById(sampleId);
      setImage(data.image, data.metadata);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true, `Uploading ${file.name}...`);
    try {
      const res = await api.uploadImage(file);
      setImage(res.image, res.metadata);
      setSelectedSample('custom');
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    const target = processedImage || originalImage;
    if (!target) return;
    const a = document.createElement('a');
    a.href = target;
    a.download = `pixelrescue_${metadata?.filename || 'processed'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <header className="h-14 bg-charcoal-900 border-b border-slate-800 px-5 flex items-center justify-between z-30 select-none">
      {/* Left: Academic Presets & Upload */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-charcoal-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <ImageIcon size={14} className="text-cyan-400" />
          <span className="text-slate-400 font-medium">Dataset:</span>
          <select
            value={selectedSample}
            onChange={(e) => handleSelectSample(e.target.value)}
            className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id} className="bg-charcoal-900 text-slate-200">
                {s.name}
              </option>
            ))}
            {selectedSample === 'custom' && (
              <option value="custom" className="bg-charcoal-900 text-slate-200">
                Custom Upload
              </option>
            )}
          </select>
        </div>

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.bmp,.tiff"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-charcoal-850 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-300 transition-colors"
          title="Upload PNG, JPG, BMP, TIFF"
        >
          <Upload size={13} className="text-cyan-400" />
          <span>Upload Image</span>
        </button>

        {/* Metadata Badge */}
        {metadata && (
          <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-charcoal-950/70 border border-slate-800/80 px-2.5 py-1 rounded">
            <span>{metadata.width}×{metadata.height}px</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">{metadata.color_mode}</span>
            <span className="text-slate-600">•</span>
            <span>{metadata.file_size_formatted}</span>
          </div>
        )}
      </div>

      {/* Center: Live Status Indicator */}
      <div className="flex items-center space-x-2 text-xs">
        {isProcessing ? (
          <div className="flex items-center space-x-1.5 text-cyan-400 bg-cyan-950/30 border border-cyan-800/50 px-3 py-1 rounded-full animate-pulse">
            <Loader2 size={13} className="animate-spin" />
            <span className="font-mono text-[11px]">{statusMessage}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 text-slate-400 bg-charcoal-950 px-2.5 py-1 rounded-full border border-slate-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-slate-300">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Right: History, Reset & Export */}
      <div className="flex items-center space-x-2">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-1.5 bg-charcoal-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/80 rounded-lg text-slate-300 transition-colors"
          title="Undo Step"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= historyStack.length - 1}
          className="p-1.5 bg-charcoal-850 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700/80 rounded-lg text-slate-300 transition-colors"
          title="Redo Step"
        >
          <Redo2 size={15} />
        </button>
        <button
          onClick={resetProcessed}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-charcoal-850 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs text-slate-300 transition-colors"
          title="Reset to Original"
        >
          <RotateCcw size={13} className="text-amber-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-charcoal-950 font-semibold rounded-lg text-xs shadow-glow-cyan transition-all"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
