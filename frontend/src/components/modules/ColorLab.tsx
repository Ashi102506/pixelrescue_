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

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center Image Workspace */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <ImageViewer />
      </div>

      {/* Right Inspector & Controls */}
      <div className="w-full lg:w-96 bg-charcoal-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6 select-none shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-rose-400 font-semibold tracking-wider uppercase">
              Module 6
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Color Processing Lab</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-rose-400" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-1 bg-charcoal-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('hsi_adjust')}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'hsi_adjust' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            HSI Adjust
          </button>
          <button
            onClick={() => {
              setActiveTab('decomposition');
              if (!channelsData) handleDecomposeChannels();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'decomposition' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Decompose
          </button>
          <button
            onClick={() => {
              setActiveTab('pseudocolor');
              handleApplyPseudocolor();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'pseudocolor' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pseudo-color
          </button>
        </div>

        {/* Tab 1: HSI Adjustments */}
        {activeTab === 'hsi_adjust' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <ParameterSlider
                label="Hue Angle Shift (ΔH)"
                value={hueShift}
                min={0}
                max={360}
                step={5}
                unit="°"
                description="Rotates color wheel; shifts hues continuously"
                onChange={(val) => {
                  setHueShift(val);
                  handleAdjustHSI(val, saturationScale, intensityScale);
                }}
              />

              <ParameterSlider
                label="Saturation Scale (k_s)"
                value={saturationScale}
                min={0.0}
                max={3.0}
                step={0.1}
                unit="x"
                description="0 = monochrome gray, 1 = normal, >1 = vibrant"
                onChange={(val) => {
                  setSaturationScale(val);
                  handleAdjustHSI(hueShift, val, intensityScale);
                }}
              />

              <ParameterSlider
                label="Intensity Scale (k_i)"
                value={intensityScale}
                min={0.2}
                max={2.0}
                step={0.1}
                unit="x"
                description="Scales achromatic luminance independent of color"
                onChange={(val) => {
                  setIntensityScale(val);
                  handleAdjustHSI(hueShift, saturationScale, val);
                }}
              />
            </div>

            <div className="text-xs text-slate-400 bg-charcoal-850/50 p-3 rounded-lg border border-slate-800 leading-relaxed">
              <strong className="text-slate-300">Decoupled Processing:</strong> Adjusting intensity in HSI modifies lightness without altering color chromaticity (Hue or Saturation), which is mathematically impossible in raw RGB.
            </div>
          </div>
        )}

        {/* Tab 2: Channels Decomposition */}
        {activeTab === 'decomposition' && channelsData && (
          <div className="space-y-4">
            {/* RGB */}
            <div>
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase block mb-1.5">
                RGB Additive Primaries
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setProcessedImage(channelsData.rgb.r, 'Red Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-red-500 text-center"
                >
                  <img src={channelsData.rgb.r} alt="R" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-red-400 font-bold">Red</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.rgb.g, 'Green Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-green-500 text-center"
                >
                  <img src={channelsData.rgb.g} alt="G" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-green-400 font-bold">Green</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.rgb.b, 'Blue Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-blue-500 text-center"
                >
                  <img src={channelsData.rgb.b} alt="B" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-blue-400 font-bold">Blue</span>
                </div>
              </div>
            </div>

            {/* CMY */}
            <div>
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase block mb-1.5">
                CMY Subtractive Primaries
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setProcessedImage(channelsData.cmy.c, 'Cyan Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-cyan-500 text-center"
                >
                  <img src={channelsData.cmy.c} alt="C" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">Cyan</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.cmy.m, 'Magenta Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-pink-500 text-center"
                >
                  <img src={channelsData.cmy.m} alt="M" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-pink-400 font-bold">Magenta</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.cmy.y, 'Yellow Channel')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-yellow-500 text-center"
                >
                  <img src={channelsData.cmy.y} alt="Y" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-yellow-400 font-bold">Yellow</span>
                </div>
              </div>
            </div>

            {/* HSI */}
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase block mb-1.5">
                HSI Perceptual Channels
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setProcessedImage(channelsData.hsi.h_colored, 'Hue (H)')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-rose-500 text-center"
                >
                  <img src={channelsData.hsi.h_colored} alt="H" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-rose-400 font-bold">Hue</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.hsi.s, 'Saturation (S)')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-rose-500 text-center"
                >
                  <img src={channelsData.hsi.s} alt="S" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-slate-300 font-bold">Saturation</span>
                </div>
                <div
                  onClick={() => setProcessedImage(channelsData.hsi.i, 'Intensity (I)')}
                  className="cursor-pointer bg-charcoal-950 p-1.5 rounded border border-slate-800 hover:border-rose-500 text-center"
                >
                  <img src={channelsData.hsi.i} alt="I" className="w-full h-14 object-cover rounded mb-1" />
                  <span className="text-[10px] font-mono text-slate-300 font-bold">Intensity</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pseudo-Color */}
        {activeTab === 'pseudocolor' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <span className="text-xs font-mono text-rose-400 font-semibold uppercase block">
                Colormap Palette
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {['jet', 'viridis', 'plasma', 'inferno', 'turbo', 'bone', 'rainbow', 'hot'].map((cm) => (
                  <button
                    key={cm}
                    onClick={() => {
                      setColormap(cm);
                      handleApplyPseudocolor(cm);
                    }}
                    className={`py-2 px-2 rounded capitalize border font-semibold ${
                      colormap === cm
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                        : 'bg-charcoal-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {cm}
                  </button>
                ))}
              </div>

              {/* Mode toggle */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300 font-medium block mb-2">Coloring Mode:</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    onClick={() => {
                      setPseudoMode('continuous');
                      handleApplyPseudocolor(colormap, intensitySlices, 'continuous');
                    }}
                    className={`py-1.5 rounded border ${
                      pseudoMode === 'continuous'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-charcoal-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Continuous Map
                  </button>
                  <button
                    onClick={() => {
                      setPseudoMode('sliced');
                      handleApplyPseudocolor(colormap, intensitySlices, 'sliced');
                    }}
                    className={`py-1.5 rounded border ${
                      pseudoMode === 'sliced'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                        : 'bg-charcoal-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Intensity Slicing
                  </button>
                </div>
              </div>

              {pseudoMode === 'sliced' && (
                <ParameterSlider
                  label="Number of Slicing Bands"
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
