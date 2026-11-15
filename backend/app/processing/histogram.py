"""
PIXELRESCUE — Histogram Processing Engine
Implements:
- 256-bin Grayscale and RGB Histogram calculation
- Probability Density Function (PDF)
- Cumulative Distribution Function (CDF)
- Mathematical Histogram Equalization: s_k = (L-1) * sum_{j=0}^k p_r(r_j)
- Histogram Specification / Matching (against Uniform, Gaussian, or Reference image)
"""

from typing import Dict, Any, List, Optional
import numpy as np
from .utils import to_grayscale, image_to_base64


def compute_histogram_and_cdf(img: np.ndarray) -> Dict[str, Any]:
    """
    Compute 256-bin histogram, normalized PDF, and CDF.
    Handles grayscale or RGB channels.
    """
    is_color = len(img.shape) == 3 and img.shape[2] >= 3
    
    if is_color:
        channels_data = {}
        for idx, col in enumerate(["r", "g", "b"]):
            chan = img[:, :, idx]
            hist, _ = np.histogram(chan, bins=256, range=(0, 256))
            total_pixels = chan.size
            pdf = hist / total_pixels
            cdf = np.cumsum(pdf)
            channels_data[col] = {
                "counts": hist.tolist(),
                "pdf": [round(float(v), 5) for v in pdf],
                "cdf": [round(float(v), 5) for v in cdf],
            }
        
        # Also compute luminance grayscale histogram
        gray = to_grayscale(img)
        hist_g, _ = np.histogram(gray, bins=256, range=(0, 256))
        pdf_g = hist_g / gray.size
        cdf_g = np.cumsum(pdf_g)
        channels_data["gray"] = {
            "counts": hist_g.tolist(),
            "pdf": [round(float(v), 5) for v in pdf_g],
            "cdf": [round(float(v), 5) for v in cdf_g],
        }

        return {
            "is_color": True,
            "bins": list(range(256)),
            "channels": channels_data,
        }
    else:
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        hist, _ = np.histogram(gray, bins=256, range=(0, 256))
        pdf = hist / gray.size
        cdf = np.cumsum(pdf)
        
        return {
            "is_color": False,
            "bins": list(range(256)),
            "channels": {
                "gray": {
                    "counts": hist.tolist(),
                    "pdf": [round(float(v), 5) for v in pdf],
                    "cdf": [round(float(v), 5) for v in cdf],
                }
            }
        }


def equalize_histogram(img: np.ndarray) -> Dict[str, Any]:
    """
    Perform discrete histogram equalization:
    s_k = round((L - 1) * sum_{j=0}^k (n_j / MN))
    For color images, equalization is performed in the HSV/YCrCb value/luminance channel
    to preserve chromaticity, or per-channel if specified.
    """
    is_color = len(img.shape) == 3 and img.shape[2] >= 3
    L = 256

    if is_color:
        # Equalize in Y channel of YCrCb to prevent color distortion
        import cv2
        ycrcb = cv2.cvtColor(img, cv2.COLOR_RGB2YCrCb)
        y_channel = ycrcb[:, :, 0]
        
        hist, _ = np.histogram(y_channel, bins=256, range=(0, 256))
        pdf = hist / y_channel.size
        cdf = np.cumsum(pdf)
        
        # Lookup table
        lut = np.round((L - 1) * cdf).astype(np.uint8)
        equalized_y = lut[y_channel]
        ycrcb[:, :, 0] = equalized_y
        result = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2RGB)
        
        # Also compute per-channel histogram equalization for comparison
        per_channel = np.zeros_like(img)
        for c in range(3):
            h_c, _ = np.histogram(img[:, :, c], bins=256, range=(0, 256))
            cdf_c = np.cumsum(h_c / img[:, :, c].size)
            lut_c = np.round((L - 1) * cdf_c).astype(np.uint8)
            per_channel[:, :, c] = lut_c[img[:, :, c]]
            
        hist_before = compute_histogram_and_cdf(img)
        hist_after = compute_histogram_and_cdf(result)

        return {
            "image": image_to_base64(result),
            "image_per_channel": image_to_base64(per_channel),
            "lut": lut.tolist(),
            "hist_before": hist_before,
            "hist_after": hist_after,
            "formula": r"s_k = T(r_k) = (L - 1) \sum_{j=0}^{k} p_r(r_j) = \frac{L - 1}{M N} \sum_{j=0}^{k} n_j",
        }
    else:
        gray = img if len(img.shape) == 2 else img[:, :, 0]
        hist, _ = np.histogram(gray, bins=256, range=(0, 256))
        pdf = hist / gray.size
        cdf = np.cumsum(pdf)
        
        lut = np.round((L - 1) * cdf).astype(np.uint8)
        result = lut[gray]
        
        hist_before = compute_histogram_and_cdf(gray)
        hist_after = compute_histogram_and_cdf(result)

        return {
            "image": image_to_base64(result),
            "lut": lut.tolist(),
            "hist_before": hist_before,
            "hist_after": hist_after,
            "formula": r"s_k = T(r_k) = (L - 1) \sum_{j=0}^{k} p_r(r_j) = \frac{L - 1}{M N} \sum_{j=0}^{k} n_j",
        }


