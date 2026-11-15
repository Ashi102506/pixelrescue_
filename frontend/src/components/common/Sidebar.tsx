import React from 'react';
import {
  Layers,
  Sliders,
  Grid,
  Radio,
  Wand2,
  Palette,
  BarChart3,
  GitFork,
  History,
  LayoutDashboard,
  Cpu,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ModuleId } from '../../types/dip';

interface NavItem {
  id: ModuleId;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  flagship?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Overview',
    sublabel: 'System telemetry & quick tour',
    icon: LayoutDashboard,
  },
  {
    id: 'fundamentals',
    label: '1. Fundamentals',
    sublabel: 'Pixels, sampling & quantization',
    icon: Grid,
  },
  {
    id: 'enhancement',
    label: '2. Enhancement',
    sublabel: 'Intensity transforms & histograms',
    icon: Sliders,
  },
  {
    id: 'spatial',
    label: '3. Spatial Filtering',
    sublabel: '2D Convolution & edge detection',
    icon: Layers,
  },
  {
    id: 'frequency',
    label: '4. SPECTRA FFT',
    sublabel: 'Fourier transform & frequency filters',
    icon: Radio,
    badge: 'FLAGSHIP',
    flagship: true,
  },
  {
    id: 'restoration',
    label: '5. Restoration',
    sublabel: 'Degradation models & Wiener filter',
    icon: Wand2,
  },
  {
    id: 'color',
    label: '6. Color Lab',
    sublabel: 'RGB, CMY, HSI & pseudocolor',
    icon: Palette,
  },
  {
    id: 'quality',
    label: '7. Quality Analysis',
    sublabel: 'MSE, PSNR, SSIM & reports',
    icon: BarChart3,
  },
  {
    id: 'pipeline',
    label: 'Visual Pipeline',
    sublabel: 'Node-based DAG workflow',
    icon: GitFork,
    badge: 'NODE',
  },
  {
    id: 'history',
    label: 'Experiments',
    sublabel: 'Persistent trial comparison',
    icon: History,
  },
];

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule } = useWorkspaceStore();

  return (
    <aside className="w-64 bg-charcoal-900 border-r border-slate-800 flex flex-col h-full select-none z-20">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center space-x-3 border-b border-slate-800 bg-charcoal-950/40">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-charcoal-950 shadow-glow-cyan">
          <Cpu size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-sm tracking-wider text-white">PIXELRESCUE</span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 rounded">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight">Scientific DIP Workstation</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 mb-2 font-semibold">
          Laboratories & Workspaces
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600/20 to-cyan-500/10 border border-cyan-500/40 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div
                className={`p-1.5 rounded-md ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}
              >
                <Icon size={17} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        item.flagship
                          ? 'bg-violet-950 text-violet-300 border border-violet-700/50'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{item.sublabel}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Academic Textbook Credit Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-charcoal-950/60 text-[10px] text-slate-400 font-mono">
        <p className="font-semibold text-slate-300 mb-0.5">Gonzalez & Woods DIP</p>
        <p className="text-slate-400 leading-tight">Digital Image Processing 4th Ed. Formal Algorithm Engine</p>
      </div>
    </aside>
  );
};
