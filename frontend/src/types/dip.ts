export type ModuleId =
  | 'dashboard'
  | 'fundamentals'
  | 'enhancement'
  | 'spatial'
  | 'frequency'
  | 'restoration'
  | 'color'
  | 'quality'
  | 'pipeline'
  | 'history';

export interface ImageMetadata {
  filename: string;
  width: number;
  height: number;
  channels: number;
  color_mode: string;
  bit_depth: number;
  total_pixels: number;
  data_type: string;
  file_size_bytes: number;
  file_size_formatted: string;
  aspect_ratio: string;
  statistics: {
    min: number | number[];
    max: number | number[];
    mean: number | number[];
    std: number | number[];
    median?: number;
  };
}

export interface PixelInspection {
  pixel: {
    x: number;
    y: number;
    r: number;
    g: number;
    b: number;
    hex: string;
    normalized_rgb: number[];
    grayscale_equivalent: number;
  };
  neighborhood: {
    size: number;
    center: [number, number];
    matrix: number[][];
  };
}

export interface QualityMetrics {
  mse: number;
  psnr_db: number;
  ssim: number;
  entropy_original: number;
  entropy_processed: number;
  entropy_delta: number;
  histogram_correlation: number;
  histogram_chi_square: number;
  histogram_intersection: number;
  histogram_bhattacharyya: number;
  processing_duration_ms: number;
  error_heatmap: string;
  difference_gray: string;
  formulas: {
    mse: string;
    psnr: string;
    ssim: string;
    entropy: string;
  };
}

export interface HistogramChannelData {
  counts: number[];
  pdf: number[];
  cdf: number[];
}

export interface HistogramData {
  is_color: boolean;
  bins: number[];
  channels: {
    r?: HistogramChannelData;
    g?: HistogramChannelData;
    b?: HistogramChannelData;
    gray: HistogramChannelData;
  };
}

export interface KernelStepData {
  x: number;
  y: number;
  kernel_size: number;
  kernel_matrix: number[][];
  neighborhood_patch: number[][];
  elementwise_product: number[][];
  summation: number;
  resulting_pixel: number;
  step_terms: Array<{
    kernel_weight: number;
    pixel_value: number;
    term_product: number;
    coord: string;
  }>;
  formula: string;
  overlay_image: string;
}

export interface FrequencySpectraResponse {
  panel_1_original: string;
  panel_2_spectrum: string;
  panel_3_filter_mask: string;
  panel_3_filter_colored: string;
  panel_4_reconstructed: string;
  filtered_spectrum: string;
  parameters: {
    family: string;
    pass_type: string;
    cutoff_d0: number;
    order_n: number;
    notch_u0: number;
    notch_v0: number;
    notch_d0: number;
  };
  radial_profile: {
    distances: number[];
    transfer_h: number[];
  };
  formula: string;
  explanation: string;
}

export interface RestorationChallengeResult {
  clean_image: string;
  degraded_image: string;
  restored_image: string;
  metrics_degraded: QualityMetrics;
  metrics_restored: QualityMetrics;
  psnr_improvement_db: number;
  mse_reduction: number;
  ssim_improvement: number;
  degradation_info: any;
  restoration_info: any;
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  metadata: ImageMetadata;
}

export interface ExperimentItem {
  id: number;
  title: string;
  description: string;
  module: string;
  algorithm: string;
  parameters: Record<string, any>;
  metrics: Partial<QualityMetrics>;
  input_preview: string;
  output_preview: string;
  created_at: string;
}
