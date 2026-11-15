import React, { useState, useEffect } from 'react';
import {
  Radio,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ParameterSlider } from '../common/ParameterSlider';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { FrequencySpectraResponse } from '../../types/dip';

export const FrequencyLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing, openMathModal } = useWorkspaceStore();

  const [filterFamily, setFilterFamily] = useState<string>('butterworth');
  const [passType, setPassType] = useState<string>('lowpass');
  const [cutoffD0, setCutoffD0] = useState<number>(35);
  const [orderN, setOrderN] = useState<number>(2);
  const [notchU0, setNotchU0] = useState<number>(40);
  const [notchV0, setNotchV0] = useState<number>(40);
  const [notchD0, setNotchD0] = useState<number>(10);

  const [spectraData, setSpectraData] = useState<FrequencySpectraResponse | null>(null);
  const [viewLayout, setViewLayout] = useState<'four_panel' | 'recon_focus'>('four_panel');

  const handleRunFFTFilter = async (
    fam = filterFamily,
    pType = passType,
    c = cutoffD0,
    n = orderN,
    nu = notchU0,
    nv = notchV0,
    nd = notchD0
  ) => {
    if (!originalImage) return;
    setProcessing(true, `Computing 2D FFT ${fam.toUpperCase()} ${pType.toUpperCase()}...`);
    try {
      const res = await api.applyFrequencyFilter({
        image: originalImage,
        filter_family: fam,
        pass_type: pType,
        cutoff: c,
        order: n,
        notch_u0: nu,
        notch_v0: nv,
        notch_d0: nd,
      });
      setSpectraData(res);
      setProcessedImage(res.panel_4_reconstructed, `2D FFT ${fam.toUpperCase()} ${pType.toUpperCase()} (D0=${c})`);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (originalImage) {
      handleRunFFTFilter();
    }
  }, [originalImage]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-obsidian-950">
      {/* Center 4-Panel Synchronized SPECTRA Viewport */}
      <div className="flex-1 p-3 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
              SPECTRA 2D FFT
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px]">4 Synchronized Spectral Panels</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewLayout(viewLayout === 'four_panel' ? 'recon_focus' : 'four_panel')}
              className="px-2 py-1 bg-surface-raised hover:bg-surface-overlay border border-hairline rounded text-slate-300 text-[11px] transition-colors flex items-center space-x-1"
            >
              <Maximize2 size={11} />
              <span>{viewLayout === 'four_panel' ? 'Focus Reconstruction' : 'View 4 Panels'}</span>
            </button>
          </div>
        </div>

        {/* 4 Synchronized Panels */}
        {spectraData && viewLayout === 'four_panel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
            {/* Panel 1: Original Spatial */}
            <div className="bg-surface-raised border border-hairline rounded-lg p-3 flex flex-col items-center justify-between shadow-sm">
              <div className="w-full flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  P1 · Spatial Domain
                </span>
                <span className="text-slate-400 font-mono">f(x,y)</span>
              </div>
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded border border-hairline bg-obsidian-950 p-1">
                <img
                  src={spectraData.panel_1_original}
                  alt="Original Spatial"
                  className="max-h-[220px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5">Continuous irradiance luminance</span>
            </div>

            {/* Panel 2: Centered Fourier Log Spectrum */}
            <div className="bg-surface-raised border border-hairline rounded-lg p-3 flex flex-col items-center justify-between shadow-sm">
              <div className="w-full flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="text-cyan-400 uppercase tracking-wider font-semibold text-[10px]">
                  P2 · Centered Spectrum
                </span>
                <span className="text-cyan-400 font-mono">ln(1 + |F(u,v)|)</span>
              </div>
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded border border-hairline bg-obsidian-950 p-1">
                <img
                  src={spectraData.panel_2_spectrum}
                  alt="Fourier Spectrum"
                  className="max-h-[220px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5">DC origin at center [M/2, N/2]</span>
            </div>

            {/* Panel 3: Frequency Transfer Function H(u,v) */}
            <div className="bg-surface-raised border border-hairline rounded-lg p-3 flex flex-col items-center justify-between shadow-sm">
              <div className="w-full flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="text-purple-400 uppercase tracking-wider font-semibold text-[10px]">
                  P3 · Filter Transfer Mask
                </span>
                <span className="text-purple-400 font-mono">H(u,v)</span>
              </div>
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded border border-hairline bg-obsidian-950 p-1">
                <img
                  src={spectraData.panel_3_filter_colored}
                  alt="Filter Mask"
                  className="max-h-[220px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5">Passband (Bright) vs Stopband (Dark)</span>
            </div>

            {/* Panel 4: Reconstructed Output */}
            <div className="bg-surface-raised border border-hairline rounded-lg p-3 flex flex-col items-center justify-between shadow-sm">
              <div className="w-full flex items-center justify-between text-[11px] font-mono mb-2">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold text-[10px]">
                  P4 · Reconstructed Image
                </span>
                <span className="text-emerald-400 font-mono">g(x,y) = IFFT[F·H]</span>
              </div>
              <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded border border-hairline bg-obsidian-950 p-1">
                <img
                  src={spectraData.panel_4_reconstructed}
                  alt="Reconstructed Output"
                  className="max-h-[220px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1.5">Synthesized via 2D Inverse FFT</span>
            </div>
          </div>
        )}

        {/* Reconstructed Focus View */}
        {spectraData && viewLayout === 'recon_focus' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-surface-raised border border-hairline rounded-lg p-4">
            <img
              src={spectraData.panel_4_reconstructed}
              alt="Reconstructed Image"
              className="max-h-[440px] object-contain rounded border border-hairline shadow-md"
            />
            <div className="mt-3 text-[11px] font-mono text-cyan-400">
              Output: {filterFamily.toUpperCase()} {passType.toUpperCase()} (Cutoff D0 = {cutoffD0} px)
            </div>
          </div>
        )}

        {/* 1D Radial Profile Plot */}
        {spectraData && spectraData.radial_profile && (
          <div className="mt-3 bg-surface-raised border border-hairline rounded-lg p-3">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                1D Radial Frequency Transfer Response H(D)
              </span>
              <span className="text-cyan-400">Cutoff D0: {cutoffD0} px</span>
            </div>
            <div className="h-16 w-full flex items-end space-x-0.5 bg-obsidian-950 p-1.5 rounded border border-hairline overflow-hidden">
              {spectraData.radial_profile.transfer_h.map((hVal, idx) => (
                <div
                  key={idx}
                  style={{ height: `${Math.max(2, hVal * 100)}%` }}
                  className="flex-1 bg-slate-400 hover:bg-cyan-400 transition-colors"
                  title={`Distance D=${spectraData.radial_profile.distances[idx]}px: Gain H=${hVal.toFixed(3)}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>D=0 (DC Origin)</span>
              <span>D0 = {cutoffD0} px (Transition Point)</span>
              <span>D_max (Nyquist Margin)</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Inspector & Controls */}
      <div className="w-full lg:w-96 bg-obsidian-900 border-l border-hairline p-4 overflow-y-auto space-y-4 select-none shrink-0 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
              04
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                SPECTRA Frequency Lab
              </h2>
              <p className="text-[10px] font-mono text-slate-500">2D FFT & Fourier Transfer Masks</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: '2D Discrete Fourier Transform & Frequency Domain Filtering',
                category: 'Fourier Theory',
                formula: String.raw`G(u,v) = F(u,v) \cdot H(u,v) \iff g(x,y) = \mathcal{F}^{-1}\{ G(u,v) \}`,
                variables: [
                  { symbol: 'f(x,y)', meaning: 'Spatial domain continuous/discrete pixel intensity' },
                  { symbol: 'F(u,v)', meaning: '2D Fast Fourier Transform complex spectrum' },
                  { symbol: 'H(u,v)', meaning: 'Frequency transfer function filter mask' },
                  { symbol: 'D(u,v)', meaning: 'Distance from origin: sqrt((u - M/2)^2 + (v - N/2)^2)' },
                  { symbol: 'D_0', meaning: 'Cutoff frequency radius' },
                  { symbol: 'n', meaning: 'Butterworth filter order' },
                ],
                explanation:
                  'The 2D Fourier Transform transforms spatial details into frequency harmonics. The center (u=0, v=0) represents the DC component (average image brightness). Low frequencies describe smooth surfaces, while high frequencies describe sharp edges, fine textures, and noise. Ideal filters cause Gibbs phenomenon ringing in the spatial domain due to sinc oscillations; Butterworth filters provide a smooth transition with controllable ringing (n); Gaussian filters completely eliminate ringing.',
                complexity: 'O(M * N * log(M * N)) via Fast Fourier Transform (FFT)',
                reference: 'Gonzalez & Woods, Digital Image Processing, Chapter 4',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-cyan-400" />
          </button>
        </div>

        {/* Filter Family Selection */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
            Filter Transfer Family
          </span>
          <div className="grid grid-cols-2 gap-1.5 bg-obsidian-950 p-1.5 rounded border border-hairline text-[11px] font-mono">
            {[
              { id: 'butterworth', label: 'Butterworth' },
              { id: 'gaussian', label: 'Gaussian' },
              { id: 'ideal', label: 'Ideal (Sharp)' },
              { id: 'notch', label: 'Notch Reject' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterFamily(f.id);
                  handleRunFFTFilter(f.id);
                }}
                className={`py-1.5 px-2 rounded text-center transition-colors truncate ${
                  filterFamily === f.id
                    ? 'bg-surface-raised text-cyan-300 border border-cyan-800/60 font-semibold shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-raised/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pass Type (Low-Pass vs High-Pass) */}
        {filterFamily !== 'notch' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Passband Mode</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                onClick={() => {
                  setPassType('lowpass');
                  handleRunFFTFilter(filterFamily, 'lowpass');
                }}
                className={`py-1.5 rounded border ${
                  passType === 'lowpass'
                    ? 'bg-obsidian-950 text-cyan-300 border-cyan-800/60 font-semibold'
                    : 'bg-surface-raised text-slate-400 border-hairline'
                }`}
              >
                Low-Pass (LPF)
              </button>
              <button
                onClick={() => {
                  setPassType('highpass');
                  handleRunFFTFilter(filterFamily, 'highpass');
                }}
                className={`py-1.5 rounded border ${
                  passType === 'highpass'
                    ? 'bg-obsidian-950 text-cyan-300 border-cyan-800/60 font-semibold'
                    : 'bg-surface-raised text-slate-400 border-hairline'
                }`}
              >
                High-Pass (HPF)
              </button>
            </div>
          </div>
        )}

        {/* Filter Parameters */}
        <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-3">
          <ParameterSlider
            label="Cutoff Radius (D0)"
            value={cutoffD0}
            min={5}
            max={120}
            step={1}
            unit="px"
            description="Frequency distance radius from spectrum origin"
            onChange={(val) => {
              setCutoffD0(val);
              handleRunFFTFilter(filterFamily, passType, val);
            }}
          />

          {filterFamily === 'butterworth' && (
            <ParameterSlider
              label="Butterworth Order (n)"
              value={orderN}
              min={1}
              max={6}
              step={1}
              description="Higher order steepens attenuation; n ≥ 3 introduces ringing"
              onChange={(val) => {
                setOrderN(val);
                handleRunFFTFilter(filterFamily, passType, cutoffD0, val);
              }}
            />
          )}

          {filterFamily === 'notch' && (
            <div className="space-y-2.5 pt-1 border-t border-hairline">
              <ParameterSlider
                label="Notch Center u0"
                value={notchU0}
                min={5}
                max={100}
                onChange={(v) => {
                  setNotchU0(v);
                  handleRunFFTFilter('notch', passType, cutoffD0, orderN, v, notchV0, notchD0);
                }}
              />
              <ParameterSlider
                label="Notch Center v0"
                value={notchV0}
                min={5}
                max={100}
                onChange={(v) => {
                  setNotchV0(v);
                  handleRunFFTFilter('notch', passType, cutoffD0, orderN, notchU0, v, notchD0);
                }}
              />
              <ParameterSlider
                label="Notch Radius D0"
                value={notchD0}
                min={2}
                max={30}
                onChange={(v) => {
                  setNotchD0(v);
                  handleRunFFTFilter('notch', passType, cutoffD0, orderN, notchU0, notchV0, v);
                }}
              />
            </div>
          )}
        </div>

        {/* Active Mathematical Formula Box */}
        {spectraData && (
          <div className="bg-obsidian-950 p-3 rounded-lg border border-hairline space-y-2 font-mono">
            <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold block">
              Active Transfer Formulation
            </span>
            <div className="py-1 text-center text-xs overflow-x-auto">
              <MathFormula formula={spectraData.formula} />
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              {spectraData.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
