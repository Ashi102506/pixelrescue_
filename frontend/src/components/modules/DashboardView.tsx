import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Layers,
  Radio,
  Wand2,
  Palette,
  BarChart3,
  GitFork,
  History,
  ArrowRight,
  Zap,
  Activity,
  Maximize2,
  RotateCcw,
  CheckCircle2,
  FileCode2,
  BookOpen,
  Cpu,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { api } from '../../services/api';
import { ImageViewer } from '../common/ImageViewer';
import { ModuleId } from '../../types/dip';

export const DashboardView: React.FC = () => {
  const {
    originalImage,
    processedImage,
    metadata,
    activeAlgorithm,
    setActiveModule,
    setProcessedImage,
    setProcessing,
    resetProcessed,
  } = useWorkspaceStore();

  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('original');

  // Quick interactive 1-click filter demo right on the dashboard
  const handleQuickFilter = async (name: string) => {
    if (!originalImage) return;
    setActiveQuickFilter(name);

    if (name === 'original') {
      resetProcessed();
      return;
    }

    setProcessing(true, `Running live ${name}...`);
    try {
      if (name === 'equalize') {
        const res = await api.equalizeHistogram(originalImage);
        setProcessedImage(res.image, 'Histogram Equalization');
      } else if (name === 'sobel') {
        const res = await api.applySpatialFilter({ image: originalImage, filter_type: 'sobel' });
        setProcessedImage(res.image, 'Sobel Edge Detection');
      } else if (name === 'gaussian') {
        const res = await api.applySpatialFilter({ image: originalImage, filter_type: 'gaussian', kernel_size: 7, sigma: 1.5 });
        setProcessedImage(res.image, 'Gaussian Smoothing (7×7)');
      } else if (name === 'negative') {
        const res = await api.applyTransform({ image: originalImage, operation: 'negative' });
        setProcessedImage(res.image, 'Negative Transformation');
      } else if (name === 'gamma') {
        const res = await api.applyTransform({ image: originalImage, operation: 'gamma', gamma: 0.6 });
        setProcessedImage(res.image, 'Gamma Expansion (γ=0.6)');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const labs: Array<{
    id: ModuleId;
    code: string;
    title: string;
    subtitle: string;
    description: string;
    icon: any;
    color: string;
    glow: string;
    accentBorder: string;
    flagship?: boolean;
    chapter: string;
  }> = [
    {
      id: 'fundamentals',
      code: '01',
      title: 'Image Fundamentals',
      subtitle: 'Sampling & Quantization',
      description: 'Spatial grid downsampling, intensity quantization levels, pixel neighborhood distances, and 4/8-connectivity.',
      icon: Layers,
      color: 'text-cyan-400',
      glow: 'from-cyan-500/20 to-transparent',
      accentBorder: 'hover:border-cyan-500/50',
      chapter: 'Gonzalez & Woods, Ch. 2',
    },
    {
      id: 'enhancement',
      code: '02',
      title: 'Enhancement Studio',
      subtitle: 'Point Ops & Histograms',
      description: 'Point transformations (negative, log, gamma power-law, contrast stretch) and discrete PDF/CDF equalization.',
      icon: Sliders,
      color: 'text-purple-400',
      glow: 'from-purple-500/20 to-transparent',
      accentBorder: 'hover:border-purple-500/50',
      chapter: 'Gonzalez & Woods, Ch. 3',
    },
    {
      id: 'spatial',
      code: '03',
      title: 'Spatial Filtering',
      subtitle: '2D Convolution Lab',
      description: 'Real-time spatial convolution: Gaussian, median, Laplacian 4/8, Sobel, Prewitt, and step-by-step elementwise math.',
      icon: Cpu,
      color: 'text-emerald-400',
      glow: 'from-emerald-500/20 to-transparent',
      accentBorder: 'hover:border-emerald-500/50',
      chapter: 'Gonzalez & Woods, Ch. 3',
    },
    {
      id: 'frequency',
      code: '04',
      title: 'SPECTRA FFT Lab',
      subtitle: '2D Fourier Domain Filtering',
      description: '4 synchronized panels: Spatial, Centered Log-Magnitude Spectrum, Transfer Function Mask, and Reconstructed Output.',
      icon: Radio,
      color: 'text-violet-400',
      glow: 'from-violet-500/25 to-transparent',
      accentBorder: 'hover:border-violet-500/60',
      flagship: true,
      chapter: 'Gonzalez & Woods, Ch. 4',
    },
    {
      id: 'restoration',
      code: '05',
      title: 'Image Restoration',
      subtitle: 'Degradation & Deconvolution',
      description: 'PSF motion blur & atmospheric degradation models, Wiener deconvolution (MMSE), and inverse filtering challenge.',
      icon: Wand2,
      color: 'text-amber-400',
      glow: 'from-amber-500/20 to-transparent',
      accentBorder: 'hover:border-amber-500/50',
      chapter: 'Gonzalez & Woods, Ch. 5',
    },
    {
      id: 'color',
      code: '06',
      title: 'Color Processing',
      subtitle: 'RGB · CMY · HSI Space',
      description: 'Exact trigonometric HSI forward and inverse conversion across 3 sectors, decoupled luminance, and pseudocolor slicing.',
      icon: Palette,
      color: 'text-rose-400',
      glow: 'from-rose-500/20 to-transparent',
      accentBorder: 'hover:border-rose-500/50',
      chapter: 'Gonzalez & Woods, Ch. 6',
    },
    {
      id: 'quality',
      code: '07',
      title: 'Quality Assessment',
      subtitle: 'MSE · PSNR · SSIM Metrology',
      description: 'Objective mathematical fidelity assessment: PSNR (dB), SSIM index, Shannon entropy, and error heatmap visualization.',
      icon: BarChart3,
      color: 'text-blue-400',
      glow: 'from-blue-500/20 to-transparent',
      accentBorder: 'hover:border-blue-500/50',
      chapter: 'Gonzalez & Woods, Ch. 8',
    },
    {
      id: 'pipeline',
      code: 'DAG',
      title: 'Visual Node Pipeline',
      subtitle: 'DAG Multi-Stage Execution',
      description: 'Node-based visual DAG editor to construct, chain, and execute multi-stage DIP pipelines with live thumbnails.',
      icon: GitFork,
      color: 'text-teal-400',
      glow: 'from-teal-500/20 to-transparent',
      accentBorder: 'hover:border-teal-500/50',
      chapter: 'Composable Pipeline',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full font-sans">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
              <Zap size={13} className="text-cyan-400" />
              <span>ACADEMIC STANDARD · GONZALEZ & WOODS 4TH EDITION</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              PIXEL<span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">RESCUE</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Advanced Digital Image Processing, Mathematical Restoration & 2D Fourier Spectral Analysis Suite.
              Features complete formula transparency, tensor inspection, and objective quality verification.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveModule('frequency')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Radio size={14} />
                <span>Launch SPECTRA FFT Lab</span>
              </button>

              <button
                onClick={() => setActiveModule('pipeline')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-medium text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <GitFork size={14} />
                <span>Open Visual Node DAG</span>
              </button>
            </div>
          </div>

          {/* Quick Active Metrics Pill */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md min-w-[240px] space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Target Image:</span>
              <span className="text-cyan-400 font-bold">{metadata?.filename || 'cameraman.png'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Dimensions:</span>
              <span className="text-white font-bold">{metadata ? `${metadata.width} × ${metadata.height} px` : '256 × 256 px'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Dynamic Range:</span>
              <span className="text-slate-200">{metadata ? `${metadata.bit_depth}-bit [0..255]` : '8-bit [0..255]'}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Color Primaries:</span>
              <span className="text-purple-300">{metadata?.color_mode || 'RGB'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Studio Bench (Live Image & 1-Click Operations) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2">
              <Eye size={16} className="text-cyan-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Interactive Studio Bench</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live split before/after viewer with real-time mathematical operations applied in the browser.
            </p>
          </div>

          {/* Quick Filters Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'original', label: 'Original' },
              { id: 'equalize', label: 'Equalize' },
              { id: 'gaussian', label: 'Gaussian Blur' },
              { id: 'sobel', label: 'Sobel Edges' },
              { id: 'negative', label: 'Negative' },
              { id: 'gamma', label: 'Gamma (γ=0.6)' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleQuickFilter(btn.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeQuickFilter === btn.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Viewport Box */}
        <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col">
          <ImageViewer />
        </div>
      </div>

      {/* Laboratory Benches Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Digital Image Processing Laboratories</h2>
            <p className="text-xs text-slate-400">8 dedicated scientific environments mapped to classic DIP chapters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {labs.map((lab) => {
            const Icon = lab.icon;
            return (
              <div
                key={lab.id}
                onClick={() => setActiveModule(lab.id)}
                className={`group relative rounded-2xl p-5 border border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 backdrop-blur-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${lab.accentBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-center ${lab.color} group-hover:scale-105 transition-transform`}>
                      <Icon size={20} />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {lab.flagship && (
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/30">
                          FLAGSHIP
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-500">{lab.code}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {lab.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400">{lab.subtitle}</p>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {lab.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400 group-hover:text-cyan-400 font-medium transition-colors">
                  <span className="text-[10px] font-mono text-slate-500">{lab.chapter}</span>
                  <div className="flex items-center space-x-1">
                    <span>Enter Lab</span>
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
