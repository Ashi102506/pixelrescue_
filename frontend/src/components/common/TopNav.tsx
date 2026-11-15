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
    <header className="h-14 bg-obsidian-900 border-b border-hairline px-4 flex items-center justify-between z-30 select-none shrink-0">
      {/* Left: Dataset Selector & Upload */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-obsidian-950 border border-slate-700/60 rounded px-2.5 py-1 text-xs">
          <span className="text-slate-500 font-mono text-[10px] uppercase mr-2 tracking-wider">
            Target:
          </span>
          <select
            value={selectedSample}
            onChange={(e) => handleSelectSample(e.target.value)}
            className="bg-transparent text-slate-200 font-mono font-medium text-xs focus:outline-none cursor-pointer pr-1"
          >
            {samples.map((s) => (
              <option key={s.id} value={s.id} className="bg-obsidian-900 text-slate-200 font-mono">
                {s.name}
              </option>
            ))}
            {selectedSample === 'custom' && (
              <option value="custom" className="bg-obsidian-900 text-slate-200 font-mono">
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
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-obsidian-850 hover:bg-obsidian-800 border border-slate-700/60 rounded text-xs font-mono text-slate-300 transition-colors"
          title="Upload Local Image (PNG, JPG, BMP, TIFF)"
        >
          <Upload size={12} className="text-slate-400" />
          <span>Import</span>
        </button>

        {/* Telemetry Strip */}
        {metadata && (
          <div className="hidden xl:flex items-center space-x-3 text-[11px] font-mono text-slate-400 pl-3 border-l border-hairline">
            <span className="text-slate-300">{metadata.width}×{metadata.height}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{metadata.color_mode}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{metadata.file_size_formatted}</span>
          </div>
        )}
      </div>

      {/* Center: System Status */}
      <div className="flex items-center space-x-2">
        {isProcessing ? (
          <div className="flex items-center space-x-2 text-laser-cyan bg-obsidian-950 px-3 py-1 rounded border border-laser-cyan/30 text-xs font-mono">
            <Loader2 size={12} className="animate-spin" />
            <span>{statusMessage}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-obsidian-950 px-3 py-1 rounded border border-hairline">
            <span className="w-1.5 h-1.5 rounded-full bg-laser-emerald" />
            <span className="text-slate-300">{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-1.5">
        <button
          onClick={undo}
          disabled={historyIndex <= 0}
          className="p-1.5 bg-obsidian-850 hover:bg-obsidian-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700/60 rounded text-slate-300 transition-colors"
          title="Undo Step (Ctrl+Z)"
        >
          <Undo2 size={13} />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex >= historyStack.length - 1}
          className="p-1.5 bg-obsidian-850 hover:bg-obsidian-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700/60 rounded text-slate-300 transition-colors"
          title="Redo Step (Ctrl+Y)"
        >
          <Redo2 size={13} />
        </button>
        <button
          onClick={resetProcessed}
          className="flex items-center space-x-1 px-2.5 py-1 bg-obsidian-850 hover:bg-obsidian-800 border border-slate-700/60 rounded text-xs font-mono text-slate-300 transition-colors"
          title="Reset Image to Raw Input"
        >
          <RotateCcw size={12} className="text-slate-400" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* API Host Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 bg-obsidian-850 hover:bg-obsidian-800 border border-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Configure Backend Connection"
          >
            <SlidersHorizontal size={13} />
          </button>

          {showConfig && (
            <div className="absolute right-0 top-10 w-72 bg-obsidian-900 border border-slate-700 rounded-lg p-3 shadow-2xl z-50 text-xs font-mono space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Backend API Gateway
              </span>
              <input
                type="text"
                placeholder="http://localhost:8000/api"
                value={customApiUrl}
                onChange={(e) => setCustomApiUrl(e.target.value)}
                className="w-full bg-obsidian-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-laser-cyan"
              />
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-500">Leave blank for auto</span>
                <button
                  onClick={handleSaveApiUrl}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-white text-obsidian-950 font-bold rounded text-[11px]"
                >
                  Save & Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button: Deliberate Off-White */}
        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-3 py-1 bg-slate-200 hover:bg-white text-obsidian-950 font-semibold rounded text-xs transition-colors shadow-sm"
        >
          <Download size={13} />
          <span>Export PNG</span>
        </button>
      </div>
    </header>
  );
};
