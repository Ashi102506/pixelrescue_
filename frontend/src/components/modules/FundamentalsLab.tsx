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

  const handleCalculateDistance = async (pt1: [number, number] = p1, pt2: [number, number] = p2) => {
    try {
      const res = await api.calculateDistances(pt1, pt2);
      setDistanceData(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunConnectivity = async (seed: [number, number] = connSeed, thresh: number = connThreshold) => {
    if (!originalImage) return;
    setProcessing(true, 'Computing 4 and 8-connectivity...');
    try {
      const res = await api.analyzeConnectivity(originalImage, seed[0], seed[1], thresh);
      setConnData(res);
      setProcessedImage(res.overlay_8_connected, `8-Connected Component (Seed: ${seed[0]}, ${seed[1]})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'sampling', label: 'Sampling' },
    { id: 'quantization', label: 'Quantization' },
    { id: 'channels', label: 'Channels' },
    { id: 'distances', label: 'Distance' },
    { id: 'connectivity', label: '4/8 Conn' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-obsidian-950">
      {/* Center Image Workspace */}
      <div className="flex-1 p-3 flex flex-col min-w-0">
        <ImageViewer
          onPixelHover={handlePixelHover}
          onPixelClick={handlePixelClick}
        />
      </div>

      {/* Right Precision Telemetry & Controls */}
      <div className="w-full lg:w-96 bg-obsidian-900 border-l border-hairline p-4 overflow-y-auto space-y-4 select-none shrink-0 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
              01
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Image Fundamentals
              </h2>
              <p className="text-[10px] font-mono text-slate-500">Spatial & Intensity Digitization</p>
            </div>
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
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-cyan-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-5 gap-1 bg-obsidian-950 p-1 rounded-md border border-hairline text-[11px] font-mono">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'channels' && !channelsData) handleSeparateChannels();
                if (tab.id === 'distances') handleCalculateDistance();
                if (tab.id === 'connectivity') handleRunConnectivity();
              }}
              className={`py-1.5 px-1 rounded transition-colors text-center truncate ${
                activeTab === tab.id
                  ? 'bg-surface-raised text-cyan-300 font-semibold border border-hairline shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-surface-raised/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Sampling */}
        {activeTab === 'sampling' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Spatial Sub-sampling
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {metadata ? `${Math.round(metadata.width / samplingFactor)}×${Math.round(metadata.height / samplingFactor)} px` : ''}
                </span>
              </div>

              <ParameterSlider
                label="Downsample Step"
                value={samplingFactor}
                min={1}
                max={32}
                step={1}
                unit="x"
                description={`Grid downsampled to 1/${samplingFactor} resolution`}
                onChange={(val) => {
                  setSamplingFactor(val);
                  handleApplySampling(val, samplingInterp);
                }}
              />

              <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Reconstruction:</span>
                <div className="flex space-x-1">
                  {['nearest', 'linear'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSamplingInterp(mode);
                        handleApplySampling(samplingFactor, mode);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider ${
                        samplingInterp === mode
                          ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-700/50'
                          : 'bg-obsidian-950 text-slate-500 hover:text-slate-300 border border-hairline'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-obsidian-950 p-3 rounded-lg border border-hairline leading-relaxed font-mono">
              <span className="text-cyan-400 font-semibold uppercase text-[10px] block mb-1">Nyquist-Shannon Limit:</span>
              Spatial downsampling without a pre-filter creates severe high-frequency aliasing and pixelation blocks.
            </div>
          </div>
        )}

        {/* Tab 2: Quantization */}
        {activeTab === 'quantization' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Amplitude Quantization
                </span>
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  ~{Math.log2(quantLevels).toFixed(1)} bpp
                </span>
              </div>

              <ParameterSlider
                label="Gray Levels (L)"
                value={quantLevels}
                min={2}
                max={128}
                step={2}
                description="Discrete intensity partitions [0..L-1]"
                onChange={(val) => {
                  setQuantLevels(val);
                  handleApplyQuantization(val);
                }}
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-hairline">
                <span>1-bit (2)</span>
                <span>4-bit (16)</span>
                <span>8-bit (256)</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-obsidian-950 p-3 rounded-lg border border-hairline leading-relaxed font-mono">
              <span className="text-amber-400 font-semibold uppercase text-[10px] block mb-1">False Contouring:</span>
              Reducing quantization below 16 levels reveals visible artificial boundary steps across smooth gradients.
            </div>
          </div>
        )}

        {/* Tab 3: Channels */}
        {activeTab === 'channels' && channelsData && (
          <div className="space-y-3">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
              Tri-Stimulus RGB Split
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setProcessedImage(channelsData.r, 'Red Channel')}
                className="bg-surface-raised p-1.5 rounded border border-red-950/60 hover:border-red-500/80 transition-colors text-center group"
              >
                <img src={channelsData.r} alt="Red" className="w-full h-14 object-cover rounded mb-1 border border-hairline" />
                <span className="text-[10px] font-mono text-red-400 font-semibold">Red (R)</span>
              </button>
              <button
                onClick={() => setProcessedImage(channelsData.g, 'Green Channel')}
                className="bg-surface-raised p-1.5 rounded border border-emerald-950/60 hover:border-emerald-500/80 transition-colors text-center group"
              >
                <img src={channelsData.g} alt="Green" className="w-full h-14 object-cover rounded mb-1 border border-hairline" />
                <span className="text-[10px] font-mono text-emerald-400 font-semibold">Green (G)</span>
              </button>
              <button
                onClick={() => setProcessedImage(channelsData.b, 'Blue Channel')}
                className="bg-surface-raised p-1.5 rounded border border-blue-950/60 hover:border-blue-500/80 transition-colors text-center group"
              >
                <img src={channelsData.b} alt="Blue" className="w-full h-14 object-cover rounded mb-1 border border-hairline" />
                <span className="text-[10px] font-mono text-blue-400 font-semibold">Blue (B)</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block pt-2">
              Scalar Gray Projections
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setProcessedImage(channelsData.r_gray, 'Red (Gray Intensity)')}
                className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-slate-500 text-center"
              >
                <img src={channelsData.r_gray} alt="R Gray" className="w-full h-14 object-cover rounded mb-1" />
                <span className="text-[10px] font-mono text-slate-400">R Intensity</span>
              </button>
              <button
                onClick={() => setProcessedImage(channelsData.g_gray, 'Green (Gray Intensity)')}
                className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-slate-500 text-center"
              >
                <img src={channelsData.g_gray} alt="G Gray" className="w-full h-14 object-cover rounded mb-1" />
                <span className="text-[10px] font-mono text-slate-400">G Intensity</span>
              </button>
              <button
                onClick={() => setProcessedImage(channelsData.b_gray, 'Blue (Gray Intensity)')}
                className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-slate-500 text-center"
              >
                <img src={channelsData.b_gray} alt="B Gray" className="w-full h-14 object-cover rounded mb-1" />
                <span className="text-[10px] font-mono text-slate-400">B Intensity</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Distances */}
        {activeTab === 'distances' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3 rounded-lg border border-hairline space-y-2.5">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
                Spatial Coordinate Bench
              </span>
              <p className="text-[10px] text-slate-400">
                Click any pixel in viewport to place target point P2.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-obsidian-950 p-2 rounded border border-emerald-900/60 text-emerald-400">
                  P1: ({p1[0]}, {p1[1]})
                </div>
                <div className="bg-obsidian-950 p-2 rounded border border-rose-900/60 text-rose-400">
                  P2: ({p2[0]}, {p2[1]})
                </div>
              </div>
            </div>

            {distanceData && (
              <div className="bg-surface-raised p-3 rounded-lg border border-hairline font-mono text-xs space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-hairline">
                  <span className="text-slate-400">Euclidean (De):</span>
                  <span className="text-white font-bold tabular-nums">{distanceData.euclidean} px</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-hairline">
                  <span className="text-slate-400">City-Block (D4):</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{distanceData.cityblock_d4} px</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Chessboard (D8):</span>
                  <span className="text-amber-400 font-bold tabular-nums">{distanceData.chessboard_d8} px</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Connectivity */}
        {activeTab === 'connectivity' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3 rounded-lg border border-hairline space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Seed Coordinate
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({connSeed[0]}, {connSeed[1]})
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Click viewport to relocate seed flood point.
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
              <div className="bg-surface-raised p-3 rounded-lg border border-hairline font-mono text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-hairline">
                  <span className="text-cyan-400">4-Connected Set:</span>
                  <span className="text-white font-bold tabular-nums">{connData.pixels_4_connected} px</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-emerald-400">8-Connected Set:</span>
                  <span className="text-white font-bold tabular-nums">{connData.pixels_8_connected} px</span>
                </div>
                <p className="text-[10px] text-slate-500 font-sans pt-1">
                  8-connectivity includes diagonal adjacency, yielding larger connected components across noisy gaps.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Precision Pixel Inspector Card */}
        {inspection && (
          <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">
                Active Pixel Probe
              </span>
              <span className="text-slate-300 tabular-nums">
                [{inspection.pixel.x}, {inspection.pixel.y}]
              </span>
            </div>

            {/* RGB Swatch & Values */}
            <div className="flex items-center space-x-3 bg-obsidian-950 p-2 rounded border border-hairline">
              <div
                style={{ backgroundColor: inspection.pixel.hex }}
                className="w-8 h-8 rounded border border-hairline shadow-inner shrink-0"
              />
              <div className="text-[11px] font-mono space-y-0.5">
                <div className="flex space-x-2 font-medium">
                  <span className="text-red-400">R:{inspection.pixel.r}</span>
                  <span className="text-emerald-400">G:{inspection.pixel.g}</span>
                  <span className="text-blue-400">B:{inspection.pixel.b}</span>
                </div>
                <div className="text-slate-500 text-[10px]">
                  Gray: {inspection.pixel.grayscale_equivalent} · {inspection.pixel.hex}
                </div>
              </div>
            </div>

            {/* 3x3 Local Neighborhood Matrix */}
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1 block">
                3×3 Discrete Spatial Neighborhood Window
              </span>
              <div className="grid grid-cols-3 gap-1 bg-obsidian-950 p-1.5 rounded border border-hairline font-mono text-center text-[10px]">
                {inspection.neighborhood.matrix.map((row, rIdx) =>
                  row.map((val, cIdx) => {
                    const isCenter = rIdx === 1 && cIdx === 1;
                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`py-1 rounded font-mono tabular-nums ${
                          isCenter
                            ? 'bg-cyan-950/70 text-cyan-300 font-bold border border-cyan-700/60'
                            : 'bg-surface-raised/40 text-slate-400 border border-hairline/60'
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
