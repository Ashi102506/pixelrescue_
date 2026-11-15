import { create } from 'zustand';
import { ModuleId, ImageMetadata, QualityMetrics } from '../types/dip';
import { DEFAULT_SAMPLES } from '../assets/defaultSamples';

const initialSample = DEFAULT_SAMPLES[0];

interface WorkspaceState {
  activeModule: ModuleId;
  originalImage: string | null;
  processedImage: string | null;
  historyStack: string[];
  historyIndex: number;
  metadata: ImageMetadata | null;
  activeAlgorithm: string;
  isProcessing: boolean;
  statusMessage: string;
  comparisonMode: 'single' | 'split' | 'side_by_side' | 'difference';
  splitPosition: number; // 0 to 100
  zoomLevel: number; // 1.0 = 100%
  activeMetrics: QualityMetrics | null;
  mathModalOpen: boolean;
  mathModalData: {
    title: string;
    category: string;
    formula: string;
    variables: Array<{ symbol: string; meaning: string }>;
    explanation: string;
    complexity?: string;
    reference?: string;
  } | null;

  // Actions
  setActiveModule: (module: ModuleId) => void;
  setImage: (image: string, metadata?: ImageMetadata) => void;
  setProcessedImage: (image: string, algorithmName?: string, metrics?: QualityMetrics) => void;
  undo: () => void;
  redo: () => void;
  resetProcessed: () => void;
  setComparisonMode: (mode: 'single' | 'split' | 'side_by_side' | 'difference') => void;
  setSplitPosition: (pos: number) => void;
  setZoomLevel: (zoom: number) => void;
  setProcessing: (isProcessing: boolean, message?: string) => void;
  openMathModal: (data: WorkspaceState['mathModalData']) => void;
  closeMathModal: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activeModule: 'dashboard',
  originalImage: initialSample.image,
  processedImage: initialSample.image,
  historyStack: [initialSample.image],
  historyIndex: 0,
  metadata: initialSample.metadata,
  activeAlgorithm: 'Cameraman Benchmark',
  isProcessing: false,
  statusMessage: 'Ready (256×256 px)',
  comparisonMode: 'split',
  splitPosition: 50,
  zoomLevel: 1.0,
  activeMetrics: null,
  mathModalOpen: false,
  mathModalData: null,

  setActiveModule: (module) => set({ activeModule: module }),

  setImage: (image, metadata) => {
    set({
      originalImage: image,
      processedImage: image,
      historyStack: [image],
      historyIndex: 0,
      metadata: metadata || null,
      activeMetrics: null,
      statusMessage: 'Image loaded',
    });
  },

  setProcessedImage: (image, algorithmName, metrics) => {
    const { historyStack, historyIndex } = get();
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(image);
    set({
      processedImage: image,
      historyStack: newStack,
      historyIndex: newStack.length - 1,
      activeAlgorithm: algorithmName || get().activeAlgorithm,
      activeMetrics: metrics || null,
      statusMessage: `${algorithmName || 'Operation'} applied`,
    });
  },

  undo: () => {
    const { historyStack, historyIndex } = get();
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      set({
        historyIndex: newIdx,
        processedImage: historyStack[newIdx],
        statusMessage: `Undo to step ${newIdx + 1}`,
      });
    }
  },

  redo: () => {
    const { historyStack, historyIndex } = get();
    if (historyIndex < historyStack.length - 1) {
      const newIdx = historyIndex + 1;
      set({
        historyIndex: newIdx,
        processedImage: historyStack[newIdx],
        statusMessage: `Redo to step ${newIdx + 1}`,
      });
    }
  },

  resetProcessed: () => {
    const { originalImage } = get();
    if (originalImage) {
      set({
        processedImage: originalImage,
        historyStack: [originalImage],
        historyIndex: 0,
        activeAlgorithm: 'None',
        activeMetrics: null,
        statusMessage: 'Reset to original image',
      });
    }
  },

  setComparisonMode: (mode) => set({ comparisonMode: mode }),
  setSplitPosition: (pos) => set({ splitPosition: pos }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setProcessing: (isProcessing, message) =>
    set({ isProcessing, statusMessage: message || (isProcessing ? 'Processing image...' : 'Ready') }),

  openMathModal: (data) => set({ mathModalOpen: true, mathModalData: data }),
  closeMathModal: () => set({ mathModalOpen: false, mathModalData: null }),
}));
