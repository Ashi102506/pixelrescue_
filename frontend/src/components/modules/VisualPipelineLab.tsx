import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Save,
  Plus,
  Trash2,
  GitFork,
  CheckCircle,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { api } from '../../services/api';

// Custom Node Component for Image Processing Stages
const DIPProcessingNode: React.FC<{ data: any; id: string }> = ({ data, id }) => {
  return (
    <div className="bg-charcoal-900 border-2 border-slate-700/80 rounded-xl p-3 min-w-[190px] shadow-2xl text-xs font-mono text-slate-200">
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2.5 !h-2.5" />

      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
        <span className="font-bold text-cyan-300 truncate">{data.label}</span>
        <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-slate-400">
          {data.type}
        </span>
      </div>

      {/* Intermediate Thumbnail Preview */}
      {data.preview ? (
        <div className="my-1.5 rounded overflow-hidden border border-slate-800 bg-black/60 flex items-center justify-center">
          <img src={data.preview} alt="Step Preview" className="h-20 w-full object-cover" />
        </div>
      ) : (
        <div className="my-1.5 h-14 rounded border border-dashed border-slate-800 flex items-center justify-center text-[10px] text-slate-500">
          Awaiting Run
        </div>
      )}

      {/* Execution status */}
      {data.time_ms !== undefined && (
        <div className="flex justify-between text-[10px] text-slate-400 pt-1">
          <span>Latency:</span>
          <span className="text-emerald-400 font-semibold">{data.time_ms} ms</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-violet-400 !w-2.5 !h-2.5" />
    </div>
  );
};

const nodeTypes = {
  dipNode: DIPProcessingNode,
};

export const VisualPipelineLab: React.FC = () => {
  const { originalImage, setProcessedImage, setProcessing } = useWorkspaceStore();

  const initialNodes: Node[] = [
    {
      id: 'node-1',
      type: 'dipNode',
      position: { x: 50, y: 150 },
      data: { type: 'input', label: 'Image Source', preview: originalImage },
    },
    {
      id: 'node-2',
      type: 'dipNode',
      position: { x: 300, y: 150 },
      data: { type: 'grayscale', label: 'Luminance Gray', params: { method: 'luminance' } },
    },
    {
      id: 'node-3',
      type: 'dipNode',
      position: { x: 550, y: 150 },
      data: { type: 'histogram_eq', label: 'Histogram EQ' },
    },
    {
      id: 'node-4',
      type: 'dipNode',
      position: { x: 800, y: 150 },
      data: {
        type: 'spatial_filter',
        label: 'Gaussian Blur',
        params: { filter_type: 'gaussian', kernel_size: 5, sigma: 1.2 },
      },
    },
    {
      id: 'node-5',
      type: 'dipNode',
      position: { x: 1050, y: 150 },
      data: { type: 'output', label: 'Final Output' },
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
    { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
    { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true },
    { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true },
  ];

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [execLogs, setExecLogs] = useState<any[]>([]);
  const [pipelineMetrics, setPipelineMetrics] = useState<any>(null);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (connection: any) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  const handleExecutePipeline = async () => {
    if (!originalImage) return;
    setProcessing(true, 'Executing Visual Pipeline DAG on backend...');
    try {
      const res = await api.executePipeline(nodes, edges, originalImage);
      // Update node preview thumbnails
      setNodes((currentNodes) =>
        currentNodes.map((n) => {
          const preview = res.node_previews[n.id];
          const log = res.logs.find((l: any) => l.node_id === n.id);
          return {
            ...n,
            data: {
              ...n.data,
              preview: preview || n.data.preview,
              time_ms: log?.time_ms,
            },
          };
        })
      );
      setExecLogs(res.logs);
      setPipelineMetrics(res.metrics);
      if (res.final_output) {
        setProcessedImage(res.final_output, 'Visual Pipeline Result', res.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddNode = (type: string, label: string, params = {}) => {
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'dipNode',
      position: { x: 300 + Math.random() * 200, y: 250 + Math.random() * 100 },
      data: { type, label, params },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const loadPreset = (presetName: string) => {
    if (presetName === 'edge_boost') {
      setNodes([
        {
          id: 'n1',
          type: 'dipNode',
          position: { x: 50, y: 150 },
          data: { type: 'input', label: 'Input Image', preview: originalImage },
        },
        {
          id: 'n2',
          type: 'dipNode',
          position: { x: 300, y: 150 },
          data: { type: 'grayscale', label: 'Grayscale', params: { method: 'luminance' } },
        },
        {
          id: 'n3',
          type: 'dipNode',
          position: { x: 550, y: 150 },
          data: { type: 'spatial_filter', label: 'Sobel Mag', params: { filter_type: 'sobel' } },
        },
        {
          id: 'n4',
          type: 'dipNode',
          position: { x: 800, y: 150 },
          data: { type: 'threshold', label: 'Edge Threshold', params: { threshold: 60 } },
        },
        {
          id: 'n5',
          type: 'dipNode',
          position: { x: 1050, y: 150 },
          data: { type: 'output', label: 'Extracted Edges' },
        },
      ]);
      setEdges([
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true },
      ]);
    } else if (presetName === 'denoise_contrast') {
      setNodes([
        {
          id: 'n1',
          type: 'dipNode',
          position: { x: 50, y: 150 },
          data: { type: 'input', label: 'Input Image', preview: originalImage },
        },
        {
          id: 'n2',
          type: 'dipNode',
          position: { x: 300, y: 150 },
          data: { type: 'spatial_filter', label: 'Median Denoise', params: { filter_type: 'median', kernel_size: 3 } },
        },
        {
          id: 'n3',
          type: 'dipNode',
          position: { x: 550, y: 150 },
          data: { type: 'gamma', label: 'Gamma Correction', params: { gamma: 1.3 } },
        },
        {
          id: 'n4',
          type: 'dipNode',
          position: { x: 800, y: 150 },
          data: { type: 'spatial_filter', label: 'High-Boost Sharpen', params: { filter_type: 'high_boost', k_boost: 1.5 } },
        },
        {
          id: 'n5',
          type: 'dipNode',
          position: { x: 1050, y: 150 },
          data: { type: 'output', label: 'Enhanced Output' },
        },
      ]);
      setEdges([
        { id: 'e1', source: 'n1', target: 'n2', animated: true },
        { id: 'e2', source: 'n2', target: 'n3', animated: true },
        { id: 'e3', source: 'n3', target: 'n4', animated: true },
        { id: 'e4', source: 'n4', target: 'n5', animated: true },
      ]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Top Action Bar */}
      <div className="h-12 bg-charcoal-900 border-b border-slate-800 px-5 flex items-center justify-between z-10 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono text-cyan-400 font-bold uppercase">
            <GitFork size={15} />
            <span>Node DAG Workflow</span>
          </div>

          {/* Add node dropdown */}
          <div className="flex items-center space-x-1 bg-charcoal-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-400">Add Node:</span>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                if (val === 'spatial_sobel') handleAddNode('spatial_filter', 'Sobel Filter', { filter_type: 'sobel' });
                else if (val === 'spatial_gauss') handleAddNode('spatial_filter', 'Gaussian Blur', { filter_type: 'gaussian', kernel_size: 5 });
                else if (val === 'gamma') handleAddNode('gamma', 'Gamma (γ=1.4)', { gamma: 1.4 });
                else if (val === 'hist_eq') handleAddNode('histogram_eq', 'Histogram EQ');
                else if (val === 'freq_butter') handleAddNode('frequency_filter', 'Butterworth LPF', { family: 'butterworth', cutoff: 35 });
                else if (val === 'pseudocolor') handleAddNode('pseudocolor', 'Pseudo-color (Jet)', { colormap: 'jet' });
                e.target.value = '';
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="">-- Select Algorithm --</option>
              <option value="spatial_gauss" className="bg-charcoal-900 text-slate-200">Gaussian Smoothing</option>
              <option value="spatial_sobel" className="bg-charcoal-900 text-slate-200">Sobel Gradient Edge</option>
              <option value="gamma" className="bg-charcoal-900 text-slate-200">Gamma Power-Law</option>
              <option value="hist_eq" className="bg-charcoal-900 text-slate-200">Histogram Equalization</option>
              <option value="freq_butter" className="bg-charcoal-900 text-slate-200">2D FFT Butterworth LPF</option>
              <option value="pseudocolor" className="bg-charcoal-900 text-slate-200">Pseudo-Color (Jet)</option>
            </select>
          </div>

          {/* Preset Pipelines */}
          <div className="hidden sm:flex items-center space-x-1 text-slate-400">
            <span>Presets:</span>
            <button
              onClick={() => loadPreset('edge_boost')}
              className="px-2 py-0.5 rounded bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
            >
              Edge Detector
            </button>
            <button
              onClick={() => loadPreset('denoise_contrast')}
              className="px-2 py-0.5 rounded bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
            >
              Denoise & Boost
            </button>
          </div>
        </div>

        {/* Run Pipeline Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecutePipeline}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-charcoal-950 font-bold rounded-lg text-xs shadow-glow-cyan transition-all"
          >
            <Play size={13} fill="currentColor" />
            <span>Execute Pipeline</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Bottom Telemetry Drawer */}
      <div className="flex-1 relative w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#1e2942" gap={20} size={1.5} />
          <Controls className="!bg-charcoal-900 !border !border-slate-800 !text-slate-200" />
        </ReactFlow>

        {/* Execution Log Overlay */}
        {execLogs.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 bg-charcoal-950/90 backdrop-blur border border-slate-800 rounded-xl p-3 max-w-md shadow-2xl text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800">
              <span className="text-cyan-400 font-bold flex items-center space-x-1">
                <CheckCircle size={13} className="text-emerald-400" />
                <span>Execution Complete</span>
              </span>
              {pipelineMetrics && (
                <span className="text-[11px] text-slate-400">
                  PSNR: <strong className="text-white">{pipelineMetrics.psnr_db} dB</strong>
                </span>
              )}
            </div>

            <div className="space-y-1 max-h-32 overflow-y-auto">
              {execLogs.map((log, i) => (
                <div key={i} className="flex justify-between text-[11px] text-slate-300">
                  <span className="truncate max-w-[240px]">• {log.label}: {log.description}</span>
                  <span className="text-emerald-400 font-semibold">{log.time_ms} ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
