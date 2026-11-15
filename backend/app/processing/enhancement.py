r"""
PIXELRESCUE — Module 2: Spatial Domain Intensity Transformation Engine
Implements mathematically rigorous point processing algorithms:
- Image Negative: s = (L - 1) - r
- Logarithmic Transformation: s = c * ln(1 + r)
- Inverse Logarithmic / Exponential: s = c * ((1+a)^r - 1)
- Power-Law / Gamma Transformation: s = c * r^\gamma
- Piecewise Linear & Contrast Stretching: [r1, s1] -> [r2, s2]
- Thresholding: Binary & Adaptive (Otsu & Local Mean)
- Real-time Brightness & Contrast: s = alpha * r + beta
"""

from typing import Dict, Any, List, Optional
import numpy as np
import cv2
from .utils import to_grayscale, image_to_base64


def image_negative(img: np.ndarray) -> Dict[str, Any]:
    """Compute mathematical negative: s = 255 - r."""
    result = 255 - img
    return {
        "image": image_to_base64(result),
        "formula": r"s = L - 1 - r \quad (L = 256)",
        "explanation": "Inverts pixel intensities: black becomes white, white becomes black.",
        "params": {"L": 256},
    }


def log_transform(img: np.ndarray, c_factor: Optional[float] = None) -> Dict[str, Any]:
    """
    Logarithmic transformation: s = c * ln(1 + r)
    Dynamically compresses high-range pixel values, expanding dark regions.
    """
    r_float = img.astype(np.float32)
    max_r = np.max(r_float)
    if max_r == 0:
        c = 1.0
    else:
        c = c_factor if c_factor is not None else (255.0 / np.log(1.0 + max_r))
        
    result = c * np.log(1.0 + r_float)
    result = np.clip(result, 0, 255).astype(np.uint8)
    
    return {
        "image": image_to_base64(result),
        "formula": r"s = c \cdot \ln(1 + r) \quad \text{where} \quad c = \frac{255}{\ln(1 + \max(r))}",
        "explanation": "Expands dark pixel intensities while compressing higher intensity values (e.g. ideal for displaying Fourier spectrums).",
        "params": {"c": round(float(c), 3), "max_input_intensity": float(max_r)},
    }


def inv_log_transform(img: np.ndarray, base_factor: float = 1.0) -> Dict[str, Any]:
    """
    Inverse log / Exponential transformation: s = 255 * (e^(r/255 * k) - 1) / (e^k - 1)
    Compresses dark regions and expands bright regions.
    """
    r_norm = img.astype(np.float32) / 255.0
    k = max(0.1, min(5.0, base_factor))
    result = 255.0 * (np.exp(r_norm * k) - 1.0) / (np.exp(k) - 1.0)
    result = np.clip(result, 0, 255).astype(np.uint8)
    
    return {
        "image": image_to_base64(result),
        "formula": r"s = \frac{255}{e^k - 1} \left( e^{k \cdot \frac{r}{255}} - 1 \right)",
        "explanation": "Inverse of logarithmic mapping: expands the bright intensity values while compressing dark values.",
        "params": {"k": round(float(k), 2)},
    }


def gamma_transform(img: np.ndarray, gamma: float = 1.0, c: float = 1.0) -> Dict[str, Any]:
    r"""
    Power-Law / Gamma Transformation: s = c * r^\gamma
    Gamma < 1 expands dark details; Gamma > 1 darkens and enhances highlights.
    """
    gamma = max(0.01, float(gamma))
    # Normalized power-law
    r_norm = img.astype(np.float32) / 255.0
    result = c * (r_norm ** gamma) * 255.0
    result = np.clip(result, 0, 255).astype(np.uint8)
    
    return {
        "image": image_to_base64(result),
        "formula": r"s = c \cdot r^\gamma \quad \left( s = 255 \cdot c \left( \frac{r}{255} \right)^\gamma \right)",
        "explanation": "Gamma < 1 brightens image by mapping a narrow range of dark input values into a wider range of output values. Gamma > 1 has opposite effect.",
        "params": {"gamma": gamma, "c": c},
    }


