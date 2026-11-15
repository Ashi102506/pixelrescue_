"""
Pydantic Request and Response Schemas for PIXELRESCUE API
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class BaseImageRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded data URL or raw string")


class MetadataResponse(BaseModel):
    filename: str
    width: int
    height: int
    channels: int
    color_mode: str
    bit_depth: int
    total_pixels: int
    data_type: str
    file_size_bytes: int
    file_size_formatted: str
    aspect_ratio: str
    statistics: Dict[str, Any]


class PixelInspectRequest(BaseImageRequest):
    x: int
    y: int
    neighborhood_size: int = 3


class SamplingRequest(BaseImageRequest):
    factor: int = Field(4, ge=1, le=64)
    interpolation: str = Field("nearest", pattern="^(nearest|linear)$")


class QuantizationRequest(BaseImageRequest):
    levels: int = Field(8, ge=2, le=256)


class DistanceRequest(BaseModel):
    p1: List[int] = Field(..., min_length=2, max_length=2)
    p2: List[int] = Field(..., min_length=2, max_length=2)
    width: int = 256
    height: int = 256


class ConnectivityRequest(BaseImageRequest):
    seed_x: int
    seed_y: int
    threshold: int = 128


class IntensityTransformRequest(BaseImageRequest):
    operation: str  # negative, log, inv_log, gamma, contrast_stretch, threshold, adaptive_threshold, brightness_contrast
    gamma: float = 1.0
    c_factor: Optional[float] = None
    r1: int = 50
    s1: int = 20
    r2: int = 200
    s2: int = 235
    threshold_val: int = 128
    block_size: int = 11
    c_constant: int = 2
    alpha: float = 1.0
    beta: float = 0.0


class HistogramSpecificationRequest(BaseImageRequest):
    target_type: str = "uniform"  # uniform, gaussian, reference
    reference_image: Optional[str] = None
    gaussian_mean: float = 128.0
    gaussian_std: float = 40.0


class SpatialFilterRequest(BaseImageRequest):
    filter_type: str = "mean"  # mean, weighted_average, gaussian, median, min, max, laplacian, unsharp_masking, high_boost, sobel, sobel_x, sobel_y, prewitt, gradient_magnitude
    kernel_size: int = 3
    sigma: float = 1.0
    k_boost: float = 1.5
    laplacian_mode: str = "8_neighbor"
    padding: str = "reflect"


class SpatialStepRequest(BaseImageRequest):
    x: int
    y: int
    filter_type: str = "mean"
    kernel_size: int = 3
    sigma: float = 1.0


class FrequencyFilterRequest(BaseImageRequest):
    filter_family: str = "butterworth"  # ideal, butterworth, gaussian, notch
    pass_type: str = "lowpass"  # lowpass, highpass
    cutoff: float = 30.0
    order: int = 2
    notch_u0: float = 40.0
    notch_v0: float = 40.0
    notch_d0: float = 10.0


class DegradationRequest(BaseImageRequest):
    blur_type: str = "motion"  # none, motion, gaussian
    blur_kernel_size: int = 11
    motion_angle: float = 45.0
    gaussian_blur_sigma: float = 2.0
    noise_type: str = "gaussian"  # none, gaussian, salt_and_pepper, periodic
    noise_strength: float = 0.02
    seed: int = 42


class RestorationRequest(BaseImageRequest):
    method: str = "wiener"  # arithmetic_mean, geometric_mean, median, wiener, inverse, notch
    kernel_size: int = 5
    wiener_k: float = 0.01
    inverse_cutoff: float = 60.0
    motion_angle: float = 45.0
    notch_u0: float = 30.0
    notch_v0: float = 30.0


class RestorationChallengeRequest(BaseModel):
    image: str
    blur_type: str = "motion"
    blur_kernel_size: int = 11
    motion_angle: float = 45.0
    gaussian_blur_sigma: float = 2.0
    noise_type: str = "gaussian"
    noise_strength: float = 0.02
    seed: int = 42
    rest_method: str = "wiener"
    rest_kernel_size: int = 5
    wiener_k: float = 0.01
    inverse_cutoff: float = 60.0


class ColorAdjustRequest(BaseImageRequest):
    hue_shift_deg: float = 0.0
    saturation_scale: float = 1.0
    intensity_scale: float = 1.0


class PseudoColorRequest(BaseImageRequest):
    colormap_name: str = "jet"
    intensity_slices: int = 8


class QualityMetricsRequest(BaseModel):
    reference_image: str
    target_image: str
    duration_ms: float = 0.0


class PipelineExecuteRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    initial_image: str


class ExperimentCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    module: str
    algorithm: str
    parameters: Dict[str, Any] = {}
    metrics: Optional[Dict[str, Any]] = {}
    input_image_preview: str
    output_image_preview: str


class PipelineSaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    thumbnail: Optional[str] = None
