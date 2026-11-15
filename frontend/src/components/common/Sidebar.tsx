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
  History,
  LayoutDashboard,
  Aperture,
  ExternalLink,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import type { ModuleId } from '../../types/dip';

interface NavItem {
  id: ModuleId;
  code: string;
  label: string;
  chapter: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  flagship?: boolean;
}

const NAV_GROUPS: Array<{
  category: string;
  items: NavItem[];
}> = [
  {
    category: 'Console',
    items: [
      {
        id: 'dashboard',
        code: '00',
        label: 'Workstation Overview',
        chapter: 'System Telemetry',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    category: 'Digital Image Processing Laboratories',
    items: [
      {
        id: 'fundamentals',
        code: '01',
        label: 'Image Fundamentals',
        chapter: 'Sampling & Quantization',
        icon: Grid,
      },
      {
        id: 'enhancement',
        code: '02',
        label: 'Enhancement Studio',
        chapter: 'Point Ops & Histograms',
        icon: Sliders,
      },
      {
        id: 'spatial',
        code: '03',
        label: 'Spatial Filtering',
        chapter: '2D Convolution & Edges',
        icon: Layers,
      },
      {
        id: 'frequency',
        code: '04',
        label: 'SPECTRA FFT Lab',
        chapter: 'Fourier Domain Analysis',
        icon: Radio,
        flagship: true,
      },
      {
        id: 'restoration',
        code: '05',
        label: 'Image Restoration',
        chapter: 'Degradation & Deconvolution',
        icon: Wand2,
      },
      {
        id: 'color',
        code: '06',
        label: 'Color Processing',
        chapter: 'RGB · CMY · HSI Spaces',
        icon: Palette,
      },
      {
        id: 'quality',
        code: '07',
        label: 'Quality Assessment',
        chapter: 'MSE · PSNR · SSIM Index',
        icon: BarChart3,
      },
    ],
  },
  {
    category: 'Analysis & Automation',
    items: [
      {
        id: 'pipeline',
        code: 'DAG',
        label: 'Visual Node Pipeline',
        chapter: 'Multi-stage Execution Graph',
        icon: GitFork,
      },
      {
        id: 'history',
        code: 'LOG',
        label: 'Experiment Archive',
        chapter: 'Persistent Verification Data',
        icon: History,
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule } = useWorkspaceStore();

  return (
    <aside className="w-64 bg-obsidian-900 border-r border-hairline flex flex-col h-full select-none z-20 shrink-0">
      {/* Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-hairline bg-obsidian-950/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-obsidian-800 border border-slate-700/60 flex items-center justify-center text-laser-cyan">
            <Aperture size={16} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-xs font-bold tracking-wider text-slate-100 uppercase">
                PIXELRESCUE
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight leading-none mt-0.5">
              DIP Scientific Console
            </p>
          </div>
        </div>

        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-obsidian-800 text-slate-400 border border-slate-700/50">
          v1.0
        </span>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-2 pb-1 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-medium">
              {group.category}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-left transition-all relative ${
                    isActive
                      ? 'bg-obsidian-800 text-white border-l-2 border-laser-cyan shadow-sm pl-2'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-850 border-l-2 border-transparent'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] w-5 shrink-0 ${
                      isActive ? 'text-laser-cyan font-semibold' : 'text-slate-600'
                    }`}
                  >
                    {item.code}
                  </span>

                  <Icon
                    size={15}
                    className={`shrink-0 ${
                      isActive ? 'text-laser-cyan' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate leading-tight">
                        {item.label}
                      </span>
                      {item.flagship && (
                        <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-laser-cyan/10 text-laser-cyan border border-laser-cyan/30">
                          SPECTRA
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono truncate block leading-none mt-1">
                      {item.chapter}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Textbook Calibration Badge */}
      <div className="p-3 border-t border-hairline bg-obsidian-950/80 text-[10px] font-mono text-slate-500 space-y-1">
        <div className="flex justify-between items-center text-slate-400">
          <span>Standard</span>
          <span className="text-slate-300 font-medium">Gonzalez & Woods</span>
        </div>
        <div className="flex justify-between items-center text-[9px] text-slate-600">
          <span>Engine Status</span>
          <span className="text-laser-emerald font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-laser-emerald inline-block" />
            <span>Operational</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
