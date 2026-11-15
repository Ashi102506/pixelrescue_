import React, { useState } from 'react';
import {
  Grid,
  Info,
  Maximize2,
  Minimize2,
  Sliders,
  Layers,
  HelpCircle,
  Eye,
  Crosshair,
  Route,
  Share2,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { PixelInspection } from '../../types/dip';

export const FundamentalsLab: React.FC = () => {
  const { originalImage, metadata, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'sampling' | 'quantization' | 'channels' | 'distances' | 'connectivity'>('sampling');

  // Sampling state
  const [samplingFactor, setSamplingFactor] = useState<number>(4);
  const [samplingInterp, setSamplingInterp] = useState<string>('nearest');

  // Quantization state
  const [quantLevels, setQuantLevels] = useState<number>(8);

  // Pixel inspection
  const [inspection, setInspection] = useState<PixelInspection | null>(null);

  // Distance state
  const [p1, setP1] = useState<[number, number]>([40, 40]);
  const [p2, setP2] = useState<[number, number]>([180, 160]);
  const [distanceData, setDistanceData] = useState<any>(null);

  // Connectivity state
  const [connSeed, setConnSeed] = useState<[number, number]>([128, 128]);
  const [connThreshold, setConnThreshold] = useState<number>(128);
  const [connData, setConnData] = useState<any>(null);

  // Channels state
  const [channelsData, setChannelsData] = useState<any>(null);

  // Handlers
  const handlePixelHover = async (x: number, y: number) => {
    if (!originalImage) return;
    try {
      const res = await api.inspectPixel(originalImage, x, y, 3);
      setInspection(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePixelClick = (x: number, y: number) => {
    if (activeTab === 'distances') {
      // Alternate setting p1 and p2
      setP2([x, y]);
      handleCalculateDistance(p1, [x, y]);
    } else if (activeTab === 'connectivity') {
      setConnSeed([x, y]);
      handleRunConnectivity([x, y], connThreshold);
    }
  };

  const handleApplySampling = async (factor = samplingFactor, interp = samplingInterp) => {
    if (!originalImage) return;
    setProcessing(true, `Simulating 1/${factor}x sampling...`);
    try {
      const res = await api.simulateSampling(originalImage, factor, interp);
      setProcessedImage(res.image, `Downsampling (1/${factor}x, ${interp})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyQuantization = async (levels = quantLevels) => {
    if (!originalImage) return;
    setProcessing(true, `Quantizing to ${levels} levels...`);
    try {
      const res = await api.simulateQuantization(originalImage, levels);
      setProcessedImage(res.image, `Quantization (${levels} levels)`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleSeparateChannels = async () => {
    if (!originalImage) return;
    setProcessing(true, 'Separating color channels...');
    try {
      const res = await api.separateChannels(originalImage);
      setChannelsData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleCalculateDistance = async (pt1 = p1, pt2 = p2) => {
    try {
      const res = await api.calculateDistances(pt1, pt2, metadata?.width || 256, metadata?.height || 256);
      setDistanceData(res);
      setProcessedImage(res.overlay_image, 'Pixel Distance Metric Overlay');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunConnectivity = async (seed = connSeed, thresh = connThreshold) => {
    if (!originalImage) return;
    setProcessing(true, 'Analyzing 4 vs 8 connectivity...');
    try {
      const res = await api.analyzeConnectivity(originalImage, seed[0], seed[1], thresh);
      setConnData(res);
      setProcessedImage(res.comparison_overlay, 'Connected Component (4 vs 8 Connectivity)');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center Image Workspace */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <ImageViewer
          onPixelHover={handlePixelHover}
          onPixelClick={handlePixelClick}
        />
      </div>

      {/* Right Inspector & Controls */}
      <div className="w-full lg:w-96 bg-charcoal-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6 select-none shrink-0">
        {/* Module Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
              Module 1
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Image Fundamentals</h2>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: 'Sampling & Quantization Principles',
                category: 'Image Digitization',
                formula: String.raw`f(x,y) \xrightarrow{\text{Sampling}} f[n, m] \xrightarrow{\text{Quantization}} \hat{f}[n,m] \in \{0, 1, \dots, L-1\}`,
                variables: [
                  { symbol: 'f(x,y)', meaning: 'Continuous spatial 2D irradiance function' },
                  { symbol: '[n,m]', meaning: 'Discrete spatial coordinate grid (M rows x N columns)' },
                  { symbol: 'L', meaning: 'Number of discrete intensity quantization levels (typically L = 2^k)' },
                  { symbol: 'k', meaning: 'Bit depth (8-bit yields 256 intensity levels [0..255])' },
                ],
                explanation:
                  'Digitization of continuous analog images requires sampling (spatial coordinate discretization) and quantization (amplitude intensity discretization). Undersampling produces aliasing / pixelation. Insufficient quantization levels result in false contouring (visible ridge-like boundaries across smooth gradients).',
                complexity: 'O(M * N)',
                reference: 'Gonzalez & Woods, Digital Image Processing, Section 2.4',
              })
            }
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={16} className="text-cyan-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 bg-charcoal-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('sampling')}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'sampling' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sampling
          </button>
          <button
            onClick={() => setActiveTab('quantization')}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'quantization' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Quantization
          </button>
          <button
            onClick={() => {
              setActiveTab('channels');
              if (!channelsData) handleSeparateChannels();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'channels' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Channels
          </button>
          <button
            onClick={() => {
              setActiveTab('distances');
              handleCalculateDistance();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'distances' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Distances
          </button>
          <button
            onClick={() => {
              setActiveTab('connectivity');
              handleRunConnectivity();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors col-span-2 ${
              activeTab === 'connectivity' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Connectivity (4 vs 8)
          </button>
        </div>

        {/* Tab 1: Sampling */}
        {activeTab === 'sampling' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Spatial Resolution</span>
              <ParameterSlider
                label="Downsampling Factor"
                value={samplingFactor}
                min={1}
                max={32}
                step={1}
                unit="x"
                description={`Reduces grid to ${(metadata?.width || 256) / samplingFactor} × ${(metadata?.height || 256) / samplingFactor} points`}
                onChange={(val) => {
                  setSamplingFactor(val);
                  handleApplySampling(val, samplingInterp);
                }}
              />

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Interpolation:</span>
                <div className="flex space-x-1">
                  {['nearest', 'linear'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSamplingInterp(mode);
                        handleApplySampling(samplingFactor, mode);
                      }}
                      className={`px-2.5 py-1 rounded text-xs capitalize ${
                        samplingInterp === mode
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                          : 'bg-charcoal-850 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-charcoal-850/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
              <strong className="text-slate-300">Observation:</strong> Increasing the sampling factor downsamples spatial resolution. Nearest-neighbor reconstruction induces prominent square block artifacts (checkerboard pixelation), illustrating Nyquist-Shannon undersampling.
            </div>
          </div>
        )}

        {/* Tab 2: Quantization */}
        {activeTab === 'quantization' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Intensity Resolution</span>
              <ParameterSlider
                label="Discrete Intensity Levels (L)"
                value={quantLevels}
                min={2}
                max={128}
                step={2}
                description={`Equivalent bit depth: ~${Math.log2(quantLevels).toFixed(1)} bits/pixel`}
                onChange={(val) => {
                  setQuantLevels(val);
                  handleApplyQuantization(val);
                }}
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-2">
                <span>1-bit (B&W)</span>
                <span>4-bit (16)</span>
                <span>8-bit (256)</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-charcoal-850/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
              <strong className="text-slate-300">False Contouring:</strong> As intensity levels decrease below 16 (4-bit), smooth gradual luminance changes break down into distinct bands or steps. This phenomenon is known as false contouring.
            </div>
          </div>
        )}

        {/* Tab 3: Channels */}
        {activeTab === 'channels' && channelsData && (
          <div className="space-y-4">
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Decomposed Color Channels</span>
            <div className="grid grid-cols-3 gap-2">
              <div
                onClick={() => setProcessedImage(channelsData.r, 'Red Channel')}
                className="cursor-pointer bg-charcoal-950 p-2 rounded border border-red-900/50 hover:border-red-500 text-center"
              >
                <img src={channelsData.r} alt="Red" className="w-full h-16 object-cover rounded mb-1" />
                <span className="text-[11px] font-mono text-red-400 font-bold">Red (R)</span>
              </div>
              <div
                onClick={() => setProcessedImage(channelsData.g, 'Green Channel')}
                className="cursor-pointer bg-charcoal-950 p-2 rounded border border-green-900/50 hover:border-green-500 text-center"
              >
                <img src={channelsData.g} alt="Green" className="w-full h-16 object-cover rounded mb-1" />
                <span className="text-[11px] font-mono text-green-400 font-bold">Green (G)</span>
              </div>
              <div
                onClick={() => setProcessedImage(channelsData.b, 'Blue Channel')}
                className="cursor-pointer bg-charcoal-950 p-2 rounded border border-blue-900/50 hover:border-blue-500 text-center"
              >
                <img src={channelsData.b} alt="Blue" className="w-full h-16 object-cover rounded mb-1" />
                <span className="text-[11px] font-mono text-blue-400 font-bold">Blue (B)</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-xs font-mono text-slate-400 mb-2 block">Grayscale Projections</span>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setProcessedImage(channelsData.r_gray, 'Red (Gray Intensity)')}
                  className="cursor-pointer bg-charcoal-950 p-2 rounded border border-slate-800 hover:border-slate-600 text-center"
                >
                  <img src={channelsData.r_gray} alt="R Gray" className="w-full h-16 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-slate-400">R (Intensity)</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.g_gray, 'Green (Gray Intensity)')}
                  className="cursor-pointer bg-charcoal-950 p-2 rounded border border-slate-800 hover:border-slate-600 text-center"
                >
                  <img src={channelsData.g_gray} alt="G Gray" className="w-full h-16 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-slate-400">G (Intensity)</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.b_gray, 'Blue (Gray Intensity)')}
                  className="cursor-pointer bg-charcoal-950 p-2 rounded border border-slate-800 hover:border-slate-600 text-center"
                >
                  <img src={channelsData.b_gray} alt="B Gray" className="w-full h-16 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-slate-400">B (Intensity)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Distances */}
        {activeTab === 'distances' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Point Selection</span>
              <p className="text-[11px] text-slate-400 mt-1 mb-3">
                Click anywhere on the image to set Target Point P2.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-charcoal-900 p-2 rounded border border-emerald-500/40 text-emerald-400">
                  P1: ({p1[0]}, {p1[1]})
                </div>
                <div className="bg-charcoal-900 p-2 rounded border border-rose-500/40 text-rose-400">
                  P2: ({p2[0]}, {p2[1]})
                </div>
              </div>
            </div>

            {distanceData && (
              <div className="space-y-2 bg-charcoal-950 p-3 rounded-lg border border-slate-800 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-violet-400 font-semibold">Euclidean (De):</span>
                  <span className="text-white text-sm font-bold">{distanceData.euclidean} px</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800">
                  <span className="text-cyan-400 font-semibold">City-Block (D4):</span>
                  <span className="text-white text-sm font-bold">{distanceData.cityblock_d4} px</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-amber-400 font-semibold">Chessboard (D8):</span>
                  <span className="text-white text-sm font-bold">{distanceData.chessboard_d8} px</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Connectivity */}
        {activeTab === 'connectivity' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">Connected Components</span>
              <p className="text-[11px] text-slate-400 mt-1 mb-2">
                Click on the image to set Seed Point ({connSeed[0]}, {connSeed[1]}).
              </p>
              <ParameterSlider
                label="Binarization Threshold (T)"
                value={connThreshold}
                min={10}
                max={245}
                onChange={(val) => {
                  setConnThreshold(val);
                  handleRunConnectivity(connSeed, val);
                }}
              />
            </div>

            {connData && (
              <div className="space-y-2 bg-charcoal-950 p-3 rounded-lg border border-slate-800 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-cyan-400">4-Connected Pixels:</span>
                  <span className="text-white font-bold">{connData.pixels_4_connected}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-blue-400">8-Connected Pixels:</span>
                  <span className="text-white font-bold">{connData.pixels_8_connected}</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 font-sans">
                  Notice that 8-connectivity connects diagonally adjacent pixels, including regions where 4-connectivity stops.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Real-time Pixel Inspector Card */}
        {inspection && (
          <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 font-semibold uppercase">Pixel Coordinate</span>
              <span className="text-slate-300">
                ({inspection.pixel.x}, {inspection.pixel.y})
              </span>
            </div>

            {/* RGB Swatch & Values */}
            <div className="flex items-center space-x-3">
              <div
                style={{ backgroundColor: inspection.pixel.hex }}
                className="w-10 h-10 rounded-lg border border-slate-700 shadow-md shrink-0"
              />
              <div className="text-xs font-mono space-y-0.5">
                <div className="flex space-x-2">
                  <span className="text-red-400">R:{inspection.pixel.r}</span>
                  <span className="text-green-400">G:{inspection.pixel.g}</span>
                  <span className="text-blue-400">B:{inspection.pixel.b}</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Gray: {inspection.pixel.grayscale_equivalent} • Hex: {inspection.pixel.hex}
                </div>
              </div>
            </div>

            {/* 3x3 Local Neighborhood Matrix */}
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase mb-1.5 block">
                3×3 Local Neighborhood Window
              </span>
              <div className="grid grid-cols-3 gap-1 bg-charcoal-900 p-1.5 rounded-lg border border-slate-800/80 font-mono text-center text-[10px]">
                {inspection.neighborhood.matrix.map((row, rIdx) =>
                  row.map((val, cIdx) => {
                    const isCenter = rIdx === 1 && cIdx === 1;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`py-1 rounded ${
                          isCenter
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                            : 'bg-charcoal-950 text-slate-300'
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
