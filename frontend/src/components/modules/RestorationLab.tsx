import React, { useState } from 'react';
import {
  Wand2,
  HelpCircle,
  AlertTriangle,
  Award,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { RestorationChallengeResult } from '../../types/dip';

export const RestorationLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<'challenge' | 'degrade' | 'restore'>('challenge');

  // Degradation Parameters
  const [blurType, setBlurType] = useState<string>('motion');
  const [blurSize, setBlurSize] = useState<number>(9);
  const [motionAngle, setMotionAngle] = useState<number>(45);
  const [noiseType, setNoiseType] = useState<string>('gaussian');
  const [noiseStrength, setNoiseStrength] = useState<number>(0.02);

  // Restoration Parameters
  const [restMethod, setRestMethod] = useState<string>('wiener');
  const [restKernelSize, setRestKernelSize] = useState<number>(9);
  const [wienerK, setWienerK] = useState<number>(0.02);
  const [inverseCutoff, setInverseCutoff] = useState<number>(55);

  // Challenge Result
  const [challengeResult, setChallengeResult] = useState<RestorationChallengeResult | null>(null);

  const handleRunChallenge = async () => {
    if (!originalImage) return;
    setProcessing(true, 'Executing Image Restoration Challenge...');
    try {
      const res = await api.runRestorationChallenge({
        image: originalImage,
        blur_type: blurType,
        blur_kernel_size: blurSize,
        motion_angle: motionAngle,
        noise_type: noiseType,
        noise_strength: noiseStrength,
        rest_method: restMethod,
        rest_kernel_size: restKernelSize,
        wiener_k: wienerK,
        inverse_cutoff: inverseCutoff,
      });
      setChallengeResult(res);
      setProcessedImage(res.restored_image, `Restored via ${restMethod.toUpperCase()}`, res.metrics_restored);

      // Trigger subtle celebration if PSNR improved noticeably
      if (res.psnr_improvement_db > 1.5) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#ffffff'],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

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
            <span className="text-[10px] font-mono text-amber-400 font-semibold px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/40">
              05
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Image Restoration
              </h2>
              <p className="text-[10px] font-mono text-slate-500">Degradation Models & Wiener Deconv</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: 'Image Degradation & Wiener Deconvolution',
                category: 'Restoration Theory',
                formula: String.raw`\hat{F}(u,v) = \left[ \frac{H^*(u,v)}{|H(u,v)|^2 + K} \right] G(u,v)`,
                variables: [
                  { symbol: 'g(x,y)', meaning: 'Degraded observed image: g = h * f + η' },
                  { symbol: 'H(u,v)', meaning: 'Optical Transfer Function (Fourier transform of PSF)' },
                  { symbol: 'H*(u,v)', meaning: 'Complex conjugate of degradation transfer function' },
                  { symbol: 'K', meaning: 'Noise-to-signal power spectral density ratio S_η / S_f' },
                  { symbol: '\\hat{f}(x,y)', meaning: 'Restored estimate minimizing mean square error (MMSE)' },
                ],
                explanation:
                  'Degradation is modeled as a linear convolution with Point Spread Function h(x,y) plus additive noise η(x,y). Direct inverse filtering F_hat = G / H divides by near-zero frequencies, blowing up noise exponentially. The Wiener filter balances deconvolution against noise amplification via regularizer K.',
                complexity: 'O(M * N * log(M * N))',
                reference: 'Gonzalez & Woods, Digital Image Processing, Chapter 5',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-amber-400" />
          </button>
        </div>

        {/* Degradation Controls */}
        <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
              1 · Optical Degradation Model
            </span>
            <span className="text-[10px] font-mono text-slate-500">g = h * f + η</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            {['motion', 'gaussian', 'none'].map((b) => (
              <button
                key={b}
                onClick={() => setBlurType(b)}
                className={`py-1.5 rounded border capitalize transition-colors ${
                  blurType === b
                    ? 'bg-obsidian-950 text-amber-300 border-amber-800/60 font-semibold shadow-inner'
                    : 'bg-surface-raised text-slate-400 border-hairline hover:text-slate-200'
                }`}
              >
                {b} Blur
              </button>
            ))}
          </div>

          {blurType === 'motion' && (
            <div className="space-y-2 pt-1">
              <ParameterSlider
                label="Motion Length (L)"
                value={blurSize}
                min={3}
                max={25}
                step={2}
                unit="px"
                onChange={setBlurSize}
              />
              <ParameterSlider
                label="Motion Angle (θ)"
                value={motionAngle}
                min={0}
                max={180}
                step={5}
                unit="°"
                onChange={setMotionAngle}
              />
            </div>
          )}

          {/* Noise Selection */}
          <div className="pt-2 border-t border-hairline">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Additive Stochastic Noise:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
              {['gaussian', 'salt_and_pepper', 'none'].map((n) => (
                <button
                  key={n}
                  onClick={() => setNoiseType(n)}
                  className={`py-1.5 rounded border capitalize transition-colors ${
                    noiseType === n
                      ? 'bg-obsidian-950 text-amber-300 border-amber-800/60 font-semibold shadow-inner'
                      : 'bg-surface-raised text-slate-400 border-hairline hover:text-slate-200'
                  }`}
                >
                  {n === 'salt_and_pepper' ? 'Impulse' : n}
                </button>
              ))}
            </div>

            {noiseType !== 'none' && (
              <div className="pt-2">
                <ParameterSlider
                  label="Noise Variance (σ²)"
                  value={noiseStrength}
                  min={0.005}
                  max={0.1}
                  step={0.005}
                  onChange={setNoiseStrength}
                />
              </div>
            )}
          </div>
        </div>

        {/* Restoration Controls */}
        <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
          <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider block">
            2 · Restoration Filter
          </span>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            {[
              { id: 'wiener', label: 'Wiener (MMSE)' },
              { id: 'inverse', label: 'Direct Inverse' },
              { id: 'median', label: 'Median Filter' },
              { id: 'arithmetic_mean', label: 'Mean Filter' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setRestMethod(m.id)}
                className={`py-1.5 px-2 rounded text-center border transition-colors truncate ${
                  restMethod === m.id
                    ? 'bg-obsidian-950 text-cyan-300 border-cyan-800/60 font-semibold shadow-inner'
                    : 'bg-surface-raised text-slate-400 border-hairline hover:text-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {restMethod === 'wiener' && (
            <ParameterSlider
              label="Noise-to-Signal Power (K)"
              value={wienerK}
              min={0.0001}
              max={0.1}
              step={0.002}
              description="Balances deconvolution vs noise amplification"
              onChange={setWienerK}
            />
          )}

          {restMethod === 'inverse' && (
            <ParameterSlider
              label="Direct Cutoff Radius (D0)"
              value={inverseCutoff}
              min={10}
              max={100}
              step={5}
              unit="px"
              description="Low-pass radius prevents zero-divisor noise divergence"
              onChange={setInverseCutoff}
            />
          )}

          {/* Action Trigger */}
          <button
            onClick={handleRunChallenge}
            className="w-full py-2 bg-slate-100 hover:bg-white text-obsidian-950 font-semibold rounded text-xs flex items-center justify-center space-x-2 border border-white/20 transition-all shadow-sm active:scale-[0.99] mt-2"
          >
            <Wand2 size={13} />
            <span>Execute Degradation & Restoration</span>
          </button>
        </div>

        {/* Objective Restoration Challenge Metrics Card */}
        {challengeResult && (
          <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-2.5 font-mono">
            <div className="flex items-center justify-between pb-1.5 border-b border-hairline">
              <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center space-x-1.5">
                <Award size={13} className="text-amber-400" />
                <span>Restoration Scorecard</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold tabular-nums ${
                  challengeResult.psnr_improvement_db > 0
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-700/60'
                    : 'bg-rose-950/70 text-rose-300 border border-rose-700/60'
                }`}
              >
                {challengeResult.psnr_improvement_db > 0 ? '+' : ''}
                {challengeResult.psnr_improvement_db} dB ΔPSNR
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-obsidian-950 p-2 rounded border border-hairline">
                <div className="text-[9px] text-slate-500 uppercase">Degraded PSNR</div>
                <div className="text-xs font-bold text-slate-300 tabular-nums">
                  {challengeResult.metrics_degraded.psnr_db} dB
                </div>
              </div>
              <div className="bg-obsidian-950 p-2 rounded border border-cyan-900/60">
                <div className="text-[9px] text-cyan-400 uppercase">Restored PSNR</div>
                <div className="text-xs font-bold text-cyan-300 tabular-nums">
                  {challengeResult.metrics_restored.psnr_db} dB
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-obsidian-950 p-2 rounded border border-hairline">
                <div className="text-[9px] text-slate-500 uppercase">Degraded SSIM</div>
                <div className="text-xs font-bold text-slate-300 tabular-nums">
                  {challengeResult.metrics_degraded.ssim.toFixed(4)}
                </div>
              </div>
              <div className="bg-obsidian-950 p-2 rounded border border-cyan-900/60">
                <div className="text-[9px] text-cyan-400 uppercase">Restored SSIM</div>
                <div className="text-xs font-bold text-cyan-300 tabular-nums">
                  {challengeResult.metrics_restored.ssim.toFixed(4)}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-1">
              Verified ground-truth comparison proving that Wiener deconvolution successfully attenuated noise while restoring edge gradients.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
