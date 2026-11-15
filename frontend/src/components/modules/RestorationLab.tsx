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

      // Trigger confetti celebration if PSNR improved noticeably!
      if (res.psnr_improvement_db > 1.5) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#8a2be2', '#10b981'],
        });
      }
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
            <span className="text-[10px] font-mono text-amber-400 font-semibold tracking-wider uppercase">
              Module 5
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Image Restoration</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-amber-400" />
          </button>
        </div>

        {/* Degradation Controls */}
        <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-mono text-amber-400 font-semibold uppercase block">
            1. Degradation Model g = h * f + η
          </span>

          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
            {['motion', 'gaussian', 'none'].map((b) => (
              <button
                key={b}
                onClick={() => setBlurType(b)}
                className={`py-1.5 rounded border capitalize ${
                  blurType === b
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                    : 'bg-charcoal-900 text-slate-400 border-slate-800'
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
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-300 font-medium block mb-2">Additive Noise Model:</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              {['gaussian', 'salt_and_pepper', 'none'].map((n) => (
                <button
                  key={n}
                  onClick={() => setNoiseType(n)}
                  className={`py-1.5 rounded border capitalize ${
                    noiseType === n
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                      : 'bg-charcoal-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {n === 'salt_and_pepper' ? 'Impulse' : n}
                </button>
              ))}
            </div>

            {noiseType !== 'none' && (
              <div className="pt-2">
                <ParameterSlider
                  label="Noise Variance / Probability"
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
        <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-mono text-cyan-400 font-semibold uppercase block">
            2. Restoration Algorithm
          </span>

          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {[
              { id: 'wiener', label: 'Wiener (MMSE)' },
              { id: 'inverse', label: 'Inverse Filter' },
              { id: 'median', label: 'Median Filter' },
              { id: 'arithmetic_mean', label: 'Mean Filter' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setRestMethod(m.id)}
                className={`py-2 px-1 rounded text-center border transition-colors ${
                  restMethod === m.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                    : 'bg-charcoal-900 text-slate-400 border-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {restMethod === 'wiener' && (
            <ParameterSlider
              label="Wiener Noise-to-Signal (K)"
              value={wienerK}
              min={0.0001}
              max={0.1}
              step={0.002}
              description="Higher K suppresses noise but softens edges"
              onChange={setWienerK}
            />
          )}

          {restMethod === 'inverse' && (
            <ParameterSlider
              label="Direct Inverse Cutoff Radius (D0)"
              value={inverseCutoff}
              min={10}
              max={100}
              step={5}
              unit="px"
              description="Thresholds high frequencies to prevent noise explosion"
              onChange={setInverseCutoff}
            />
          )}

          {/* Action Trigger */}
          <button
            onClick={handleRunChallenge}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-charcoal-950 font-bold rounded-lg text-xs flex items-center justify-center space-x-2 shadow-glow-cyan transition-all mt-2"
          >
            <Wand2 size={15} />
            <span>Execute Restoration Challenge</span>
          </button>
        </div>

        {/* Objective Restoration Challenge Metrics Card */}
        {challengeResult && (
          <div className="bg-charcoal-950 p-4 rounded-xl border border-cyan-500/40 shadow-glow-cyan space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Award size={14} className="text-amber-400" />
                <span>Restoration Scorecard</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-bold ${
                  challengeResult.psnr_improvement_db > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-700/50'
                }`}
              >
                {challengeResult.psnr_improvement_db > 0 ? '+' : ''}
                {challengeResult.psnr_improvement_db} dB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-charcoal-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Degraded PSNR</div>
                <div className="text-sm font-bold text-slate-300">
                  {challengeResult.metrics_degraded.psnr_db} dB
                </div>
              </div>
              <div className="bg-charcoal-900 p-2 rounded border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400">Restored PSNR</div>
                <div className="text-sm font-bold text-cyan-300">
                  {challengeResult.metrics_restored.psnr_db} dB
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-charcoal-900 p-2 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400">Degraded SSIM</div>
                <div className="text-sm font-bold text-slate-300">
                  {challengeResult.metrics_degraded.ssim.toFixed(3)}
                </div>
              </div>
              <div className="bg-charcoal-900 p-2 rounded border border-cyan-500/30">
                <div className="text-[10px] text-cyan-400">Restored SSIM</div>
                <div className="text-sm font-bold text-cyan-300">
                  {challengeResult.metrics_restored.ssim.toFixed(3)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-sans leading-tight pt-1">
              Verified ground-truth comparison proving that mathematical deconvolution successfully recovered high-frequency structural energy.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
