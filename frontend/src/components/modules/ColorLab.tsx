import React, { useState, useEffect } from 'react';
import {
  Palette,
  HelpCircle,
  Sliders,
  Sparkles,
  Layers,
  RefreshCw,
  Sun,
  Droplet,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';

export const ColorLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'hsi_adjust' | 'decomposition' | 'pseudocolor'>('hsi_adjust');

  // HSI adjustments
  const [hueShift, setHueShift] = useState<number>(0);
  const [saturationScale, setSaturationScale] = useState<number>(1.2);
  const [intensityScale, setIntensityScale] = useState<number>(1.0);

  // Channels decomposition
  const [channelsData, setChannelsData] = useState<any>(null);

  // Pseudo-color
  const [colormap, setColormap] = useState<string>('jet');
  const [intensitySlices, setIntensitySlices] = useState<number>(8);
  const [pseudoMode, setPseudoMode] = useState<'continuous' | 'sliced'>('continuous');

  const handleAdjustHSI = async (h = hueShift, s = saturationScale, i = intensityScale) => {
    if (!originalImage) return;
    setProcessing(true, 'Transforming RGB -> HSI -> Modified -> RGB...');
    try {
      const res = await api.adjustHSI(originalImage, h, s, i);
      setProcessedImage(res.image, `HSI Adjusted (H+${h}°, S*${s}, I*${i})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleDecomposeChannels = async () => {
    if (!originalImage) return;
    setProcessing(true, 'Decomposing RGB, CMY, HSI...');
    try {
      const res = await api.decomposeColor(originalImage);
      setChannelsData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyPseudocolor = async (cmap = colormap, slices = intensitySlices, mode = pseudoMode) => {
    if (!originalImage) return;
    setProcessing(true, `Applying ${cmap} pseudo-color...`);
    try {
      const res = await api.applyPseudocolor(originalImage, cmap, slices);
      const imgTarget = mode === 'continuous' ? res.continuous_pseudocolor : res.sliced_pseudocolor;
      setProcessedImage(imgTarget, `Pseudo-color (${cmap}, ${mode})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'hsi_adjust', label: 'HSI Adjust' },
    { id: 'decomposition', label: 'Decompose' },
    { id: 'pseudocolor', label: 'Pseudocolor' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-obsidian-950">
      {/* Center Image Workspace */}
      <div className="flex-1 p-3 flex flex-col min-w-0">
        <ImageViewer />
      </div>

      {/* Right Precision Telemetry & Controls */}
      <div className="w-full lg:w-96 bg-obsidian-900 border-l border-hairline p-4 overflow-y-auto space-y-4 select-none shrink-0 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-rose-400 font-semibold px-1.5 py-0.5 rounded bg-rose-950/50 border border-rose-800/40">
              06
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Color Processing Lab
              </h2>
              <p className="text-[10px] font-mono text-slate-500">Color Spaces & Decoupled HSI</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: 'Color Models & HSI Trigonometric Formulation',
                category: 'Color Digital Image Processing',
                formula: String.raw`H = \begin{cases} \theta & B \le G \\ 360^\circ - \theta & B > G \end{cases}, \quad S = 1 - \frac{3}{R+G+B}\min(R,G,B), \quad I = \frac{1}{3}(R+G+B)`,
                variables: [
                  { symbol: 'H', meaning: 'Hue angle [0..360°] representing pure dominant color wavelength' },
                  { symbol: 'S', meaning: 'Saturation [0..1] representing purity / dilution with white light' },
                  { symbol: 'I', meaning: 'Intensity [0..1] representing achromatic brightness' },
                  { symbol: 'theta (θ)', meaning: 'arccos( 0.5[(R-G)+(R-B)] / sqrt((R-G)^2 + (R-B)(G-B)) )' },
                  { symbol: 'CMY', meaning: 'Subtractive primaries: [C, M, Y]^T = [1, 1, 1]^T - [R, G, B]^T' },
                ],
                explanation:
                  'The RGB color model is hardware-oriented (monitors and cameras) but perceptually non-intuitive. The HSI model decouples intensity (brightness) from chromatic information (Hue and Saturation), making it the ideal space for human color manipulation and color image processing.',
                complexity: 'O(M * N) with piecewise trigonometric sector mapping',
                reference: 'Gonzalez & Woods, Digital Image Processing, Chapter 6',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-rose-400" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-obsidian-950 p-1 rounded-md border border-hairline text-[11px] font-mono">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'decomposition' && !channelsData) handleDecomposeChannels();
                if (tab.id === 'pseudocolor') handleApplyPseudocolor();
              }}
              className={`py-1.5 px-2 rounded font-medium transition-colors text-center ${
                activeTab === tab.id
                  ? 'bg-surface-raised text-rose-300 font-semibold border border-hairline shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-surface-raised/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: HSI Adjustments */}
        {activeTab === 'hsi_adjust' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <ParameterSlider
                label="Hue Rotation (ΔH)"
                value={hueShift}
                min={0}
                max={360}
                step={5}
                unit="°"
                description="Radial chromatic rotation across the 360° color cylinder"
                onChange={(val) => {
                  setHueShift(val);
                  handleAdjustHSI(val, saturationScale, intensityScale);
                }}
              />

              <ParameterSlider
                label="Saturation Factor (k_s)"
                value={saturationScale}
                min={0.0}
                max={3.0}
                step={0.1}
                unit="x"
                description="0 = Achromatic gray, 1 = Identity, >1 = Hyper-saturated"
                onChange={(val) => {
                  setSaturationScale(val);
                  handleAdjustHSI(hueShift, val, intensityScale);
                }}
              />

              <ParameterSlider
                label="Intensity Factor (k_i)"
                value={intensityScale}
                min={0.2}
                max={2.0}
                step={0.1}
                unit="x"
                description="Achromatic luminance scaling independent of chromaticity"
                onChange={(val) => {
                  setIntensityScale(val);
                  handleAdjustHSI(hueShift, saturationScale, val);
                }}
              />
            </div>

            <div className="text-[11px] text-slate-400 bg-obsidian-950 p-3 rounded-lg border border-hairline leading-relaxed font-mono">
              <span className="text-rose-400 font-semibold uppercase text-[10px] block mb-1">
                Decoupled Color Processing:
              </span>
              Modifying intensity in HSI space does not alter hue wavelength or saturation, preventing the color tint shifts common in raw RGB manipulations.
            </div>
          </div>
        )}

        {/* Tab 2: Channels Decomposition */}
        {activeTab === 'decomposition' && channelsData && (
          <div className="space-y-3">
            {/* RGB */}
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block mb-1.5">
                RGB Additive Primaries
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setProcessedImage(channelsData.rgb.r, 'Red Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-red-500/80 text-center group"
                >
                  <img src={channelsData.rgb.r} alt="R" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-red-400 font-semibold">Red</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.rgb.g, 'Green Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-emerald-500/80 text-center group"
                >
                  <img src={channelsData.rgb.g} alt="G" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">Green</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.rgb.b, 'Blue Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-blue-500/80 text-center group"
                >
                  <img src={channelsData.rgb.b} alt="B" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-blue-400 font-semibold">Blue</span>
                </button>
              </div>
            </div>

            {/* CMY */}
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold block mb-1.5">
                CMY Subtractive Primaries
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setProcessedImage(channelsData.cmy.c, 'Cyan Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-cyan-500/80 text-center group"
                >
                  <img src={channelsData.cmy.c} alt="C" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">Cyan</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.cmy.m, 'Magenta Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-pink-500/80 text-center group"
                >
                  <img src={channelsData.cmy.m} alt="M" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-pink-400 font-semibold">Magenta</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.cmy.y, 'Yellow Channel')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-amber-500/80 text-center group"
                >
                  <img src={channelsData.cmy.y} alt="Y" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-amber-400 font-semibold">Yellow</span>
                </button>
              </div>
            </div>

            {/* HSI */}
            <div>
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-semibold block mb-1.5">
                HSI Perceptual Decomposition
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setProcessedImage(channelsData.hsi.h_colored, 'Hue (H)')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-rose-500/80 text-center group"
                >
                  <img src={channelsData.hsi.h_colored} alt="H" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-rose-400 font-semibold">Hue (H)</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.hsi.s, 'Saturation (S)')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-slate-500 text-center group"
                >
                  <img src={channelsData.hsi.s} alt="S" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-slate-300 font-semibold">Saturation</span>
                </button>
                <button
                  onClick={() => setProcessedImage(channelsData.hsi.i, 'Intensity (I)')}
                  className="bg-surface-raised p-1.5 rounded border border-hairline hover:border-slate-500 text-center group"
                >
                  <img src={channelsData.hsi.i} alt="I" className="w-full h-12 object-cover rounded mb-1 border border-hairline" />
                  <span className="text-[10px] font-mono text-slate-300 font-semibold">Intensity</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pseudo-Color */}
        {activeTab === 'pseudocolor' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-semibold block">
                Colormap LUT Palette
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {['jet', 'viridis', 'plasma', 'inferno', 'turbo', 'bone', 'rainbow', 'hot'].map((cm) => (
                  <button
                    key={cm}
                    onClick={() => {
                      setColormap(cm);
                      handleApplyPseudocolor(cm);
                    }}
                    className={`py-1.5 px-2 rounded capitalize border transition-colors ${
                      colormap === cm
                        ? 'bg-obsidian-950 text-rose-300 border-rose-800/60 font-semibold shadow-inner'
                        : 'bg-surface-raised text-slate-400 border-hairline hover:text-slate-200'
                    }`}
                  >
                    {cm}
                  </button>
                ))}
              </div>

              {/* Mode toggle */}
              <div className="pt-2 border-t border-hairline">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Transfer Mode:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <button
                    onClick={() => {
                      setPseudoMode('continuous');
                      handleApplyPseudocolor(colormap, intensitySlices, 'continuous');
                    }}
                    className={`py-1.5 rounded border ${
                      pseudoMode === 'continuous'
                        ? 'bg-obsidian-950 text-cyan-300 border-cyan-800/60 font-semibold'
                        : 'bg-surface-raised text-slate-400 border-hairline'
                    }`}
                  >
                    Continuous
                  </button>
                  <button
                    onClick={() => {
                      setPseudoMode('sliced');
                      handleApplyPseudocolor(colormap, intensitySlices, 'sliced');
                    }}
                    className={`py-1.5 rounded border ${
                      pseudoMode === 'sliced'
                        ? 'bg-obsidian-950 text-cyan-300 border-cyan-800/60 font-semibold'
                        : 'bg-surface-raised text-slate-400 border-hairline'
                    }`}
                  >
                    Intensity Slicing
                  </button>
                </div>
              </div>

              {pseudoMode === 'sliced' && (
                <ParameterSlider
                  label="Discrete Slice Bands"
                  value={intensitySlices}
                  min={2}
                  max={24}
                  step={2}
                  onChange={(val) => {
                    setIntensitySlices(val);
                    handleApplyPseudocolor(colormap, val, 'sliced');
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
