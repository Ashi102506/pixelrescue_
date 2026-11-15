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
  Cpu,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import type { ModuleId } from '../../types/dip';

interface NavItem {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
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
        label: 'Studio Dashboard',
        icon: LayoutDashboard,
        color: 'text-sky-400',
      },
    ],
  },
  {
    category: 'DIP Laboratories',
    items: [
      {
        id: 'fundamentals',
        label: 'Image Fundamentals',
        icon: Layers,
        color: 'text-cyan-400',
      },
      {
        id: 'enhancement',
        label: 'Enhancement Studio',
        icon: Sliders,
        color: 'text-purple-400',
      },
      {
        id: 'spatial',
        label: 'Spatial Filtering',
        icon: Cpu,
        color: 'text-emerald-400',
      },
      {
        id: 'frequency',
        label: 'SPECTRA FFT Lab',
        icon: Radio,
        color: 'text-violet-400',
        flagship: true,
      },
      {
        id: 'restoration',
        label: 'Image Restoration',
        icon: Wand2,
        color: 'text-amber-400',
      },
      {
        id: 'color',
        label: 'Color Processing',
        icon: Palette,
        color: 'text-rose-400',
      },
      {
        id: 'quality',
        label: 'Quality Assessment',
        icon: BarChart3,
        color: 'text-blue-400',
      },
    ],
  },
  {
    category: 'Workflows & Data',
    items: [
      {
        id: 'pipeline',
        label: 'Visual Node DAG',
        icon: GitFork,
        color: 'text-teal-400',
      },
      {
        id: 'history',
        label: 'Experiment Archive',
        icon: History,
        color: 'text-slate-400',
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule } = useWorkspaceStore();

  return (
    <aside className="w-60 bg-slate-950 border-r border-slate-800/80 flex flex-col h-full select-none z-20 shrink-0 font-sans">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
            <Aperture size={18} strokeWidth={2.4} />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">
                PIXEL<span className="text-cyan-400">RESCUE</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight leading-none mt-0.5">
              Digital Image Processing Suite
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {group.category}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800/90 text-white font-semibold shadow-sm border border-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      size={16}
                      className={`shrink-0 ${isActive ? item.color : 'text-slate-500'}`}
                    />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>

                  {item.flagship && (
                    <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      SPECTRA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Calibration Status */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">DIP Standard</span>
          <span className="text-slate-300 font-medium">Gonzalez & Woods</span>
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>Engine Status</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Operational</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
