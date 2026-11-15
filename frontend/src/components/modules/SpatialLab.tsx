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

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center Image Workspace */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <ImageViewer
          onPixelClick={(x, y) => {
            if (activeCategory === 'step_math') {
              handleInspectStep(x, y);
            }
          }}
        />
      </div>

      {/* Right Inspector & Controls */}
      <div className="w-full lg:w-96 bg-charcoal-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6 select-none shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              Module 3
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Spatial Filtering Lab</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-emerald-400" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-charcoal-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveCategory('smoothing');
              setFilterType('gaussian');
              handleApplyFilter('gaussian');
            }}
            className={`py-1.5 px-1 rounded font-medium transition-colors text-center ${
              activeCategory === 'smoothing' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Smoothing
          </button>
          <button
            onClick={() => {
              setActiveCategory('sharpening');
              setFilterType('laplacian');
              handleApplyFilter('laplacian');
            }}
            className={`py-1.5 px-1 rounded font-medium transition-colors text-center ${
              activeCategory === 'sharpening' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sharpen
          </button>
          <button
            onClick={() => {
              setActiveCategory('edges');
              setFilterType('sobel');
              handleApplyFilter('sobel');
            }}
            className={`py-1.5 px-1 rounded font-medium transition-colors text-center ${
              activeCategory === 'edges' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Edges
          </button>
          <button
            onClick={() => {
              setActiveCategory('step_math');
              handleInspectStep(inspectCoord[0], inspectCoord[1]);
            }}
            className={`py-1.5 px-1 rounded font-medium transition-colors text-center ${
              activeCategory === 'step_math' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Math Step
          </button>
        </div>

        {/* Tab 1: Smoothing */}
        {activeCategory === 'smoothing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 bg-charcoal-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              {[
                { id: 'mean', label: 'Box Mean' },
                { id: 'weighted_average', label: 'Weighted Avg' },
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
                  className={`py-2 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <ParameterSlider
                label="Kernel Dimensions (N × N)"
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
                  label="Gaussian Standard Deviation (σ)"
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
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 bg-charcoal-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              {[
                { id: 'laplacian', label: 'Laplacian' },
                { id: 'unsharp_masking', label: 'Unsharp Mask' },
                { id: 'high_boost', label: 'High-Boost' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterType(f.id);
                    handleApplyFilter(f.id);
                  }}
                  className={`py-2 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              {filterType === 'laplacian' && (
                <div>
                  <span className="text-xs text-slate-300 font-medium block mb-2">Connectivity Mode:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <button
                      onClick={() => {
                        setLaplacianMode('4_neighbor');
                        handleApplyFilter('laplacian');
                      }}
                      className={`py-1.5 rounded border ${
                        laplacianMode === '4_neighbor'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-charcoal-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      4-Neighbor (center -4)
                    </button>
                    <button
                      onClick={() => {
                        setLaplacianMode('8_neighbor');
                        handleApplyFilter('laplacian');
                      }}
                      className={`py-1.5 rounded border ${
                        laplacianMode === '8_neighbor'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-charcoal-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      8-Neighbor (center -8)
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
                  description="g(x,y) = f(x,y) + k * g_mask(x,y)"
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
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-1.5 bg-charcoal-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              {[
                { id: 'sobel', label: 'Sobel Magnitude' },
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
                  className={`py-2 px-1 rounded text-center transition-colors truncate ${
                    filterType === f.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
              First-order partial derivative gradient operators: <br />
              <code className="text-emerald-400">Gx</code> highlights vertical edges; <br />
              <code className="text-emerald-400">Gy</code> highlights horizontal edges; <br />
              Magnitude <code className="text-cyan-400">M = sqrt(Gx² + Gy²)</code> captures omnidirectional edges.
            </div>
          </div>
        )}

        {/* Tab 4: Step-by-Step Convolution Math Stepper */}
        {activeCategory === 'step_math' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 font-semibold uppercase">Inspection Target</span>
                <span className="text-slate-300">({inspectCoord[0]}, {inspectCoord[1]})</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Click anywhere on the image to compute the step-by-step element-wise convolution at that exact coordinate.
              </p>
            </div>

            {stepData && (
              <div className="space-y-4">
                {/* 1. Neighborhood Patch P */}
                <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold block mb-1.5">
                    1. Neighborhood Patch f(x+s, y+t)
                  </span>
                  <div className="grid grid-cols-3 gap-1 font-mono text-center text-[10px]">
                    {stepData.neighborhood_patch.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="bg-charcoal-900 py-1 rounded text-slate-300">
                          {val}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Kernel Matrix W */}
                <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block mb-1.5">
                    2. Filter Kernel w(s,t)
                  </span>
                  <div className="grid grid-cols-3 gap-1 font-mono text-center text-[10px]">
                    {stepData.kernel_matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="bg-charcoal-900 py-1 rounded text-emerald-400">
                          {val.toFixed(2)}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Element-wise Products & Summation */}
                <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold block">
                    3. Sum of Products: ∑ w(s,t) · f(...)
                  </span>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-xs">
                    <span className="text-slate-400">Float Sum:</span>
                    <span className="text-white font-bold">{stepData.summation.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs">
                    <span className="text-cyan-400 font-semibold">Clipped Output g(x,y):</span>
                    <span className="text-cyan-300 font-bold text-sm">{stepData.resulting_pixel}</span>
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
