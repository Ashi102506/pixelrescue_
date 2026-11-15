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
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center 4-Panel Synchronized SPECTRA Viewport */}
      <div className="flex-1 p-4 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-violet-400 font-bold tracking-wider">SPECTRA WORKSPACE</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">4 Synchronized Domains</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewLayout(viewLayout === 'four_panel' ? 'recon_focus' : 'four_panel')}
              className="px-2.5 py-1 bg-charcoal-850 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors flex items-center space-x-1"
            >
              <Maximize2 size={12} />
              <span>{viewLayout === 'four_panel' ? 'Focus Output' : 'Show 4 Panels'}</span>
            </button>
          </div>
        </div>

        {/* 4 Synchronized Panels */}
        {spectraData && viewLayout === 'four_panel' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {/* Panel 1: Original Spatial */}
            <div className="bg-charcoal-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-between shadow-lg">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-400 uppercase tracking-wider font-semibold">Panel 1: Spatial Domain</span>
                <span className="text-cyan-400 font-mono">f(x,y)</span>
              </div>
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded border border-slate-800/80 bg-black/40">
                <img
                  src={spectraData.panel_1_original}
                  alt="Original Spatial"
                  className="max-h-[240px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-2">Continuous spatial luminance</span>
            </div>

            {/* Panel 2: Centered Fourier Log Spectrum */}
            <div className="bg-charcoal-950 border border-violet-900/40 rounded-xl p-3 flex flex-col items-center justify-between shadow-glow-violet">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-violet-400 uppercase tracking-wider font-semibold">Panel 2: Centered Spectrum</span>
                <span className="text-violet-300 font-mono">ln(1 + |F(u,v)|)</span>
              </div>
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded border border-violet-900/50 bg-black/40">
                <img
                  src={spectraData.panel_2_spectrum}
                  alt="Fourier Spectrum"
                  className="max-h-[240px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-violet-400/80 font-mono mt-2">DC center (u=0, v=0) & high frequencies</span>
            </div>

            {/* Panel 3: Frequency Transfer Function H(u,v) */}
            <div className="bg-charcoal-950 border border-cyan-900/40 rounded-xl p-3 flex flex-col items-center justify-between shadow-glow-cyan">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-cyan-400 uppercase tracking-wider font-semibold">Panel 3: Filter Mask</span>
                <span className="text-cyan-300 font-mono">H(u,v) Mask</span>
              </div>
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded border border-cyan-900/50 bg-black/40">
                <img
                  src={spectraData.panel_3_filter_colored}
                  alt="Filter Mask"
                  className="max-h-[240px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono mt-2">
                Passband (white/cyan) vs Stopband (dark)
              </span>
            </div>

            {/* Panel 4: Reconstructed Output */}
            <div className="bg-charcoal-950 border border-emerald-900/40 rounded-xl p-3 flex flex-col items-center justify-between shadow-lg">
              <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-emerald-400 uppercase tracking-wider font-semibold">Panel 4: Reconstructed</span>
                <span className="text-emerald-300 font-mono">g(x,y) = IFFT[F·H]</span>
              </div>
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded border border-emerald-900/50 bg-black/40">
                <img
                  src={spectraData.panel_4_reconstructed}
                  alt="Reconstructed Output"
                  className="max-h-[240px] object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono mt-2">Inverse FFT spatial synthesis</span>
            </div>
          </div>
        )}

        {/* Reconstructed Focus View */}
        {spectraData && viewLayout === 'recon_focus' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-charcoal-950 border border-slate-800 rounded-xl p-6">
            <img
              src={spectraData.panel_4_reconstructed}
              alt="Reconstructed Image"
              className="max-h-[480px] object-contain rounded-lg border border-slate-700 shadow-2xl"
            />
            <div className="mt-3 text-xs font-mono text-cyan-400">
              Output: {filterFamily.toUpperCase()} {passType.toUpperCase()} (Cutoff D0 = {cutoffD0} px)
            </div>
          </div>
        )}

        {/* 1D Radial Profile Plot */}
        {spectraData && spectraData.radial_profile && (
          <div className="mt-4 bg-charcoal-950 border border-slate-800 rounded-xl p-3">
            <span className="text-xs font-mono text-violet-400 font-semibold uppercase block mb-1">
              Radial Filter Transfer Response H(D) vs Distance D
            </span>
            <div className="h-20 w-full flex items-end space-x-1 bg-charcoal-900 p-2 rounded border border-slate-800/80 overflow-hidden">
              {spectraData.radial_profile.transfer_h.map((hVal, idx) => (
                <div
                  key={idx}
                  style={{ height: `${Math.max(4, hVal * 100)}%` }}
                  className="flex-1 bg-gradient-to-t from-violet-700 to-cyan-400 rounded-t-sm"
                  title={`D=${spectraData.radial_profile.distances[idx]}px: H=${hVal}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>D=0 (DC Center)</span>
              <span>D0 = {cutoffD0} px (Cutoff)</span>
              <span>D_max (Nyquist)</span>
            </div>
          </div>
        )}
      </div>

      {/* Right Inspector & Controls */}
      <div className="w-full lg:w-96 bg-charcoal-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6 select-none shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-violet-400 font-semibold tracking-wider uppercase">
              Flagship Module 4
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">SPECTRA FFT Lab</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-violet-400" />
          </button>
        </div>

        {/* Filter Family Selection */}
        <div className="space-y-3">
          <span className="text-xs font-mono text-violet-400 font-semibold uppercase block">
            Filter Transfer Family
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { id: 'butterworth', label: 'Butterworth' },
              { id: 'gaussian', label: 'Gaussian' },
              { id: 'ideal', label: 'Ideal' },
              { id: 'notch', label: 'Notch Reject' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterFamily(f.id);
                  handleRunFFTFilter(f.id);
                }}
                className={`py-2 px-2.5 rounded font-semibold text-center border transition-all ${
                  filterFamily === f.id
                    ? 'bg-violet-600/20 text-violet-300 border-violet-500/60 shadow-glow-violet'
                    : 'bg-charcoal-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pass Type (Low-Pass vs High-Pass) */}
        {filterFamily !== 'notch' && (
          <div className="space-y-2">
            <span className="text-xs text-slate-300 font-medium block">Filter Pass Type:</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => {
                  setPassType('lowpass');
                  handleRunFFTFilter(filterFamily, 'lowpass');
                }}
                className={`py-1.5 rounded border ${
                  passType === 'lowpass'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-charcoal-950 text-slate-400 border-slate-800'
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
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-charcoal-950 text-slate-400 border-slate-800'
                }`}
              >
                High-Pass (HPF)
              </button>
            </div>
          </div>
        )}

        {/* Filter Parameters */}
        <div className="bg-charcoal-950 p-4 rounded-xl border border-slate-800 space-y-4">
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
              description="Higher order sharpens cutoff; n >= 3 introduces ringing"
              onChange={(val) => {
                setOrderN(val);
                handleRunFFTFilter(filterFamily, passType, cutoffD0, val);
              }}
            />
          )}

          {filterFamily === 'notch' && (
            <div className="space-y-3">
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
          <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
              Transfer Function Formula
            </span>
            <div className="py-1 text-center text-xs overflow-x-auto">
              <MathFormula formula={spectraData.formula} />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              {spectraData.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
