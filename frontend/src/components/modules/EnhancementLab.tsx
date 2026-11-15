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
            <span className="text-[10px] font-mono text-purple-400 font-semibold tracking-wider uppercase">
              Module 2
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Enhancement Studio</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-purple-400" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-1 bg-charcoal-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('intensity')}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'intensity' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Intensity Transforms
          </button>
          <button
            onClick={() => setActiveTab('histogram')}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'histogram' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Histogram & CDF
          </button>
          <button
            onClick={() => {
              setActiveTab('equalization');
              handleEqualize();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'equalization' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Equalization
          </button>
          <button
            onClick={() => {
              setActiveTab('specification');
              handleSpecify();
            }}
            className={`py-1.5 px-2 rounded font-medium transition-colors ${
              activeTab === 'specification' ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matching
          </button>
        </div>

        {/* Tab 1: Intensity Transformations */}
        {activeTab === 'intensity' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-1.5 bg-charcoal-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              {[
                { id: 'negative', label: 'Negative' },
                { id: 'log', label: 'Logarithm' },
                { id: 'inv_log', label: 'Inverse Log' },
                { id: 'gamma', label: 'Gamma (Power)' },
                { id: 'contrast_stretch', label: 'Stretching' },
                { id: 'threshold', label: 'Thresholding' },
                { id: 'brightness_contrast', label: 'Linear Scaling' },
              ].map((op) => (
                <button
                  key={op.id}
                  onClick={() => {
                    setSelectedTransform(op.id);
                    handleApplyTransform(op.id);
                  }}
                  className={`py-1.5 px-2 rounded text-left transition-colors truncate ${
                    selectedTransform === op.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Parameter Controls for Active Transform */}
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              {selectedTransform === 'gamma' && (
                <div>
                  <ParameterSlider
                    label="Gamma Exponent (γ)"
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
                  <div className="text-[11px] font-mono text-purple-400 mt-2 bg-charcoal-900 p-2 rounded border border-purple-900/30 text-center">
                    s = 255 · (r / 255)^{gamma.toFixed(2)}
                  </div>
                </div>
              )}

              {selectedTransform === 'brightness_contrast' && (
                <div className="space-y-3">
                  <ParameterSlider
                    label="Contrast Slope (α)"
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
                    label="Brightness Shift (β)"
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
                      label="r1 (input low)"
                      value={r1}
                      min={1}
                      max={r2 - 1}
                      onChange={(v) => {
                        setR1(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                    <ParameterSlider
                      label="s1 (output low)"
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
                      label="r2 (input high)"
                      value={r2}
                      min={r1 + 1}
                      max={254}
                      onChange={(v) => {
                        setR2(v);
                        handleApplyTransform('contrast_stretch');
                      }}
                    />
                    <ParameterSlider
                      label="s2 (output high)"
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
                  label="Global Threshold (T)"
                  value={binaryThreshold}
                  min={0}
                  max={255}
                  step={1}
                  description="s = 255 if r >= T else 0"
                  onChange={(val) => {
                    setBinaryThreshold(val);
                    handleApplyTransform('threshold');
                  }}
                />
              )}

              {selectedTransform === 'negative' && (
                <div className="text-xs text-slate-300">
                  Mathematical photographic negative: Inverts all pixel amplitudes according to <code>s = 255 - r</code>.
                </div>
              )}

              {selectedTransform === 'log' && (
                <div className="text-xs text-slate-300">
                  Log transformation compresses large dynamic variations: <code>s = c · ln(1 + r)</code>. Crucial for visualizing Fourier spectrums.
                </div>
              )}

              {selectedTransform === 'inv_log' && (
                <div className="text-xs text-slate-300">
                  Inverse-log / exponential mapping: Expands bright pixels while compressing dark levels.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Histogram & CDF */}
        {activeTab === 'histogram' && histData && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono mb-3">
                <span className="text-purple-400 font-semibold uppercase">256-Bin Intensity Histogram</span>
                <span className="text-slate-400">PDF & CDF</span>
              </div>

              {/* Bar Chart Visualization (SVG) */}
              <div className="h-36 w-full flex items-end space-x-0.5 bg-charcoal-900 p-2 rounded-lg border border-slate-800/80 overflow-hidden">
                {histData.channels.gray.counts.map((cnt, i) => {
                  if (i % 4 !== 0) return null; // sample for display
                  const maxCount = Math.max(...histData.channels.gray.counts);
                  const hPercent = (cnt / (maxCount || 1)) * 100;
                  return (
                    <div
                      key={i}
                      style={{ height: `${Math.max(2, hPercent)}%` }}
                      className="flex-1 bg-gradient-to-t from-purple-700 to-cyan-400 rounded-t-sm"
                      title={`Intensity ${i}: ${cnt} pixels`}
                    />
                  );
                })}
              </div>

              {/* Intensity Axis */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>0 (Black)</span>
                <span>128 (Mid)</span>
                <span>255 (White)</span>
              </div>
            </div>

            {/* CDF Visualization */}
            <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase block mb-1">
                Cumulative Distribution Function (CDF)
              </span>
              <p className="text-[11px] text-slate-400 leading-tight">
                Normalized sum of probabilities ending at exactly 1.0. The shape of the CDF directly governs the histogram equalization transfer curve.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Equalization */}
        {activeTab === 'equalization' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400 font-semibold uppercase">
                  Discrete Transformation LUT
                </span>
                <button
                  onClick={handleEqualize}
                  className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 text-purple-200 text-xs rounded flex items-center space-x-1"
                >
                  <RefreshCw size={12} />
                  <span>Re-run</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">
                Applies the probability integral transform discrete mapping:
                <div className="py-2 text-center text-sm font-mono text-cyan-300">
                  s_k = round( 255 · ∑ p_r(r_j) )
                </div>
                For color images, equalization is performed in the luminance channel to avoid chromatic distortion.
              </div>

              {eqResult && (
                <div className="p-3 bg-charcoal-900 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-400">Equalization Applied Successfully</div>
                  <div className="text-cyan-400 text-[11px]">Dynamic Range: 0 → 255 Fully Utilized</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Histogram Specification / Matching */}
        {activeTab === 'specification' && (
          <div className="space-y-4">
            <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono text-purple-400 font-semibold uppercase block">
                Target Distribution Shape
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['gaussian', 'uniform'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSpecTargetType(type);
                      handleSpecify();
                    }}
                    className={`py-1.5 px-2 rounded capitalize font-medium ${
                      specTargetType === type
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-charcoal-850 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {specTargetType === 'gaussian' && (
                <div className="space-y-2 pt-2">
                  <ParameterSlider
                    label="Gaussian Center Mean (μ)"
                    value={gaussMean}
                    min={30}
                    max={225}
                    onChange={(val) => {
                      setGaussMean(val);
                      handleSpecify();
                    }}
                  />
                  <ParameterSlider
                    label="Gaussian Width (σ)"
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
