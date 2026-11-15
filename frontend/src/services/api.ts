import axios from 'axios';
import {
  ImageMetadata,
  PixelInspection,
  QualityMetrics,
  HistogramData,
  KernelStepData,
  FrequencySpectraResponse,
  RestorationChallengeResult,
  SampleImage,
  ExperimentItem,
} from '../types/dip';

const getBaseApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pixelrescue_api_url');
    if (saved) return saved;
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      const viteEnv = import.meta.env.VITE_API_URL;
      if (viteEnv) return viteEnv;
      return 'http://localhost:8000/api';
    }
  }
  return '/api';
};

const client = axios.create({
  baseURL: getBaseApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('pixelrescue_api_url');
    if (saved) {
      config.baseURL = saved;
    } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      config.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    }
  }
  return config;
});

export const api = {
  // Samples
  getSamples: async (): Promise<SampleImage[]> => {
    const res = await client.get('/samples/');
    return res.data;
  },
  getSampleById: async (id: string): Promise<{ id: string; name: string; image: string; metadata: ImageMetadata }> => {
    const res = await client.get(`/samples/${id}`);
    return res.data;
  },

  // Fundamentals
  uploadImage: async (file: File): Promise<{ image: string; metadata: ImageMetadata }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/fundamentals/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getMetadata: async (image: string): Promise<ImageMetadata> => {
    const res = await client.post('/fundamentals/metadata', { image });
    return res.data;
  },
  inspectPixel: async (image: string, x: number, y: number, neighborhood_size = 3): Promise<PixelInspection> => {
    const res = await client.post('/fundamentals/inspect', { image, x, y, neighborhood_size });
    return res.data;
  },
  separateChannels: async (image: string): Promise<{ r: string; g: string; b: string; r_gray: string; g_gray: string; b_gray: string }> => {
    const res = await client.post('/fundamentals/separate-channels', { image });
    return res.data;
  },
  convertGrayscale: async (image: string, method = 'luminance'): Promise<{ image: string; method: string }> => {
    const res = await client.post(`/fundamentals/grayscale?method=${method}`, { image });
    return res.data;
  },
  simulateSampling: async (image: string, factor: number, interpolation = 'nearest'): Promise<{ image: string; factor: number }> => {
    const res = await client.post('/fundamentals/sampling', { image, factor, interpolation });
    return res.data;
  },
  simulateQuantization: async (image: string, levels: number): Promise<{ image: string; levels: number }> => {
    const res = await client.post('/fundamentals/quantization', { image, levels });
    return res.data;
  },
  calculateDistances: async (p1: [number, number], p2: [number, number], width = 256, height = 256) => {
    const res = await client.post('/fundamentals/distances', { p1, p2, width, height });
    return res.data;
  },
  analyzeConnectivity: async (image: string, seed_x: number, seed_y: number, threshold = 128) => {
    const res = await client.post('/fundamentals/connectivity', { image, seed_x, seed_y, threshold });
    return res.data;
  },

  // Enhancement
  applyTransform: async (params: {
    image: string;
    operation: string;
    gamma?: number;
    c_factor?: number;
    r1?: number;
    s1?: number;
    r2?: number;
    s2?: number;
    threshold_val?: number;
    block_size?: number;
    c_constant?: number;
    alpha?: number;
    beta?: number;
  }) => {
    const res = await client.post('/enhancement/transform', params);
    return res.data;
  },
  getHistogram: async (image: string): Promise<HistogramData> => {
    const res = await client.post('/enhancement/histogram', { image });
    return res.data;
  },
  equalizeHistogram: async (image: string) => {
    const res = await client.post('/enhancement/equalize', { image });
    return res.data;
  },
  specifyHistogram: async (params: {
    image: string;
    target_type: string;
    reference_image?: string;
    gaussian_mean?: number;
    gaussian_std?: number;
  }) => {
    const res = await client.post('/enhancement/specify', params);
    return res.data;
  },

  // Spatial
  applySpatialFilter: async (params: {
    image: string;
    filter_type: string;
    kernel_size?: number;
    sigma?: number;
    k_boost?: number;
    laplacian_mode?: string;
    padding?: string;
  }) => {
    const res = await client.post('/spatial/filter', params);
    return res.data;
  },
  inspectKernelStep: async (params: {
    image: string;
    x: number;
    y: number;
    filter_type: string;
    kernel_size?: number;
    sigma?: number;
  }): Promise<KernelStepData> => {
    const res = await client.post('/spatial/step-inspect', params);
    return res.data;
  },

  // Frequency
  getSpectra: async (image: string) => {
    const res = await client.post('/frequency/spectra', { image });
    return res.data;
  },
  applyFrequencyFilter: async (params: {
    image: string;
    filter_family: string;
    pass_type: string;
    cutoff: number;
    order?: number;
    notch_u0?: number;
    notch_v0?: number;
    notch_d0?: number;
  }): Promise<FrequencySpectraResponse> => {
    const res = await client.post('/frequency/filter', params);
    return res.data;
  },

  // Restoration
  degradeImage: async (params: {
    image: string;
    blur_type: string;
    blur_kernel_size?: number;
    motion_angle?: number;
    gaussian_blur_sigma?: number;
    noise_type?: string;
    noise_strength?: number;
    seed?: number;
  }) => {
    const res = await client.post('/restoration/degrade', params);
    return res.data;
  },
  restoreImage: async (params: {
    image: string;
    method: string;
    kernel_size?: number;
    wiener_k?: number;
    inverse_cutoff?: number;
    motion_angle?: number;
    notch_u0?: number;
    notch_v0?: number;
  }) => {
    const res = await client.post('/restoration/restore', params);
    return res.data;
  },
  runRestorationChallenge: async (params: {
    image: string;
    blur_type: string;
    blur_kernel_size: number;
    motion_angle?: number;
    gaussian_blur_sigma?: number;
    noise_type: string;
    noise_strength: number;
    seed?: number;
    rest_method: string;
    rest_kernel_size: number;
    wiener_k?: number;
    inverse_cutoff?: number;
  }): Promise<RestorationChallengeResult> => {
    const res = await client.post('/restoration/challenge', params);
    return res.data;
  },

  // Color
  decomposeColor: async (image: string) => {
    const res = await client.post('/color/decompose', { image });
    return res.data;
  },
  adjustHSI: async (image: string, hue_shift_deg = 0, saturation_scale = 1.0, intensity_scale = 1.0) => {
    const res = await client.post('/color/adjust-hsi', {
      image,
      hue_shift_deg,
      saturation_scale,
      intensity_scale,
    });
    return res.data;
  },
  applyPseudocolor: async (image: string, colormap_name = 'jet', intensity_slices = 8) => {
    const res = await client.post('/color/pseudocolor', {
      image,
      colormap_name,
      intensity_slices,
    });
    return res.data;
  },

  // Metrics
  compareQuality: async (reference_image: string, target_image: string, duration_ms = 0): Promise<QualityMetrics> => {
    const res = await client.post('/metrics/compare', {
      reference_image,
      target_image,
      duration_ms,
    });
    return res.data;
  },

  // Pipeline
  executePipeline: async (nodes: any[], edges: any[], initial_image: string) => {
    const res = await client.post('/pipeline/execute', {
      nodes,
      edges,
      initial_image,
    });
    return res.data;
  },
  listSavedPipelines: async () => {
    const res = await client.get('/pipeline/saved');
    return res.data;
  },
  savePipeline: async (name: string, description: string, nodes: any[], edges: any[], thumbnail?: string) => {
    const res = await client.post('/pipeline/save', {
      name,
      description,
      nodes,
      edges,
      thumbnail,
    });
    return res.data;
  },
  deletePipeline: async (id: number) => {
    const res = await client.delete(`/pipeline/saved/${id}`);
    return res.data;
  },

  // Experiments
  listExperiments: async (): Promise<ExperimentItem[]> => {
    const res = await client.get('/experiments/');
    return res.data;
  },
  createExperiment: async (data: {
    title: string;
    description?: string;
    module: string;
    algorithm: string;
    parameters: any;
    metrics?: any;
    input_image_preview: string;
    output_image_preview: string;
  }): Promise<{ id: number; title: string; status: string }> => {
    const res = await client.post('/experiments/', data);
    return res.data;
  },
  getExperiment: async (id: number): Promise<ExperimentItem> => {
    const res = await client.get(`/experiments/${id}`);
    return res.data;
  },
  deleteExperiment: async (id: number) => {
    const res = await client.delete(`/experiments/${id}`);
    return res.data;
  },
};
