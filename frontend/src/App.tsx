import React from 'react';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { Sidebar } from './components/common/Sidebar';
import { TopNav } from './components/common/TopNav';
import { MathExplainModal } from './components/common/MathExplainModal';

// Modules
import { DashboardView } from './components/modules/DashboardView';
import { FundamentalsLab } from './components/modules/FundamentalsLab';
import { EnhancementLab } from './components/modules/EnhancementLab';
import { SpatialLab } from './components/modules/SpatialLab';
import { FrequencyLab } from './components/modules/FrequencyLab';
import { RestorationLab } from './components/modules/RestorationLab';
import { ColorLab } from './components/modules/ColorLab';
import { QualityLab } from './components/modules/QualityLab';
import { VisualPipelineLab } from './components/modules/VisualPipelineLab';
import { ExperimentHistoryLab } from './components/modules/ExperimentHistoryLab';

export const App: React.FC = () => {
  const { activeModule } = useWorkspaceStore();

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'fundamentals':
        return <FundamentalsLab />;
      case 'enhancement':
        return <EnhancementLab />;
      case 'spatial':
        return <SpatialLab />;
      case 'frequency':
        return <FrequencyLab />;
      case 'restoration':
        return <RestorationLab />;
      case 'color':
        return <ColorLab />;
      case 'quality':
        return <QualityLab />;
      case 'pipeline':
        return <VisualPipelineLab />;
      case 'history':
        return <ExperimentHistoryLab />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-charcoal-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Dynamic Laboratory Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-charcoal-950 relative">
          {renderModule()}
        </main>
      </div>

      {/* Global Academic Math Formulation Modal */}
      <MathExplainModal />
    </div>
  );
};

export default App;