def specify_histogram(
    source_img: np.ndarray,
    target_type: str = "uniform",
    reference_img: Optional[np.ndarray] = None,
    gaussian_mean: float = 128.0,
    gaussian_std: float = 40.0
) -> Dict[str, Any]:
    """
    Perform exact Histogram Specification / Matching:
    1. Compute CDF of source image: s = T(r)
    2. Compute CDF of target distribution: v = G(z)
    3. Find inverse mapping z = G^{-1}(s) by finding z such that G(z) is closest to s
    """
    gray_source = to_grayscale(source_img)
    L = 256
    
    # 1. Source CDF: T(r)
    hist_src, _ = np.histogram(gray_source, bins=256, range=(0, 256))
    pdf_src = hist_src / gray_source.size
    cdf_src = np.cumsum(pdf_src)
    s_k = np.round((L - 1) * cdf_src).astype(np.uint8)

    # 2. Target CDF: G(z)
    if target_type == "reference" and reference_img is not None:
        gray_ref = to_grayscale(reference_img)
        hist_target, _ = np.histogram(gray_ref, bins=256, range=(0, 256))
        pdf_target = hist_target / gray_ref.size
        cdf_target = np.cumsum(pdf_target)
    elif target_type == "gaussian":
        bins = np.arange(256)
        gaussian_dist = np.exp(-((bins - gaussian_mean) ** 2) / (2 * (gaussian_std ** 2)))
        pdf_target = gaussian_dist / np.sum(gaussian_dist)
        cdf_target = np.cumsum(pdf_target)
    else:  # Uniform
        pdf_target = np.ones(256) / 256.0
        cdf_target = np.cumsum(pdf_target)

    g_z = np.round((L - 1) * cdf_target).astype(np.uint8)

    # 3. Inverse mapping z = G^{-1}(s)
    # For each s_k[r], find z in 0..255 that minimizes |g_z[z] - s_k[r]|
    lut = np.zeros(256, dtype=np.uint8)
    for r in range(256):
        target_val = s_k[r]
        # Find closest match
        diff = np.abs(g_z.astype(int) - target_val)
        lut[r] = np.argmin(diff)

    matched = lut[gray_source]

    hist_before = compute_histogram_and_cdf(gray_source)
    hist_after = compute_histogram_and_cdf(matched)

    return {
        "image": image_to_base64(matched),
        "target_type": target_type,
        "lut": lut.tolist(),
        "target_cdf": [round(float(v), 5) for v in cdf_target],
        "hist_before": hist_before,
        "hist_after": hist_after,
        "formula": r"z_k = G^{-1}(T(r_k)) \quad \text{where} \quad s = T(r) = (L-1)\int_0^r p_r(w)dw, \quad v = G(z) = (L-1)\int_0^z p_z(w)dw",
    }