def contrast_stretching(
    img: np.ndarray,
    r1: int = 50,
    s1: int = 20,
    r2: int = 200,
    s2: int = 235
) -> Dict[str, Any]:
    """
    Piecewise linear contrast stretching:
    Linear segments:
    0 <= r < r1: s = (s1 / r1) * r
    r1 <= r < r2: s = ((s2 - s1) / (r2 - r1)) * (r - r1) + s1
    r2 <= r <= 255: s = ((255 - s2) / (255 - r2)) * (r - r2) + s2
    """
    r1 = max(1, min(254, r1))
    r2 = max(r1 + 1, min(255, r2))
    s1 = max(0, min(255, s1))
    s2 = max(0, min(255, s2))

    # Precalculate LUT (Lookup Table) for speed and exactness
    lut = np.zeros(256, dtype=np.uint8)
    for r in range(256):
        if r < r1:
            val = (s1 / float(r1)) * r
        elif r <= r2:
            val = ((s2 - s1) / float(r2 - r1)) * (r - r1) + s1
        else:
            val = ((255 - s2) / float(255 - r2)) * (r - r2) + s2
        lut[r] = np.clip(round(val), 0, 255)

    result = lut[img]
    
    return {
        "image": image_to_base64(result),
        "lut": lut.tolist(),
        "formula": r"s = \begin{cases} \frac{s_1}{r_1} r & 0 \le r < r_1 \\ \frac{s_2 - s_1}{r_2 - r_1}(r - r_1) + s_1 & r_1 \le r \le r_2 \\ \frac{255 - s_2}{255 - r_2}(r - r_2) + s_2 & r_2 < r \le 255 \end{cases}",
        "explanation": "Expands the dynamic range of grey levels in the image being processed between (r1, s1) and (r2, s2).",
        "params": {"r1": r1, "s1": s1, "r2": r2, "s2": s2},
    }


def binary_threshold(img: np.ndarray, threshold: int = 128) -> Dict[str, Any]:
    """Binary thresholding: s = 255 if r >= T else 0."""
    gray = to_grayscale(img)
    threshold = max(0, min(255, threshold))
    result = np.where(gray >= threshold, 255, 0).astype(np.uint8)
    
    return {
        "image": image_to_base64(result),
        "formula": r"s = \begin{cases} 255 & \text{if } r \ge T \\ 0 & \text{if } r < T \end{cases}",
        "explanation": "Segments the image into foreground and background based on global intensity threshold T.",
        "params": {"threshold": threshold},
    }


def adaptive_threshold(
    img: np.ndarray,
    block_size: int = 11,
    c_constant: int = 2,
    method: str = "mean"
) -> Dict[str, Any]:
    """
    Adaptive local thresholding (Local Mean or Gaussian).
    Block size must be an odd integer >= 3.
    """
    gray = to_grayscale(img)
    if block_size % 2 == 0:
        block_size += 1
    block_size = max(3, min(99, block_size))
    
    adapt_type = cv2.ADAPTIVE_THRESH_MEAN_C if method == "mean" else cv2.ADAPTIVE_THRESH_GAUSSIAN_C
    result = cv2.adaptiveThreshold(
        gray, 255, adapt_type, cv2.THRESH_BINARY, block_size, c_constant
    )

    return {
        "image": image_to_base64(result),
        "formula": r"T(x,y) = \mu_{N}(x,y) - C \quad \text{where} \quad s(x,y) = \begin{cases} 255 & f(x,y) > T(x,y) \\ 0 & \text{otherwise} \end{cases}",
        "explanation": "Calculates threshold for each pixel based on the mean or weighted Gaussian average in an N x N neighborhood minus constant C.",
        "params": {"block_size": block_size, "c_constant": c_constant, "method": method},
    }


def adjust_brightness_contrast(img: np.ndarray, alpha: float = 1.0, beta: float = 0.0) -> Dict[str, Any]:
    """
    Linear brightness and contrast adjustment:
    s = alpha * r + beta
    alpha: contrast factor (1.0 = normal, >1.0 higher contrast, <1.0 lower)
    beta: brightness shift (-128 to 128)
    """
    result = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)
    return {
        "image": image_to_base64(result),
        "formula": r"s(x,y) = \alpha \cdot r(x,y) + \beta",
        "explanation": "Scales intensity range by contrast slope alpha and offsets by brightness value beta.",
        "params": {"alpha": alpha, "beta": beta},
    }
