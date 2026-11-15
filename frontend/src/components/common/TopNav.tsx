import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Undo2,
  Redo2,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  Activity,
  HardDrive,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { api } from '../../services/api';
import type { SampleImage } from '../../types/dip';

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
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [customApiUrl, setCustomApiUrl] = useState<string>(
    localStorage.getItem('pixelrescue_api_url') || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSamples().then((data) => {
      setSamples(data);
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
    a.download = `pixelrescue_${metadata?.filename || 'output'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveApiUrl = () => {
    if (customApiUrl.trim()) {
      localStorage.setItem('pixelrescue_api_url', customApiUrl.trim());
    } else {
      localStorage.removeItem('pixelrescue_api_url');
    }
    setShowConfig(false);
    window.location.reload();
  };

  return (
    <header className="h-16 bg-slate-950/80 border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between z-30 select-none shrink-0 backdrop-blur-xl font-sans">
      {/* Left: Dataset Selector & Upload */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
          <span className="text-slate-400 font-mono text-[10px] uppercase font-semibold mr-2 tracking-wider">
            Image:
          </span>
          <select
            value={selectedSample}
            onChange={(e) => handleSelectSample(e.target.value)}
            className="bg-transparent text-slate-100 font-semibold text-xs focus:outline-none cursor-pointer pr-1"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                {s.name}
              </option>
            ))}
            {selectedSample === 'custom' && (
              <option value="custom" className="bg-slate-900 text-slate-100">
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
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 transition-colors shadow-sm"
          title="Upload Custom Image (PNG, JPG, BMP, TIFF)"
        >
          <Upload size={13} className="text-cyan-400" />
          <span>Upload</span>
        </button>

        {/* Telemetry Strip */}
        {metadata && (
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-400 pl-3 border-l border-slate-800">
            <span className="text-slate-300 font-semibold">{metadata.width}×{metadata.height}</span>
            <span className="text-slate-600">·</span>
            <span className="text-purple-400 font-medium">{metadata.color_mode}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">{metadata.file_size_formatted}</span>
          </div>
        )}
      </div>

      {/* Center: Live Status Indicator */}
      <div className="flex items-center space-x-2">
        {isProcessing ? (
          <div className="flex items-center space-x-2 text-cyan-400 bg-cyan-950/50 px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-medium animate-pulse shadow-sm">
            <Loader2 size={13} className="animate-spin text-cyan-400" />
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-xl text-slate-300 transition-colors shadow-sm"
          title="Undo Step (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= historyStack.length - 1}
          className="p-2 bg-slate-900 hover:bg-slate-850 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-xl text-slate-300 transition-colors shadow-sm"
          title="Redo Step (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>
        <button
          onClick={resetProcessed}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium text-slate-300 transition-colors shadow-sm"
          title="Reset Image to Raw Input"
        >
          <RotateCcw size={13} className="text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* API Host Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors shadow-sm"
            title="Configure Backend Connection"
          >
            <SlidersHorizontal size={14} />
          </button>

          {showConfig && (
            <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 text-xs space-y-3 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-bold tracking-tight">
                  Backend API Connection
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Hybrid Online</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect your local Python FastAPI backend for analytical NumPy/SciPy computing, or use the high-performance browser client engine.
              </p>
              <input
                type="text"
                placeholder="http://localhost:8000/api"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => {
                    setCustomApiUrl('');
                    localStorage.removeItem('pixelrescue_api_url');
                    window.location.reload();
                  }}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Reset Default
                </button>
                <button
                  onClick={handleSaveApiUrl}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-cyan-500/20"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Export Action */}
        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download size={14} />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
};
