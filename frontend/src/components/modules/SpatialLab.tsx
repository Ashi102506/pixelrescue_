import React, { useState } from 'react';
import {
  Layers,
  HelpCircle,
  Crosshair,
  Sliders,
  Sparkles,
  Activity,
  Calculator,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { KernelStepData } from '../../types/dip';

export const SpatialLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [activeCategory, setActiveCategory] = useState<'smoothing' | 'sharpening' | 'edges' | 'step_math'>('smoothing');
  const [filterType, setFilterType] = useState<string>('gaussian');
  const [kernelSize, setKernelSize] = useState<number>(3);
  const [gaussianSigma, setGaussianSigma] = useState<number>(1.2);
  const [kBoost, setKBoost] = useState<number>(1.5);
  const [laplacianMode, setLaplacianMode] = useState<string>('8_neighbor');

  // Interactive step math state
  const [inspectCoord, setInspectCoord] = useState<[number, number]>([128, 128]);
  const [stepData, setStepData] = useState<KernelStepData | null>(null);
  const [activeKernelMatrix, setActiveKernelMatrix] = useState<number[][] | null>(null);

  const handleApplyFilter = async (fType = filterType, kSize = kernelSize, sig = gaussianSigma, kb = kBoost) => {
    if (!originalImage) return;
    setProcessing(true, `Running 2D Convolution: ${fType}...`);
    try {
      const res = await api.applySpatialFilter({
        image: originalImage,
        filter_type: fType,
        kernel_size: kSize,
        sigma: sig,
        k_boost: kb,
        laplacian_mode: laplacianMode,
      });
      setActiveKernelMatrix(res.kernel);
      setProcessedImage(res.image, `Spatial Filter: ${fType} (${kSize}x${kSize})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleInspectStep = async (x: number, y: number) => {
    if (!originalImage) return;
    setInspectCoord([x, y]);
    try {
      const res = await api.inspectKernelStep({
        image: originalImage,
        x,
        y,
        filter_type: filterType,
        kernel_size: kernelSize,
        sigma: gaussianSigma,
      });
      setStepData(res);
      setProcessedImage(res.overlay_image, `Kernel Neighborhood at (${x}, ${y})`);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { id: 'smoothing', label: 'Smoothing' },
    { id: 'sharpening', label: 'Sharpen' },
    { id: 'edges', label: 'Gradients' },
    { id: 'step_math', label: 'Step Math' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-obsidian-950">
      {/* Center Image Workspace */}
      <div className="flex-1 p-3 flex flex-col min-w-0">
        <ImageViewer
          onPixelClick={(x, y) => {
            if (activeCategory === 'step_math') {
              handleInspectStep(x, y);
            }
          }}
        />
      </div>

      {/* Right Precision Telemetry & Controls */}
      <div className="w-full lg:w-96 bg-obsidian-900 border-l border-hairline p-4 overflow-y-auto space-y-4 select-none shrink-0 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40">
              03
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Spatial Filtering Lab
              </h2>
              <p className="text-[10px] font-mono text-slate-500">2D Discrete Convolution & Kernels</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: '2D Discrete Spatial Convolution',
                category: 'Neighborhood Operations',
                formula: String.raw`g(x,y) = \sum_{s=-a}^{a} \sum_{t=-b}^{b} w(s,t) \cdot f(x+s, y+t)`,
                variables: [
                  { symbol: 'f(x,y)', meaning: 'Original spatial input image' },
                  { symbol: 'w(s,t)', meaning: 'Spatial filter mask / convolution kernel coefficients' },
                  { symbol: 'm x n', meaning: 'Kernel dimensions (m = 2a + 1, n = 2b + 1, typically odd)' },
                  { symbol: 'g(x,y)', meaning: 'Filtered output response pixel intensity' },
                ],
                explanation:
                  'Spatial filtering processes images directly by shifting a kernel matrix w(s,t) over each pixel (x,y), computing the sum of products between the mask weights and neighborhood pixels. Smoothing filters integrate intensities (acting as low-pass filters), while sharpening filters employ spatial derivatives (Laplacian, Sobel, Prewitt) to highlight rapid intensity discontinuities (edges).',
                complexity: 'O(M * N * m * n)',
                reference: 'Gonzalez & Woods, Digital Image Processing, Section 3.4 - 3.6',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-emerald-400" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-obsidian-950 p-1 rounded-md border border-hairline text-[11px] font-mono">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                if (cat.id === 'smoothing') {
                  setFilterType('gaussian');
                  handleApplyFilter('gaussian');
                } else if (cat.id === 'sharpening') {
                  setFilterType('laplacian');
                  handleApplyFilter('laplacian');
                } else if (cat.id === 'edges') {
                  setFilterType('sobel');
                  handleApplyFilter('sobel');
                } else if (cat.id === 'step_math') {
                  handleInspectStep(inspectCoord[0], inspectCoord[1]);
                }
              }}
              className={`py-1.5 px-1 rounded transition-colors text-center truncate ${
                activeCategory === cat.id
                  ? 'bg-surface-raised text-emerald-300 font-semibold border border-hairline shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-surface-raised/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Smoothing */}
        {activeCategory === 'smoothing' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1 bg-obsidian-950 p-1.5 rounded border border-hairline text-[11px] font-mono">
              {[
                { id: 'mean', label: 'Box Mean' },
                { id: 'weighted_average', label: 'Weighted' },
                { id: 'gaussian', label: 'Gaussian' },
                { id: 'median', label: 'Median' },
                { id: 'min', label: 'Min (Erode)' },
                { id: 'max', label: 'Max (Dilate)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterType(f.id);
                    handleApplyFilter(f.id);
                  }}
                  className={`py-1.5 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-surface-raised text-emerald-300 border border-emerald-800/60 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <ParameterSlider
                label="Kernel Size (N × N)"
                value={kernelSize}
                min={3}
                max={15}
                step={2}
                unit="px"
                onChange={(val) => {
                  setKernelSize(val);
                  handleApplyFilter(filterType, val);
                }}
              />

              {filterType === 'gaussian' && (
                <ParameterSlider
                  label="Gaussian Sigma (σ)"
                  value={gaussianSigma}
                  min={0.2}
                  max={5.0}
                  step={0.1}
                  onChange={(val) => {
                    setGaussianSigma(val);
                    handleApplyFilter(filterType, kernelSize, val);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Sharpening */}
        {activeCategory === 'sharpening' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1 bg-obsidian-950 p-1.5 rounded border border-hairline text-[11px] font-mono">
              {[
                { id: 'laplacian', label: 'Laplacian' },
                { id: 'unsharp_masking', label: 'Unsharp' },
                { id: 'high_boost', label: 'High-Boost' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterType(f.id);
                    handleApplyFilter(f.id);
                  }}
                  className={`py-1.5 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-surface-raised text-emerald-300 border border-emerald-800/60 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              {filterType === 'laplacian' && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                    Kernel Adjacency Topology
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <button
                      onClick={() => {
                        setLaplacianMode('4_neighbor');
                        handleApplyFilter('laplacian');
                      }}
                      className={`py-1.5 rounded border ${
                        laplacianMode === '4_neighbor'
                          ? 'bg-obsidian-950 text-emerald-300 border-emerald-800/60 font-semibold'
                          : 'bg-surface-raised text-slate-400 border-hairline'
                      }`}
                    >
                      4-Neighbor (C: -4)
                    </button>
                    <button
                      onClick={() => {
                        setLaplacianMode('8_neighbor');
                        handleApplyFilter('laplacian');
                      }}
                      className={`py-1.5 rounded border ${
                        laplacianMode === '8_neighbor'
                          ? 'bg-obsidian-950 text-emerald-300 border-emerald-800/60 font-semibold'
                          : 'bg-surface-raised text-slate-400 border-hairline'
                      }`}
                    >
                      8-Neighbor (C: -8)
                    </button>
                  </div>
                </div>
              )}

              {filterType === 'high_boost' && (
                <ParameterSlider
                  label="Boost Factor (k)"
                  value={kBoost}
                  min={1.1}
                  max={4.0}
                  step={0.1}
                  description="g(x,y) = f(x,y) + k · g_mask(x,y)"
                  onChange={(val) => {
                    setKBoost(val);
                    handleApplyFilter('high_boost', kernelSize, gaussianSigma, val);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Edges */}
        {activeCategory === 'edges' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1 bg-obsidian-950 p-1.5 rounded border border-hairline text-[11px] font-mono">
              {[
                { id: 'sobel', label: 'Sobel Mag' },
                { id: 'sobel_x', label: 'Sobel Gx' },
                { id: 'sobel_y', label: 'Sobel Gy' },
                { id: 'prewitt', label: 'Prewitt Mag' },
                { id: 'prewitt_x', label: 'Prewitt Gx' },
                { id: 'prewitt_y', label: 'Prewitt Gy' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterType(f.id);
                    handleApplyFilter(f.id);
                  }}
                  className={`py-1.5 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-surface-raised text-emerald-300 border border-emerald-800/60 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-obsidian-950 p-3 rounded-lg border border-hairline text-[11px] font-mono text-slate-400 leading-relaxed space-y-1">
              <span className="text-emerald-400 font-semibold uppercase text-[10px] block">
                1st Order Gradient Operators:
              </span>
              <div><span className="text-slate-300">Gx:</span> Emphasizes vertical edges | <span className="text-slate-300">Gy:</span> Horizontal edges</div>
              <div><span className="text-cyan-300">|∇f| = √(Gx² + Gy²):</span> Isotropic directional gradient magnitude</div>
            </div>
          </div>
        )}

        {/* Tab 4: Step-by-Step Convolution Math Stepper */}
        {activeCategory === 'step_math' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3 rounded-lg border border-hairline space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-semibold uppercase text-[10px]">
                  Local Patch Coordinate
                </span>
                <span className="text-slate-300 tabular-nums">[{inspectCoord[0]}, {inspectCoord[1]}]</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Click any pixel in the viewport to execute a live step-by-step 3×3 convolution evaluation.
              </p>
            </div>

            {stepData && (
              <div className="space-y-3">
                {/* 1. Neighborhood Patch P */}
                <div className="bg-surface-raised p-3 rounded-lg border border-hairline">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block mb-1.5">
                    1. Neighborhood Patch f(x+s, y+t)
                  </span>
                  <div className="grid grid-cols-3 gap-1 font-mono text-center text-[10px]">
                    {stepData.neighborhood_patch.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="bg-obsidian-950 py-1 rounded border border-hairline text-slate-300 tabular-nums">
                          {val}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Kernel Matrix W */}
                <div className="bg-surface-raised p-3 rounded-lg border border-hairline">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block mb-1.5">
                    2. Filter Kernel w(s,t)
                  </span>
                  <div className="grid grid-cols-3 gap-1 font-mono text-center text-[10px]">
                    {stepData.kernel_matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="bg-obsidian-950 py-1 rounded border border-hairline text-emerald-400 tabular-nums">
                          {val.toFixed(2)}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Element-wise Products & Summation */}
                <div className="bg-surface-raised p-3 rounded-lg border border-hairline font-mono text-[11px] space-y-1.5">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold block">
                    3. Discrete Sum of Products: ∑ w(s,t) · f(...)
                  </span>
                  <div className="flex justify-between py-1 border-b border-hairline">
                    <span className="text-slate-400">Float Summation:</span>
                    <span className="text-white font-bold tabular-nums">{stepData.summation.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between py-1 items-center">
                    <span className="text-cyan-400 font-semibold">Normalized Output g(x,y):</span>
                    <span className="text-cyan-300 font-bold text-sm tabular-nums bg-obsidian-950 px-2 py-0.5 rounded border border-hairline">
                      {stepData.resulting_pixel}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
