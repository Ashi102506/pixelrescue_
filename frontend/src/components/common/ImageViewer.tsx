import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Columns, SplitSquareVertical, Eye, Crosshair, Sparkles } from 'lucide-react';
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

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(Math.min(zoomLevel * 1.25, 8.0));
  const handleZoomOut = () => setZoomLevel(Math.max(zoomLevel / 1.25, 0.25));
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel(Math.min(zoomLevel * 1.1, 8.0));
    } else {
      setZoomLevel(Math.max(zoomLevel / 1.1, 0.25));
    }
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+Click for panning
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

    // Pixel coordinate tracking
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
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-charcoal-900/50 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 shadow-glow-cyan">
          <Crosshair size={32} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No Image Loaded</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-4">
          Select an academic sample image from the top bar or upload an image to begin mathematical processing.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-charcoal-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-charcoal-900/90 border-b border-slate-800 text-xs z-20">
        {/* Comparison mode tabs */}
        <div className="flex items-center space-x-1 bg-charcoal-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setComparisonMode('split')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              comparisonMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Split Slider"
          >
            <SplitSquareVertical size={13} />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setComparisonMode('side_by_side')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              comparisonMode === 'side_by_side'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Side by Side"
          >
            <Columns size={13} />
            <span>Side by Side</span>
          </button>
          <button
            onClick={() => setComparisonMode('single')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              comparisonMode === 'single'
                ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Single Output"
          >
            <Eye size={13} />
            <span>Processed</span>
          </button>
          {differenceImage && (
            <button
              onClick={() => setComparisonMode('difference')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
                comparisonMode === 'difference'
                  ? 'bg-violet-500/20 text-violet-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Difference Heatmap"
            >
              <Sparkles size={13} />
              <span>Diff Map</span>
            </button>
          )}
        </div>

        {/* Center: Cursor tracker info */}
        {cursorPos && (
          <div className="hidden sm:flex items-center space-x-2 font-mono text-xs text-slate-300 bg-charcoal-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-cyan-400">X: {cursorPos.x}</span>
            <span className="text-violet-400">Y: {cursorPos.y}</span>
          </div>
        )}

        {/* Right: Zoom Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="font-mono text-slate-300 w-12 text-center text-[11px]">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={handleResetView}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            title="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="relative flex-1 w-full h-full min-h-[460px] overflow-hidden flex items-center justify-center bg-[radial-gradient(#1e2942_1px,transparent_1px)] [background-size:16px_16px] cursor-crosshair select-none"
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          }}
          className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl"
        >
          {comparisonMode === 'split' && originalImage && processedImage ? (
            <div className="relative overflow-hidden rounded shadow-2xl border border-slate-700/60 select-none">
              {/* Original (Base Layer) */}
              <img
                src={originalImage}
                alt="Original"
                className="block max-h-[560px] object-contain pointer-events-none"
              />
              {/* Processed (Clipped Top Layer) */}
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

              {/* Split Drag Bar */}
              <div
                style={{ left: `${splitPosition}%` }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingSplit(true);
                }}
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 cursor-ew-resize z-10 flex items-center justify-center hover:bg-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.8)]"
              >
                <div className="w-5 h-8 bg-charcoal-900 border border-cyan-400 rounded-md flex items-center justify-center text-[10px] text-cyan-300 shadow-md">
                  ⟷
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-slate-300 pointer-events-none border border-slate-800">
                ORIGINAL
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-cyan-400 pointer-events-none border border-cyan-900/50">
                PROCESSED
              </div>
            </div>
          ) : comparisonMode === 'side_by_side' && originalImage && processedImage ? (
            <div className="flex items-center space-x-4 p-4">
              <div className="relative border border-slate-800 rounded overflow-hidden">
                <img src={originalImage} alt="Original" className="max-h-[500px] object-contain" />
                <span className="absolute top-2 left-2 bg-black/70 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded">
                  ORIGINAL
                </span>
              </div>
              <div className="relative border border-cyan-500/40 rounded overflow-hidden shadow-glow-cyan">
                <img ref={imageRef} src={processedImage} alt="Processed" className="max-h-[500px] object-contain" />
                <span className="absolute top-2 left-2 bg-black/70 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                  PROCESSED
                </span>
              </div>
            </div>
          ) : comparisonMode === 'difference' && differenceImage ? (
            <div className="relative border border-violet-500/40 rounded overflow-hidden shadow-glow-violet">
              <img ref={imageRef} src={differenceImage} alt="Difference Heatmap" className="max-h-[560px] object-contain" />
              <span className="absolute top-2 left-2 bg-black/70 text-violet-300 text-[10px] font-mono px-2 py-0.5 rounded border border-violet-500/30">
                DIFFERENCE HEATMAP
              </span>
            </div>
          ) : (
            <div className="relative border border-slate-800 rounded overflow-hidden">
              <img
                ref={imageRef}
                src={processedImage || originalImage || ''}
                alt="Active View"
                className="max-h-[560px] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
