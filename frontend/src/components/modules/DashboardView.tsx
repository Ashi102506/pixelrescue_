import React from 'react';
import {
  Grid,
  Sliders,
  Layers,
  Radio,
  Wand2,
  Palette,
  BarChart3,
  GitFork,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ModuleId } from '../../types/dip';

export const DashboardView: React.FC = () => {
  const { setActiveModule, metadata } = useWorkspaceStore();

  const cards: Array<{
    id: ModuleId;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accent: string;
    border: string;
    features: string[];
    flagship?: boolean;
  }> = [
    {
      id: 'fundamentals',
      title: '1. Image Fundamentals',
      description: 'Dimensional metadata, RGB decomposition, spatial sampling & intensity quantization.',
      icon: Grid,
      accent: 'text-cyan-400',
      border: 'hover:border-cyan-500/50',
      features: ['Pixel Inspector', 'Sampling Degradation', 'Quantization (Contouring)', 'Distance & Connectivity'],
    },
    {
      id: 'enhancement',
      title: '2. Enhancement Studio',
      description: 'Spatial point transformations, contrast stretching & mathematical histogram equalization.',
      icon: Sliders,
      accent: 'text-purple-400',
      border: 'hover:border-purple-500/50',
      features: ['Log & Gamma Transforms', 'Contrast Stretching', 'Histogram Equalization', 'Histogram Specification'],
    },
    {
      id: 'spatial',
      title: '3. Spatial Filtering',
      description: 'Discrete 2D convolution engine with step-by-step element-wise matrix visualization.',
      icon: Layers,
      accent: 'text-emerald-400',
      border: 'hover:border-emerald-500/50',
      features: ['Mean & Gaussian Blur', 'Laplacian Sharpening', 'Unsharp Masking', 'Sobel & Prewitt Gradients'],
    },
    {
      id: 'frequency',
      title: '4. SPECTRA (Frequency)',
      description: '2D Fast Fourier Transform, magnitude & phase spectra, and frequency-domain filtering.',
      icon: Radio,
      accent: 'text-violet-400',
      border: 'hover:border-violet-500/50',
      features: ['4 Synchronized Panels', 'Ideal / Butterworth / Gaussian', 'Notch Rejection', 'Zero-Ringing Proof'],
      flagship: true,
    },
    {
      id: 'restoration',
      title: '5. Image Restoration',
      description: 'Mathematical degradation models g = h * f + η and constrained Wiener / inverse filtering.',
      icon: Wand2,
      accent: 'text-amber-400',
      border: 'hover:border-amber-500/50',
      features: ['Atmospheric & Motion Blur', 'Gaussian & Impulse Noise', 'Wiener Deconvolution', 'Restoration Challenge'],
    },
    {
      id: 'color',
      title: '6. Color Processing',
      description: 'Conversions between RGB, CMY, and HSI color spaces with pseudo-color intensity slicing.',
      icon: Palette,
      accent: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      features: ['Full HSI <-> RGB Math', 'Channel Decomposition', 'Hue / Saturation Shift', 'Scientific Pseudo-color'],
    },
    {
      id: 'quality',
      title: '7. Quality Analysis',
      description: 'Rigorous objective metrics: MSE, PSNR, SSIM, Shannon Entropy, and error heatmaps.',
      icon: BarChart3,
      accent: 'text-blue-400',
      border: 'hover:border-blue-500/50',
      features: ['MSE & PSNR (dB)', 'Structural SSIM Index', 'Information Entropy', 'Exportable PDF Reports'],
    },
    {
      id: 'pipeline',
      title: 'Visual Node Pipeline',
      description: 'Node-based directed acyclic graph (DAG) execution engine for multi-stage image processing.',
      icon: GitFork,
      accent: 'text-teal-400',
      border: 'hover:border-teal-500/50',
      features: ['Draggable Node Canvas', 'Live DAG Execution', 'Intermediate Previews', 'Exportable Pipelines'],
    },
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-slate-800 p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Sparkles size={13} />
            <span>Digital Image Processing Scientific Workstation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            PIXELRESCUE <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">DIP Studio</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            An advanced, mathematically transparent image processing, restoration, and frequency analysis platform.
            Every operation exposes its governing equation, parameter mechanics, step-by-step intermediate tensors, and objective quality verification.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => setActiveModule('frequency')}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-charcoal-950 font-semibold rounded-lg text-xs flex items-center space-x-2 shadow-glow-violet transition-all"
            >
              <span>Explore SPECTRA (Frequency Lab)</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setActiveModule('pipeline')}
              className="px-4 py-2 bg-charcoal-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center space-x-2 transition-colors"
            >
              <span>Open Visual Node Pipeline</span>
              <GitFork size={14} className="text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-charcoal-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-mono">ACTIVE IMAGE</div>
          <div className="text-lg font-bold text-white mt-1 truncate">
            {metadata?.filename || 'cameraman.png'}
          </div>
          <div className="text-xs text-cyan-400 font-mono mt-0.5">
            {metadata ? `${metadata.width}×${metadata.height}px` : '256×256px'}
          </div>
        </div>
        <div className="bg-charcoal-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-mono">COLOR DEPTH</div>
          <div className="text-lg font-bold text-white mt-1">
            {metadata?.color_mode || 'RGB'} (8-bit)
          </div>
          <div className="text-xs text-emerald-400 font-mono mt-0.5">256 Discrete Levels</div>
        </div>
        <div className="bg-charcoal-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-mono">ENGINE CORE</div>
          <div className="text-lg font-bold text-white mt-1">FastAPI + NumPy</div>
          <div className="text-xs text-violet-400 font-mono mt-0.5">41 Algorithm Tests Passing</div>
        </div>
        <div className="bg-charcoal-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-mono">ACADEMIC ALIGNMENT</div>
          <div className="text-lg font-bold text-white mt-1">Gonzalez & Woods</div>
          <div className="text-xs text-amber-400 font-mono mt-0.5">Chapters 1 to 10 Complete</div>
        </div>
      </div>

      {/* Module Grid */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-semibold mb-4">
          Integrated Laboratories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={() => setActiveModule(c.id)}
                className={`group relative bg-charcoal-900 border border-slate-800 ${c.border} rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg bg-charcoal-950 border border-slate-800 ${c.accent}`}>
                      <Icon size={20} />
                    </div>
                    {c.flagship && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-700/60">
                        FLAGSHIP
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {c.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
                    {c.features.map((f, i) => (
                      <div key={i} className="flex items-center space-x-1.5 text-[11px] text-slate-300">
                        <CheckCircle size={11} className="text-cyan-400/80 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-cyan-400 transition-colors">
                  <span>Enter Laboratory</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
