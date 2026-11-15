import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Columns,
  SplitSquareVertical,
  Eye,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface ImageViewerProps {
  onPixelHover?: (x: number, y: number) => void;
  onPixelClick?: (x: number, y: number) => void;
  differenceImage?: string | null;
  interactiveInspection?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  onPixelHover,
  onPixelClick,
  differenceImage,
  interactiveInspection = true,
}) => {
  const {
    originalImage,
    processedImage,
    comparisonMode,
    setComparisonMode,
    splitPosition,
    setSplitPosition,
    zoomLevel,
    setZoomLevel,
  } = useWorkspaceStore();

  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activeSrc = processedImage || originalImage;

  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel * 1.25, 8.0));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel / 1.25, 0.25));
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(Math.min(zoomLevel * 1.1, 8.0));
    } else {
      setZoomLevel(Math.max(zoomLevel / 1.1, 0.25));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDraggingSplit && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(0, Math.min(100, pos)));
    }

    if (imageRef.current && interactiveInspection) {
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
        const normX = clickX / rect.width;
        const normY = clickY / rect.height;
        const natW = imageRef.current.naturalWidth || 256;
        const natH = imageRef.current.naturalHeight || 256;
        const px = Math.floor(normX * natW);
        const py = Math.floor(normY * natH);

        setCursorPos({ x: px, y: py });
        if (onPixelHover) onPixelHover(px, py);
      } else {
        setCursorPos(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingSplit(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (imageRef.current && onPixelClick && interactiveInspection) {
      const rect = imageRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
        const normX = clickX / rect.width;
        const normY = clickY / rect.height;
        const natW = imageRef.current.naturalWidth || 256;
        const natH = imageRef.current.naturalHeight || 256;
        const px = Math.floor(normX * natW);
        const py = Math.floor(normY * natH);
        onPixelClick(px, py);
      }
    }
  };

  if (!activeSrc) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-hairline rounded-lg bg-obsidian-900/40 p-8 text-center">
        <Crosshair size={32} className="text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-200 mb-1">Optical Frame Idle</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Select a test target from the dataset strip above or import an image.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-obsidian-950 border border-hairline rounded-lg overflow-hidden select-none">
      {/* Precision Frame Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-obsidian-900 border-b border-hairline text-xs font-mono z-20">
        {/* Mode Tabs */}
        <div className="flex items-center space-x-1 bg-obsidian-950 p-0.5 rounded border border-hairline">
          <button
            onClick={() => setComparisonMode('split')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
              comparisonMode === 'split'
                ? 'bg-obsidian-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SplitSquareVertical size={12} />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setComparisonMode('side_by_side')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
              comparisonMode === 'side_by_side'
                ? 'bg-obsidian-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns size={12} />
            <span>Dual Sync</span>
          </button>
          <button
            onClick={() => setComparisonMode('single')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
              comparisonMode === 'single'
                ? 'bg-obsidian-800 text-white font-medium shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye size={12} />
            <span>Output</span>
          </button>
          {differenceImage && (
            <button
              onClick={() => setComparisonMode('difference')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] transition-colors ${
                comparisonMode === 'difference'
                  ? 'bg-laser-amber/20 text-laser-amber font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={12} />
              <span>Diff Map</span>
            </button>
          )}
        </div>

        {/* Live Cursor Coordinate HUD */}
        {cursorPos && (
          <div className="flex items-center space-x-3 text-[11px] text-slate-300 bg-obsidian-950 px-2.5 py-1 rounded border border-hairline">
            <span>
              X: <strong className="text-laser-cyan">{cursorPos.x}</strong>
            </span>
            <span>
              Y: <strong className="text-laser-cyan">{cursorPos.y}</strong>
            </span>
          </div>
        )}

        {/* Zoom Stepper */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-850"
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="w-12 text-center text-[10px] text-slate-400">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-850"
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-obsidian-850 ml-0.5"
            title="Reset Frame"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Main Optical Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="relative flex-1 w-full h-full min-h-[460px] overflow-hidden flex items-center justify-center optical-grid cursor-crosshair select-none bg-obsidian-950"
      >
        {/* Frame corner registration marks */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-slate-700 pointer-events-none opacity-40" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-slate-700 pointer-events-none opacity-40" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-slate-700 pointer-events-none opacity-40" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-slate-700 pointer-events-none opacity-40" />

        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center"
        >
          {comparisonMode === 'split' && originalImage && processedImage ? (
            <div className="relative overflow-hidden rounded border border-hairline shadow-2xl select-none">
              {/* Original Layer */}
              <img
                src={originalImage}
                alt="Original"
                className="block max-h-[540px] object-contain pointer-events-none"
              />
              {/* Processed Layer (Clipped) */}
              <div
                style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }}
                className="absolute inset-0 select-none"
              >
                <img
                  ref={imageRef}
                  src={processedImage}
                  alt="Processed"
                  className="block w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Minimal 1px Split Hairline */}
              <div
                style={{ left: `${splitPosition}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
                className="absolute top-0 bottom-0 w-[1px] bg-slate-200 cursor-ew-resize z-10 flex items-center justify-center hover:bg-laser-cyan"
              >
                <div className="w-3.5 h-6 bg-obsidian-900 border border-slate-400 rounded-sm flex items-center justify-center text-[8px] font-mono text-slate-300 shadow">
                  ⟷
                </div>
              </div>

              {/* Quiet labels */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-obsidian-950/90 text-[9px] font-mono text-slate-400 pointer-events-none border border-hairline">
                RAW INPUT
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-obsidian-950/90 text-[9px] font-mono text-slate-200 pointer-events-none border border-hairline">
                PROCESSED
              </div>
            </div>
          ) : comparisonMode === 'side_by_side' && originalImage && processedImage ? (
            <div className="flex items-center space-x-3 p-3">
              <div className="relative border border-hairline rounded overflow-hidden bg-black/40">
                <img src={originalImage} alt="Raw" className="max-h-[500px] object-contain" />
                <span className="absolute top-1.5 left-1.5 bg-obsidian-950/90 text-slate-400 text-[9px] font-mono px-1.5 py-0.2 rounded border border-hairline">
                  RAW INPUT
                </span>
              </div>
              <div className="relative border border-slate-600 rounded overflow-hidden bg-black/40 shadow-xl">
                <img ref={imageRef} src={processedImage} alt="Processed" className="max-h-[500px] object-contain" />
                <span className="absolute top-1.5 left-1.5 bg-obsidian-950/90 text-slate-200 text-[9px] font-mono px-1.5 py-0.2 rounded border border-hairline font-semibold">
                  PROCESSED
                </span>
              </div>
            </div>
          ) : comparisonMode === 'difference' && differenceImage ? (
            <div className="relative border border-hairline rounded overflow-hidden bg-black/40 shadow-2xl">
              <img ref={imageRef} src={differenceImage} alt="Difference Heatmap" className="max-h-[540px] object-contain" />
              <span className="absolute top-2 left-2 bg-obsidian-950/90 text-laser-amber text-[9px] font-mono px-2 py-0.5 rounded border border-hairline">
                ABSOLUTE DIFFERENCE MAP
              </span>
            </div>
          ) : (
            <div className="relative border border-hairline rounded overflow-hidden bg-black/40">
              <img
                ref={imageRef}
                src={processedImage || originalImage || ''}
                alt="Active Frame"
                className="max-h-[540px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
