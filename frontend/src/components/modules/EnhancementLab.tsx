import React, { useState, useEffect } from 'react';
import {
  Sliders,
  BarChart2,
  HelpCircle,
  RefreshCw,
  Sun,
  Contrast,
  Sparkles,
  Activity,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { HistogramData } from '../../types/dip';

export const EnhancementLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'intensity' | 'histogram' | 'equalization' | 'specification'>('intensity');

  // Intensity Transformation Parameters
  const [selectedTransform, setSelectedTransform] = useState<string>('gamma');
  const [gamma, setGamma] = useState<number>(1.5);
  const [contrastAlpha, setContrastAlpha] = useState<number>(1.2);
  const [brightnessBeta, setBrightnessBeta] = useState<number>(15);
  const [r1, setR1] = useState<number>(50);
  const [s1, setS1] = useState<number>(15);
  const [r2, setR2] = useState<number>(180);
  const [s2, setS2] = useState<number>(230);
  const [binaryThreshold, setBinaryThreshold] = useState<number>(128);

  // Histogram state
  const [histData, setHistData] = useState<HistogramData | null>(null);
  const [eqResult, setEqResult] = useState<any>(null);

  // Specification state
  const [specTargetType, setSpecTargetType] = useState<string>('gaussian');
  const [gaussMean, setGaussMean] = useState<number>(128);
  const [gaussStd, setGaussStd] = useState<number>(45);

  // Load initial histogram
  useEffect(() => {
    if (originalImage) {
      api.getHistogram(originalImage).then((res) => setHistData(res)).catch(console.error);
    }
  }, [originalImage]);

  const handleApplyTransform = async (op = selectedTransform) => {
    if (!originalImage) return;
    setProcessing(true, `Applying ${op} transform...`);
    try {
      const res = await api.applyTransform({
        image: originalImage,
        operation: op,
        gamma,
        alpha: contrastAlpha,
        beta: brightnessBeta,
        r1,
        s1,
        r2,
        s2,
        threshold_val: binaryThreshold,
      });
      setProcessedImage(res.image, `${op.toUpperCase()} Transform`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleEqualize = async () => {
    if (!originalImage) return;
    setProcessing(true, 'Calculating Histogram Equalization...');
    try {
      const res = await api.equalizeHistogram(originalImage);
      setEqResult(res);
      setProcessedImage(res.image, 'Histogram Equalization');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleSpecify = async () => {
    if (!originalImage) return;
    setProcessing(true, `Matching histogram to ${specTargetType}...`);
    try {
      const res = await api.specifyHistogram({
        image: originalImage,
        target_type: specTargetType,
        gaussian_mean: gaussMean,
        gaussian_std: gaussStd,
      });
      setProcessedImage(res.image, `Histogram Matching (${specTargetType})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'intensity', label: 'Point Transfer' },
    { id: 'histogram', label: 'PDF / CDF' },
    { id: 'equalization', label: 'Equalize' },
    { id: 'specification', label: 'Match' },
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
            <span className="text-[10px] font-mono text-purple-400 font-semibold px-1.5 py-0.5 rounded bg-purple-950/50 border border-purple-800/40">
              02
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Enhancement Studio
              </h2>
              <p className="text-[10px] font-mono text-slate-500">Spatial Point & Histogram Mapping</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: 'Point Transformations & Histogram Equalization',
                category: 'Spatial Domain Enhancement',
                formula: String.raw`s = T(r) = (L - 1) \sum_{j=0}^{k} p_r(r_j) = \frac{L - 1}{M N} \sum_{j=0}^{k} n_j`,
                variables: [
                  { symbol: 'r', meaning: 'Input pixel gray-level intensity [0..L-1]' },
                  { symbol: 's', meaning: 'Enhanced output pixel gray-level intensity' },
                  { symbol: 'p_r(r_k)', meaning: 'Probability density function (PDF): n_k / (M * N)' },
                  { symbol: 'T(r)', meaning: 'Monotonically increasing transformation function' },
                  { symbol: 'gamma (γ)', meaning: 'Power-law exponent (γ < 1 brightens, γ > 1 darkens)' },
                ],
                explanation:
                  'Spatial enhancement operates directly on pixels through point processing transformation functions s = T(r). Histogram equalization produces a transformation function based on the cumulative distribution function (CDF), yielding an approximately uniform output intensity distribution that maximizes global image contrast.',
                complexity: 'O(M * N) via 256-entry Lookup Table (LUT)',
                reference: 'Gonzalez & Woods, Digital Image Processing, Section 3.2 & 3.3',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-purple-400" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 bg-obsidian-950 p-1 rounded-md border border-hairline text-[11px] font-mono">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'equalization') handleEqualize();
                if (tab.id === 'specification') handleSpecify();
              }}
              className={`py-1.5 px-1 rounded transition-colors text-center truncate ${
                activeTab === tab.id
                  ? 'bg-surface-raised text-purple-300 font-semibold border border-hairline shadow-sm'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-surface-raised/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Intensity Transformations */}
        {activeTab === 'intensity' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-1.5 bg-obsidian-950 p-1.5 rounded border border-hairline text-[11px] font-mono">
              {[
                { id: 'negative', label: 'Negative (Inv)' },
                { id: 'log', label: 'Logarithm' },
                { id: 'inv_log', label: 'Inverse Log' },
                { id: 'gamma', label: 'Power-Law (γ)' },
                { id: 'contrast_stretch', label: 'Piecewise Stretch' },
                { id: 'threshold', label: 'Binary Threshold' },
                { id: 'brightness_contrast', label: 'Linear Scaling' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedTransform(op.id);
                    handleApplyTransform(op.id);
                  }}
                  className={`py-1.5 px-2 rounded text-left transition-colors truncate text-[11px] ${
                    selectedTransform === op.id
                      ? 'bg-surface-raised text-purple-300 border border-purple-800/60 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised/30'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Parameter Controls for Active Transform */}
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              {selectedTransform === 'gamma' && (
                <div className="space-y-3">
                  <ParameterSlider
                    label="Gamma Parameter (γ)"
                    value={gamma}
                    min={0.1}
                    max={4.0}
                    step={0.05}
                    description="γ < 1 brightens shadows; γ > 1 compresses highlights"
                    onChange={(val) => {
                      setGamma(val);
                      handleApplyTransform('gamma');
                    }}
                  />
                  <div className="text-[11px] font-mono text-purple-300 bg-obsidian-950 p-2 rounded border border-hairline text-center">
                    s = 255 · (r / 255)^{gamma.toFixed(2)}
                  </div>
                </div>
              )}

              {selectedTransform === 'brightness_contrast' && (
                <div className="space-y-3">
                  <ParameterSlider
                    label="Contrast Gain (α)"
                    value={contrastAlpha}
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    onChange={(val) => {
                      setContrastAlpha(val);
                      handleApplyTransform('brightness_contrast');
                    }}
                  />
                  <ParameterSlider
                    label="Brightness Bias (β)"
                    value={brightnessBeta}
                    min={-100}
                    max={100}
                    step={2}
                    onChange={(val) => {
                      setBrightnessBeta(val);
                      handleApplyTransform('brightness_contrast');
                    }}
                  />
                </div>
              )}

              {selectedTransform === 'contrast_stretch' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <ParameterSlider
                      label="r1 (input min)"
                      value={r1}
                      min={1}
                      max={r2 - 1}
                      onChange={(v) => {
                        setR1(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                    <ParameterSlider
                      label="s1 (output min)"
                      value={s1}
                      min={0}
                      max={255}
                      onChange={(v) => {
                        setS1(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ParameterSlider
                      label="r2 (input max)"
                      value={r2}
                      min={r1 + 1}
                      max={254}
                      onChange={(v) => {
                        setR2(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                    <ParameterSlider
                      label="s2 (output max)"
                      value={s2}
                      min={0}
                      max={255}
                      onChange={(v) => {
                        setS2(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                  </div>
                </div>
              )}

              {selectedTransform === 'threshold' && (
                <ParameterSlider
                  label="Binarization Cutoff (T)"
                  value={binaryThreshold}
                  min={0}
                  max={255}
                  step={1}
                  description="s = 255 if r ≥ T else 0"
                  onChange={(val) => {
                    setBinaryThreshold(val);
                    handleApplyTransform('threshold');
                  }}
                />
              )}

              {selectedTransform === 'negative' && (
                <div className="text-[11px] font-mono text-slate-400 bg-obsidian-950 p-2.5 rounded border border-hairline">
                  Photographic Inversion: s = 255 - r
                </div>
              )}

              {selectedTransform === 'log' && (
                <div className="text-[11px] font-mono text-slate-400 bg-obsidian-950 p-2.5 rounded border border-hairline">
                  Dynamic Range Compression: s = c · ln(1 + r)
                </div>
              )}

              {selectedTransform === 'inv_log' && (
                <div className="text-[11px] font-mono text-slate-400 bg-obsidian-950 p-2.5 rounded border border-hairline">
                  Exponential Expansion: s = c · (e^(r/c) - 1)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Histogram & CDF */}
        {activeTab === 'histogram' && histData && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-purple-400 uppercase tracking-wider font-semibold">
                  256-Bin Discrete Intensity PDF
                </span>
                <span className="text-slate-400">
                  Total: {histData.channels.gray.counts.reduce((a, b) => a + b, 0)} px
                </span>
              </div>

              {/* Scientific Monochromatic Bar Spectrum */}
              <div className="h-32 w-full flex items-end space-x-px bg-obsidian-950 p-1.5 rounded border border-hairline overflow-hidden">
                {histData.channels.gray.counts.map((cnt, i) => {
                  if (i % 2 !== 0) return null; // 128 sampled bins
                  const maxCount = Math.max(...histData.channels.gray.counts);
                  const hPercent = (cnt / (maxCount || 1)) * 100;
                  return (
                    <div
                      key={i}
                      style={{ height: `${Math.max(1, hPercent)}%` }}
                      className="flex-1 bg-slate-300 hover:bg-cyan-400 transition-colors"
                      title={`Intensity [${i}]: ${cnt} samples`}
                    />
                  );
                })}
              </div>

              {/* Intensity Axis */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>0 (Min)</span>
                <span>128 (Mid)</span>
                <span>255 (Max)</span>
              </div>
            </div>

            {/* CDF Technical Summary */}
            <div className="bg-obsidian-950 p-3 rounded-lg border border-hairline text-[11px] font-mono text-slate-400 space-y-1">
              <span className="text-purple-400 font-semibold uppercase text-[10px] block">
                Cumulative Distribution Function:
              </span>
              <p className="text-slate-400 leading-relaxed font-sans">
                Normalized sum of discrete probabilities monotonically accumulating to 1.0. Its derivative corresponds to the probability density function (PDF).
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Equalization */}
        {activeTab === 'equalization' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                  CDF-Based Transfer LUT
                </span>
                <button
                  onClick={handleEqualize}
                  className="px-2 py-1 bg-surface-overlay hover:bg-obsidian-950 border border-hairline text-slate-300 text-[10px] font-mono rounded flex items-center space-x-1"
                >
                  <RefreshCw size={11} />
                  <span>Re-calculate</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Generates a uniform histogram distribution through the transformation:
                <div className="py-2 text-center text-xs font-mono text-purple-300 bg-obsidian-950 rounded border border-hairline my-2">
                  s_k = round( (L - 1) · ∑ p_r(r_j) )
                </div>
                Maximizes global dynamic contrast without user-specified heuristic parameters.
              </div>

              {eqResult && (
                <div className="p-2.5 bg-obsidian-950 rounded border border-hairline text-[10px] font-mono space-y-1">
                  <div className="text-emerald-400 font-semibold">✓ Equalization Complete</div>
                  <div className="text-slate-400">Dynamic Range Span: [0..255] Fully Utilized</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Histogram Specification / Matching */}
        {activeTab === 'specification' && (
          <div className="space-y-3">
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-semibold block">
                Target Prior Distribution
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {['gaussian', 'uniform'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSpecTargetType(type);
                      handleSpecify();
                    }}
                    className={`py-1.5 px-2 rounded capitalize text-[11px] ${
                      specTargetType === type
                        ? 'bg-obsidian-950 text-purple-300 border border-purple-800/60 font-semibold shadow-inner'
                        : 'bg-surface-raised text-slate-400 border border-hairline hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {specTargetType === 'gaussian' && (
                <div className="space-y-2.5 pt-2 border-t border-hairline">
                  <ParameterSlider
                    label="Gaussian Mean (μ)"
                    value={gaussMean}
                    min={30}
                    max={225}
                    onChange={(val) => {
                      setGaussMean(val);
                      handleSpecify();
                    }}
                  />
                  <ParameterSlider
                    label="Standard Deviation (σ)"
                    value={gaussStd}
                    min={10}
                    max={80}
                    onChange={(val) => {
                      setGaussStd(val);
                      handleSpecify();
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
