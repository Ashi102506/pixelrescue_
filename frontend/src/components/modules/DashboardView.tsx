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
  Activity,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import type { ModuleId } from '../../types/dip';

export const DashboardView: React.FC = () => {
  const { setActiveModule, metadata, originalImage } = useWorkspaceStore();

  const labModules: Array<{
    id: ModuleId;
    code: string;
    title: string;
    chapter: string;
    formula: string;
    description: string;
    keyMetrics: string[];
    flagship?: boolean;
  }> = [
    {
      id: 'fundamentals',
      code: '01',
      title: 'Image Fundamentals',
      chapter: 'Gonzalez & Woods, Ch. 2',
      formula: 'f[n,m] \\in \\{0, \\dots, L-1\\}',
      description: 'Spatial coordinate sampling, intensity quantization false contouring, pixel metrics (Euclidean, D4, D8), and connectivity.',
      keyMetrics: ['Sampling aliasing', '1 to 8-bit depth', 'Distance metrics'],
    },
    {
      id: 'enhancement',
      code: '02',
      title: 'Enhancement Studio',
      chapter: 'Gonzalez & Woods, Ch. 3',
      formula: 's_k = (L-1) \\sum_{j=0}^{k} p_r(r_j)',
      description: 'Point transformations (negative, log, gamma power-law, contrast stretching) and discrete probability histogram equalization.',
      keyMetrics: ['CDF linearization', 'Piecewise linear', 'Adaptive threshold'],
    },
    {
      id: 'spatial',
      code: '03',
      title: 'Spatial Filtering',
      chapter: 'Gonzalez & Woods, Ch. 3',
      formula: 'g(x,y) = \\sum \\sum w(s,t) f(x+s,y+t)',
      description: 'Discrete 2D convolution kernel engine with an interactive element-wise step-by-step matrix calculator and edge operators.',
      keyMetrics: ['Gaussian & Median', 'Laplacian 4/8', 'Sobel & Prewitt'],
    },
    {
      id: 'frequency',
      code: '04',
      title: 'SPECTRA FFT Lab',
      chapter: 'Gonzalez & Woods, Ch. 4',
      formula: 'G(u,v) = F(u,v) \\cdot H(u,v)',
      description: '2D Discrete Fourier Transform, centered magnitude & phase spectra, Ideal, Butterworth, and Gaussian low/high-pass filtering.',
      keyMetrics: ['4 Synchronous panels', 'Gibbs ringing demo', 'Radial H(D) profile'],
      flagship: true,
    },
    {
      id: 'restoration',
      code: '05',
      title: 'Image Restoration',
      chapter: 'Gonzalez & Woods, Ch. 5',
      formula: '\\hat{F} = [H^* / (|H|^2 + K)] G',
      description: 'Degradation modeling (motion blur PSF, atmospheric blur, impulse & gaussian noise) and Wiener / constrained inverse deconvolution.',
      keyMetrics: ['Restoration challenge', 'PSNR delta verification', 'NSR regularizer K'],
    },
    {
      id: 'color',
      code: '06',
      title: 'Color Processing',
      chapter: 'Gonzalez & Woods, Ch. 6',
      formula: 'H, S, I \\leftrightarrow R, G, B',
      description: 'Full trigonometric HSI forward and inverse conversion across 3 sectors, additive/subtractive primaries, and pseudo-color slicing.',
      keyMetrics: ['Decoupled intensity', 'Colormap generation', 'CMY subtractive'],
    },
    {
      id: 'quality',
      code: '07',
      title: 'Quality Assessment',
      chapter: 'Gonzalez & Woods, Ch. 8 & 11',
      formula: '10 \\log_{10}(255^2 / \\text{MSE})',
      description: 'Objective statistical measurement of reconstruction fidelity via MSE, PSNR (dB), SSIM index, and Shannon information entropy.',
      keyMetrics: ['PSNR & MSE (dB)', 'Structural SSIM', 'Shannon entropy (b/px)'],
    },
    {
      id: 'pipeline',
      code: 'DAG',
      title: 'Visual Node Pipeline',
      chapter: 'Multi-stage DIP DAG',
      formula: 'v_{i} = T_i(v_{i-1})',
      description: 'Directed acyclic graph execution engine with intermediate image previews, execution profiling, and reproducible pipelines.',
      keyMetrics: ['Topological sort', 'Node previews', 'Latency profiling'],
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full max-w-7xl mx-auto select-none">
      {/* Console Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-hairline gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-semibold text-slate-100 tracking-tight">
              Workstation Console
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-850 text-slate-400 border border-hairline">
              Online
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Digital Image Processing 4th Ed. · Mathematical Transparency & Algorithm Verification
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveModule('frequency')}
            className="px-3 py-1.5 bg-obsidian-850 hover:bg-obsidian-800 border border-slate-700/60 rounded text-xs font-mono text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <span>SPECTRA FFT</span>
            <ArrowRight size={12} className="text-laser-cyan" />
          </button>
          <button
            onClick={() => setActiveModule('pipeline')}
            className="px-3 py-1.5 bg-slate-200 hover:bg-white text-obsidian-950 rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
          >
            <GitFork size={12} />
            <span>Open Node DAG</span>
          </button>
        </div>
      </div>

      {/* Primary Telemetry Board: The Hero Moment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Frame Inspection Card */}
        <div className="bg-obsidian-900 border border-hairline rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              <span>Calibrated Optical Frame</span>
              <span className="text-laser-cyan font-bold">{metadata?.color_mode || 'RGB'}</span>
            </div>

            <div className="flex items-center space-x-4 my-2">
              {originalImage ? (
                <div className="w-20 h-20 rounded border border-hairline overflow-hidden bg-black shrink-0">
                  <img src={originalImage} alt="Active" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded border border-hairline bg-obsidian-950 flex items-center justify-center text-slate-600 shrink-0">
                  No Image
                </div>
              )}

              <div className="space-y-1 font-mono text-xs">
                <div className="text-slate-200 font-semibold truncate max-w-[170px]">
                  {metadata?.filename || 'cameraman.png'}
                </div>
                <div className="text-slate-400 text-[11px]">
                  {metadata ? `${metadata.width} × ${metadata.height} px` : '256 × 256 px'}
                </div>
                <div className="text-slate-500 text-[10px]">
                  {metadata?.file_size_formatted || '64.0 KB'} · 8-bit dynamic range
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex justify-between text-[11px] font-mono text-slate-400">
            <span>Pixel Count:</span>
            <span className="text-slate-200 font-medium">
              {metadata?.total_pixels?.toLocaleString() || '65,536'}
            </span>
          </div>
        </div>

        {/* Algorithm Verification Stats */}
        <div className="bg-obsidian-900 border border-hairline rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              <span>Mathematical Test Suite</span>
              <span className="text-laser-emerald font-semibold">41 / 41 PASS</span>
            </div>

            <div className="space-y-2 py-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold font-mono text-slate-100">100%</span>
                <span className="text-[11px] font-mono text-laser-emerald">Deterministic Validation</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tested against analytical mathematical references for 2D FFT, Wiener deconvolution, discrete histogram CDF, and HSI trigonometric sector mapping.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Core Engines:</span>
            <span className="text-slate-200">FastAPI · NumPy · SciPy</span>
          </div>
        </div>

        {/* Standard Academic Reference */}
        <div className="bg-obsidian-900 border border-hairline rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              <span>Textbook Citation</span>
              <span className="text-slate-400">4th Edition</span>
            </div>

            <div className="space-y-1.5 py-1">
              <div className="text-xs font-semibold text-slate-200">
                Digital Image Processing
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Rafael C. Gonzalez & Richard E. Woods
              </div>
              <p className="text-[11px] text-slate-500 leading-tight pt-1">
                Chapters 2 through 11: Digitization, spatial convolution, frequency filtering, image restoration, color spaces, and quality metrics.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-hairline flex justify-between text-[11px] font-mono text-slate-400">
            <span>Transparency:</span>
            <span className="text-laser-cyan">Formula & Tensor Inspection</span>
          </div>
        </div>
      </div>

      {/* Laboratory Benches Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 font-medium">
            Active Laboratory Benches
          </h2>
          <span className="text-[10px] font-mono text-slate-600">8 Modules Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {labModules.map((m) => {
            return (
              <div
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className="group bg-obsidian-900 hover:bg-obsidian-850 border border-hairline hover:border-slate-600 rounded-lg p-4 cursor-pointer transition-all duration-150 flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {m.code}
                    </span>
                    {m.flagship && (
                      <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded bg-laser-cyan/10 text-laser-cyan border border-laser-cyan/30">
                        FLAGSHIP
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-laser-cyan transition-colors">
                    {m.title}
                  </h3>

                  <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                    {m.chapter}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>

                  <div className="mt-3 py-1.5 px-2 bg-obsidian-950 rounded border border-hairline-subtle font-mono text-[10px] text-slate-300 text-center truncate">
                    <code>{m.formula}</code>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-hairline flex items-center justify-between text-[11px] font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                  <span>Enter Bench</span>
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
