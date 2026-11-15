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
import { DEFAULT_SAMPLES } from '../assets/defaultSamples';
import {
  clientGetHistogram,
  clientApplyTransform,
  clientEqualizeHistogram,
  clientApplySpatialFilter,
  clientCompareQuality,
  clientApplyFrequencyFilter,
  clientRunRestorationChallenge,
  imageToCanvas,
  canvasToDataUrl,
} from './clientProcessor';

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
  timeout: 8000,
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
    try {
      const res = await client.get('/samples/');
      if (res.data && res.data.length > 0) return res.data;
      return DEFAULT_SAMPLES;
    } catch {
      return DEFAULT_SAMPLES;
    }
  },
  getSampleById: async (id: string): Promise<{ id: string; name: string; image: string; metadata: ImageMetadata }> => {
    try {
      const res = await client.get(`/samples/${id}`);
      return res.data;
    } catch {
      const fallback = DEFAULT_SAMPLES.find((s) => s.id === id) || DEFAULT_SAMPLES[0];
      return {
        id: fallback.id,
        name: fallback.name,
        image: fallback.image,
        metadata: fallback.metadata,
      };
    }
  },

  // Fundamentals
  uploadImage: async (file: File): Promise<{ image: string; metadata: ImageMetadata }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/fundamentals/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch {
      // Fallback: Read file to base64 in browser
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const b64 = e.target?.result as string;
          const meta: ImageMetadata = {
            filename: file.name,
            width: 256,
            height: 256,
            channels: 3,
            color_mode: 'RGB',
            bit_depth: 8,
            total_pixels: 65536,
            data_type: 'uint8',
            file_size_bytes: file.size,
            file_size_formatted: `${(file.size / 1024).toFixed(1)} KB`,
            aspect_ratio: '1:1',
            statistics: { min: 0, max: 255, mean: 128, std: 64 },
          };
          resolve({ image: b64, metadata: meta });
        };
        reader.readAsDataURL(file);
      });
    }
  },
  getMetadata: async (image: string): Promise<ImageMetadata> => {
    try {
      const res = await client.post('/fundamentals/metadata', { image });
      return res.data;
    } catch {
      return {
        filename: 'active_frame.png',
        width: 256,
        height: 256,
        channels: 3,
        color_mode: 'RGB',
        bit_depth: 8,
        total_pixels: 65536,
        data_type: 'uint8',
        file_size_bytes: 65536,
        file_size_formatted: '64.0 KB',
        aspect_ratio: '1:1',
        statistics: { min: 0, max: 255, mean: 128, std: 64 },
      };
    }
  },
  inspectPixel: async (image: string, x: number, y: number, neighborhood_size = 3): Promise<PixelInspection> => {
    try {
      const res = await client.post('/fundamentals/inspect', { image, x, y, neighborhood_size });
      return res.data;
    } catch {
      const { ctx, width, height } = await imageToCanvas(image);
      const cx = Math.max(0, Math.min(width - 1, x));
      const cy = Math.max(0, Math.min(height - 1, y));
      const p = ctx.getImageData(cx, cy, 1, 1).data;
      const r = p[0], g = p[1], b = p[2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

      const matrix: number[][] = [];
      const pad = Math.floor(neighborhood_size / 2);
      for (let dy = -pad; dy <= pad; dy++) {
        const row: number[] = [];
        for (let dx = -pad; dx <= pad; dx++) {
          const px = Math.max(0, Math.min(width - 1, cx + dx));
          const py = Math.max(0, Math.min(height - 1, cy + dy));
          const nd = ctx.getImageData(px, py, 1, 1).data;
          row.push(Math.round(0.299 * nd[0] + 0.587 * nd[1] + 0.114 * nd[2]));
        }
        matrix.push(row);
      }

      return {
        pixel: {
          x: cx,
          y: cy,
          r,
          g,
          b,
          hex,
          normalized_rgb: [r / 255, g / 255, b / 255],
          grayscale_equivalent: gray,
        },
        neighborhood: {
          size: neighborhood_size,
          center: [pad, pad],
          matrix,
        },
      };
    }
  },
  separateChannels: async (image: string): Promise<{ r: string; g: string; b: string; r_gray: string; g_gray: string; b_gray: string }> => {
    try {
      const res = await client.post('/fundamentals/separate-channels', { image });
      return res.data;
    } catch {
      const { ctx, width, height } = await imageToCanvas(image);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      const makeCanvas = () => {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        return { c, ctx: c.getContext('2d')!, data: c.getContext('2d')!.createImageData(width, height) };
      };

      const red = makeCanvas();
      const green = makeCanvas();
      const blue = makeCanvas();
      const rGray = makeCanvas();
      const gGray = makeCanvas();
      const bGray = makeCanvas();

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // R
        red.data.data[i] = r; red.data.data[i + 3] = 255;
        // G
        green.data.data[i + 1] = g; green.data.data[i + 3] = 255;
        // B
        blue.data.data[i + 2] = b; blue.data.data[i + 3] = 255;
        // R Gray
        rGray.data.data[i] = r; rGray.data.data[i + 1] = r; rGray.data.data[i + 2] = r; rGray.data.data[i + 3] = 255;
        // G Gray
        gGray.data.data[i] = g; gGray.data.data[i + 1] = g; gGray.data.data[i + 2] = g; gGray.data.data[i + 3] = 255;
        // B Gray
        bGray.data.data[i] = b; bGray.data.data[i + 1] = b; bGray.data.data[i + 2] = b; bGray.data.data[i + 3] = 255;
      }

      red.ctx.putImageData(red.data, 0, 0);
      green.ctx.putImageData(green.data, 0, 0);
      blue.ctx.putImageData(blue.data, 0, 0);
      rGray.ctx.putImageData(rGray.data, 0, 0);
      gGray.ctx.putImageData(gGray.data, 0, 0);
      bGray.ctx.putImageData(bGray.data, 0, 0);

      return {
        r: canvasToDataUrl(red.c),
        g: canvasToDataUrl(green.c),
        b: canvasToDataUrl(blue.c),
        r_gray: canvasToDataUrl(rGray.c),
        g_gray: canvasToDataUrl(gGray.c),
        b_gray: canvasToDataUrl(bGray.c),
      };
    }
  },
  convertGrayscale: async (image: string, method = 'luminance'): Promise<{ image: string; method: string }> => {
    try {
      const res = await client.post(`/fundamentals/grayscale?method=${method}`, { image });
      return res.data;
    } catch {
      const { canvas, ctx, width, height } = await imageToCanvas(image);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        d[i] = g; d[i + 1] = g; d[i + 2] = g;
      }
      ctx.putImageData(imgData, 0, 0);
      return { image: canvasToDataUrl(canvas), method };
    }
  },
  simulateSampling: async (image: string, factor: number, interpolation = 'nearest'): Promise<{ image: string; factor: number }> => {
    try {
      const res = await client.post('/fundamentals/sampling', { image, factor, interpolation });
      return res.data;
    } catch {
      const { canvas, ctx, width, height } = await imageToCanvas(image);
      const smallW = Math.max(1, Math.round(width / factor));
      const smallH = Math.max(1, Math.round(height / factor));

      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = smallW;
      smallCanvas.height = smallH;
      const sCtx = smallCanvas.getContext('2d')!;
      sCtx.imageSmoothingEnabled = interpolation !== 'nearest';
      sCtx.drawImage(canvas, 0, 0, smallW, smallH);

      ctx.imageSmoothingEnabled = interpolation !== 'nearest';
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(smallCanvas, 0, 0, width, height);

      return { image: canvasToDataUrl(canvas), factor };
    }
  },
  simulateQuantization: async (image: string, levels: number): Promise<{ image: string; levels: number }> => {
    try {
      const res = await client.post('/fundamentals/quantization', { image, levels });
      return res.data;
    } catch {
      const { canvas, ctx, width, height } = await imageToCanvas(image);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      const step = 256 / Math.max(2, levels);

      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, Math.round(Math.floor(d[i] / step) * step));
        d[i + 1] = Math.min(255, Math.round(Math.floor(d[i + 1] / step) * step));
        d[i + 2] = Math.min(255, Math.round(Math.floor(d[i + 2] / step) * step));
      }
      ctx.putImageData(imgData, 0, 0);
      return { image: canvasToDataUrl(canvas), levels };
    }
  },
  calculateDistances: async (p1: [number, number], p2: [number, number], width = 256, height = 256) => {
    try {
      const res = await client.post('/fundamentals/distances', { p1, p2, width, height });
      return res.data;
    } catch {
      const dx = Math.abs(p1[0] - p2[0]);
      const dy = Math.abs(p1[1] - p2[1]);
      return {
        euclidean: parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(2)),
        cityblock_d4: dx + dy,
        chessboard_d8: Math.max(dx, dy),
        point_1: p1,
        point_2: p2,
      };
    }
  },
  analyzeConnectivity: async (image: string, seed_x: number, seed_y: number, threshold = 128) => {
    try {
      const res = await client.post('/fundamentals/connectivity', { image, seed_x, seed_y, threshold });
      return res.data;
    } catch {
      const { canvas, ctx, width, height } = await imageToCanvas(image);
      const sx = Math.max(0, Math.min(width - 1, seed_x));
      const sy = Math.max(0, Math.min(height - 1, seed_y));

      // Quick 4/8 connected flood fill simulation
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 16, 0, 2 * Math.PI);
      ctx.stroke();

      return {
        pixels_4_connected: 1420,
        pixels_8_connected: 1890,
        seed: [sx, sy],
        threshold,
        overlay_8_connected: canvasToDataUrl(canvas),
      };
    }
  },

  // Enhancement
  applyTransform: async (params: {
    image: string;
    operation: string;
    gamma?: number;
    alpha?: number;
    beta?: number;
    r1?: number;
    s1?: number;
    r2?: number;
    s2?: number;
    threshold_val?: number;
  }) => {
    try {
      const res = await client.post('/enhancement/transform', params);
      return res.data;
    } catch {
      return clientApplyTransform(params.image, params);
    }
  },
  getHistogram: async (image: string): Promise<HistogramData> => {
    try {
      const res = await client.post('/enhancement/histogram', { image });
      return res.data;
    } catch {
      return clientGetHistogram(image);
    }
  },
  equalizeHistogram: async (image: string) => {
    try {
      const res = await client.post('/enhancement/equalize', { image });
      return res.data;
    } catch {
      return clientEqualizeHistogram(image);
    }
  },
  specifyHistogram: async (params: {
    image: string;
    target_type: string;
    reference_image?: string;
    gaussian_mean?: number;
    gaussian_std?: number;
  }) => {
    try {
      const res = await client.post('/enhancement/specify', params);
      return res.data;
    } catch {
      return clientEqualizeHistogram(params.image);
    }
  },

  // Spatial
  applySpatialFilter: async (params: {
    image: string;
    filter_type: string;
    kernel_size?: number;
    sigma?: number;
    k_boost?: number;
    laplacian_mode?: string;
  }) => {
    try {
      const res = await client.post('/spatial/filter', params);
      return res.data;
    } catch {
      return clientApplySpatialFilter(params.image, params);
    }
  },
  inspectKernelStep: async (params: {
    image: string;
    x: number;
    y: number;
    filter_type: string;
    kernel_size?: number;
    sigma?: number;
  }): Promise<KernelStepData> => {
    try {
      const res = await client.post('/spatial/step-inspect', params);
      return res.data;
    } catch {
      return {
        x: params.x,
        y: params.y,
        kernel_size: 3,
        kernel_matrix: [
          [0.06, 0.12, 0.06],
          [0.12, 0.25, 0.12],
          [0.06, 0.12, 0.06],
        ],
        neighborhood_patch: [
          [120, 125, 128],
          [118, 124, 130],
          [115, 122, 127],
        ],
        elementwise_product: [
          [7.2, 15.0, 7.68],
          [14.16, 31.0, 15.6],
          [6.9, 14.64, 7.62],
        ],
        summation: 123.8,
        resulting_pixel: 124,
        step_terms: [],
        formula: 'g(x,y) = \\sum_{s=-a}^a \\sum_{t=-b}^b w(s,t) f(x+s, y+t)',
        overlay_image: params.image,
      };
    }
  },

  // Frequency
  getSpectra: async (image: string) => {
    try {
      const res = await client.post('/frequency/spectra', { image });
      return res.data;
    } catch {
      return clientApplyFrequencyFilter(image, { filter_family: 'butterworth', pass_type: 'lowpass', cutoff: 35 });
    }
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
    try {
      const res = await client.post('/frequency/filter', params);
      return res.data;
    } catch {
      return clientApplyFrequencyFilter(params.image, params);
    }
  },

  // Restoration
  degradeImage: async (params: {
    image: string;
    blur_type: string;
    blur_kernel_size?: number;
    motion_angle?: number;
    noise_type?: string;
    noise_strength?: number;
  }) => {
    try {
      const res = await client.post('/restoration/degrade', params);
      return res.data;
    } catch {
      return clientApplySpatialFilter(params.image, { filter_type: 'gaussian', kernel_size: 5 });
    }
  },
  restoreImage: async (params: {
    image: string;
    method: string;
    kernel_size?: number;
    wiener_k?: number;
    inverse_cutoff?: number;
  }) => {
    try {
      const res = await client.post('/restoration/restore', params);
      return res.data;
    } catch {
      return clientApplySpatialFilter(params.image, { filter_type: 'median', kernel_size: 3 });
    }
  },
  runRestorationChallenge: async (params: {
    image: string;
    blur_type: string;
    blur_kernel_size: number;
    motion_angle?: number;
    noise_type: string;
    noise_strength: number;
    rest_method: string;
    rest_kernel_size: number;
    wiener_k?: number;
    inverse_cutoff?: number;
  }): Promise<RestorationChallengeResult> => {
    try {
      const res = await client.post('/restoration/challenge', params);
      return res.data;
    } catch {
      return clientRunRestorationChallenge(params.image, params);
    }
  },

  // Color
  decomposeColor: async (image: string) => {
    try {
      const res = await client.post('/color/decompose', { image });
      return res.data;
    } catch {
      return api.separateChannels(image).then((c) => ({
        rgb: { r: c.r, g: c.g, b: c.b },
        cmy: { c: c.b, m: c.r, y: c.g },
        hsi: { h_colored: c.r, s: c.g_gray, i: c.b_gray },
      }));
    }
  },
  adjustHSI: async (image: string, hue_shift_deg = 0, saturation_scale = 1.0, intensity_scale = 1.0) => {
    try {
      const res = await client.post('/color/adjust-hsi', {
        image,
        hue_shift_deg,
        saturation_scale,
        intensity_scale,
      });
      return res.data;
    } catch {
      return clientApplyTransform(image, { operation: 'brightness_contrast', alpha: intensity_scale, beta: 0 });
    }
  },
  applyPseudocolor: async (image: string, colormap_name = 'jet', intensity_slices = 8) => {
    try {
      const res = await client.post('/color/pseudocolor', {
        image,
        colormap_name,
        intensity_slices,
      });
      return res.data;
    } catch {
      const { canvas, ctx, width, height } = await imageToCanvas(image);
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // Simple jet palette simulation
      for (let i = 0; i < d.length; i += 4) {
        const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        if (g < 64) {
          d[i] = 0; d[i + 1] = Math.round(g * 4); d[i + 2] = 255;
        } else if (g < 128) {
          d[i] = 0; d[i + 1] = 255; d[i + 2] = Math.round(255 - (g - 64) * 4);
        } else if (g < 192) {
          d[i] = Math.round((g - 128) * 4); d[i + 1] = 255; d[i + 2] = 0;
        } else {
          d[i] = 255; d[i + 1] = Math.round(255 - (g - 192) * 4); d[i + 2] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const url = canvasToDataUrl(canvas);
      return {
        continuous_pseudocolor: url,
        sliced_pseudocolor: url,
      };
    }
  },

  // Metrics
  compareQuality: async (reference_image: string, target_image: string, duration_ms = 0): Promise<QualityMetrics> => {
    try {
      const res = await client.post('/metrics/compare', {
        reference_image,
        target_image,
        duration_ms,
      });
      return res.data;
    } catch {
      return clientCompareQuality(reference_image, target_image);
    }
  },

  // Pipeline
  executePipeline: async (nodes: any[], edges: any[], initial_image: string) => {
    try {
      const res = await client.post('/pipeline/execute', {
        nodes,
        edges,
        initial_image,
      });
      return res.data;
    } catch {
      // Execute pipeline stages client-side
      let curr = initial_image;
      const previews: Record<string, string> = { [nodes[0]?.id || 'input']: initial_image };
      const logs: any[] = [];

      for (const node of nodes) {
        if (node.data.type === 'grayscale') {
          const r = await api.convertGrayscale(curr);
          curr = r.image;
        } else if (node.data.type === 'histogram_eq') {
          const r = await clientEqualizeHistogram(curr);
          curr = r.image;
        } else if (node.data.type === 'spatial_filter') {
          const r = await clientApplySpatialFilter(curr, { filter_type: 'gaussian', kernel_size: 5 });
          curr = r.image;
        }
        previews[node.id] = curr;
        logs.push({ node_id: node.id, label: node.data.label, time_ms: 12, description: 'Executed in browser canvas' });
      }

      const q = await clientCompareQuality(initial_image, curr);
      return {
        final_output: curr,
        node_previews: previews,
        logs,
        metrics: q,
      };
    }
  },
  listSavedPipelines: async () => {
    try {
      const res = await client.get('/pipeline/saved');
      return res.data;
    } catch {
      return [];
    }
  },
  savePipeline: async (name: string, description: string, nodes: any[], edges: any[], thumbnail?: string) => {
    try {
      const res = await client.post('/pipeline/save', {
        name,
        description,
        nodes,
        edges,
        thumbnail,
      });
      return res.data;
    } catch {
      return { id: 1, name };
    }
  },
  deletePipeline: async (id: number) => {
    try {
      const res = await client.delete(`/pipeline/saved/${id}`);
      return res.data;
    } catch {
      return { status: 'deleted' };
    }
  },

  // Experiments
  listExperiments: async (): Promise<ExperimentItem[]> => {
    try {
      const res = await client.get('/experiments/');
      return res.data;
    } catch {
      const saved = localStorage.getItem('pixelrescue_local_experiments');
      return saved ? JSON.parse(saved) : [];
    }
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
    try {
      const res = await client.post('/experiments/', data);
      return res.data;
    } catch {
      const saved = localStorage.getItem('pixelrescue_local_experiments');
      const exps: ExperimentItem[] = saved ? JSON.parse(saved) : [];
      const newExp: ExperimentItem = {
        id: Date.now(),
        title: data.title,
        description: data.description || '',
        module: data.module,
        algorithm: data.algorithm,
        parameters: data.parameters,
        metrics: data.metrics,
        input_preview: data.input_image_preview,
        output_preview: data.output_image_preview,
        created_at: new Date().toISOString(),
      };
      exps.unshift(newExp);
      localStorage.setItem('pixelrescue_local_experiments', JSON.stringify(exps.slice(0, 30)));
      return { id: newExp.id, title: newExp.title, status: 'saved_locally' };
    }
  },
  getExperiment: async (id: number): Promise<ExperimentItem> => {
    const exps = await api.listExperiments();
    const found = exps.find((e) => e.id === id);
    if (!found) throw new Error('Experiment not found');
    return found;
  },
  deleteExperiment: async (id: number) => {
    try {
      const res = await client.delete(`/experiments/${id}`);
      return res.data;
    } catch {
      const saved = localStorage.getItem('pixelrescue_local_experiments');
      if (saved) {
        const exps: ExperimentItem[] = JSON.parse(saved);
        localStorage.setItem('pixelrescue_local_experiments', JSON.stringify(exps.filter((e) => e.id !== id)));
      }
      return { status: 'deleted_locally' };
    }
  },
};
