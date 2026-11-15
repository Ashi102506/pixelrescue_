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
    <div className="bg-surface-raised border border-hairline rounded-lg p-3 min-w-[190px] shadow-lg text-xs font-mono text-slate-200">
      <Handle type="target" position={Position.Left} className="!bg-cyan-400 !w-2 !h-2 !border-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-hairline">
        <span className="font-semibold text-slate-100 truncate text-[11px]">{data.label}</span>
        <span className="text-[9px] uppercase px-1 rounded bg-obsidian-950 text-slate-400 border border-hairline">
          {data.type}
        </span>
      </div>

      {/* Intermediate Thumbnail Preview */}
      {data.preview ? (
        <div className="my-1.5 rounded overflow-hidden border border-hairline bg-obsidian-950 flex items-center justify-center p-0.5">
          <img src={data.preview} alt="Step Preview" className="h-20 w-full object-cover rounded" />
        </div>
      ) : (
        <div className="my-1.5 h-14 rounded border border-dashed border-hairline flex items-center justify-center text-[10px] text-slate-500 font-mono">
          Pending Execution
        </div>
      )}

      {/* Execution latency */}
      {data.time_ms !== undefined && (
        <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-hairline">
          <span>Latency:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">{data.time_ms} ms</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-cyan-400 !w-2 !h-2 !border-none" />
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
    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
    { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
    { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
    { id: 'e4-5', source: 'node-4', target: 'node-5', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
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
    (connection: any) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } }, eds)),
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
        { id: 'e1', source: 'n1', target: 'n2', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e2', source: 'n2', target: 'n3', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e3', source: 'n3', target: 'n4', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e4', source: 'n4', target: 'n5', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
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
        { id: 'e1', source: 'n1', target: 'n2', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e2', source: 'n2', target: 'n3', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e3', source: 'n3', target: 'n4', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
        { id: 'e4', source: 'n4', target: 'n5', animated: true, style: { stroke: '#38bdf8', strokeWidth: 1.5 } },
      ]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-obsidian-950 font-sans">
      {/* Top Action Bar */}
      <div className="h-11 bg-obsidian-900 border-b border-hairline px-4 flex items-center justify-between z-10 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold uppercase text-[11px]">
            <GitFork size={13} />
            <span>DAG Pipeline Canvas</span>
          </div>

          {/* Add node dropdown */}
          <div className="flex items-center space-x-1 bg-surface-raised px-2 py-1 rounded border border-hairline text-[11px]">
            <span className="text-slate-400">Add Stage:</span>
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
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">-- Choose Operator --</option>
              <option value="spatial_gauss" className="bg-obsidian-950 text-slate-200">Gaussian Smoothing</option>
              <option value="spatial_sobel" className="bg-obsidian-950 text-slate-200">Sobel Gradient Edge</option>
              <option value="gamma" className="bg-obsidian-950 text-slate-200">Gamma Power-Law</option>
              <option value="hist_eq" className="bg-obsidian-950 text-slate-200">Histogram Equalization</option>
              <option value="freq_butter" className="bg-obsidian-950 text-slate-200">2D FFT Butterworth LPF</option>
              <option value="pseudocolor" className="bg-obsidian-950 text-slate-200">Pseudo-Color (Jet)</option>
            </select>
          </div>

          {/* Preset Pipelines */}
          <div className="hidden sm:flex items-center space-x-1 text-slate-400 text-[11px]">
            <span className="text-slate-500">Presets:</span>
            <button
              onClick={() => loadPreset('edge_boost')}
              className="px-2 py-0.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-300"
            >
              Edge Detector
            </button>
            <button
              onClick={() => loadPreset('denoise_contrast')}
              className="px-2 py-0.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-300"
            >
              Denoise & Boost
            </button>
          </div>
        </div>

        {/* Run Pipeline Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecutePipeline}
            className="flex items-center space-x-1.5 px-3 py-1 bg-slate-100 hover:bg-white text-obsidian-950 font-semibold rounded text-xs border border-white/20 transition-all shadow-sm active:scale-[0.99]"
          >
            <Play size={11} fill="currentColor" />
            <span>Execute Topological DAG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Bottom Telemetry Drawer */}
      <div className="flex-1 relative w-full h-full bg-obsidian-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#191e28" gap={20} size={1} />
          <Controls className="!bg-surface-raised !border !border-hairline !text-slate-300 !rounded-md" />
        </ReactFlow>

        {/* Execution Log Overlay */}
        {execLogs.length > 0 && (
          <div className="absolute bottom-4 left-4 z-10 bg-surface-raised/95 backdrop-blur-md border border-hairline rounded-lg p-3 max-w-md shadow-xl text-xs font-mono">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-hairline">
              <span className="text-emerald-400 font-semibold flex items-center space-x-1 text-[11px]">
                <CheckCircle size={12} className="text-emerald-400" />
                <span>DAG Completed Successfully</span>
              </span>
              {pipelineMetrics && (
                <span className="text-[10px] text-slate-400">
                  PSNR: <strong className="text-white tabular-nums">{pipelineMetrics.psnr_db} dB</strong>
                </span>
              )}
            </div>

            <div className="space-y-1 max-h-32 overflow-y-auto">
              {execLogs.map((log, i) => (
                <div key={i} className="flex justify-between text-[10px] text-slate-400">
                  <span className="truncate max-w-[240px] text-slate-300">• {log.label}: {log.description}</span>
                  <span className="text-emerald-400 font-semibold tabular-nums">{log.time_ms} ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
