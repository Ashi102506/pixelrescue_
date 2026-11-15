"""
PIXELRESCUE — Module 7: Image Quality Analysis Engine
Implements mathematically rigorous objective image quality metrics:
- Mean Squared Error (MSE)
- Peak Signal-to-Noise Ratio (PSNR)
- Structural Similarity Index Measure (SSIM)
- Shannon Information Entropy (bits/pixel)
- Histogram Statistical Distance (Correlation, Chi-Square, Intersection, Bhattacharyya)
- Absolute Error Heatmap Visualization
"""

import math
from typing import Dict, Any, Tuple
import numpy as np
import cv2
from skimage.metrics import structural_similarity as ssim_fn
from .utils import to_grayscale, image_to_base64


def calculate_entropy(img: np.ndarray) -> float:
    """
    Calculate Shannon information entropy:
    H = - sum_{i=0}^{255} p(i) * log2(p(i))
    """
    gray = to_grayscale(img)
    hist, _ = np.histogram(gray, bins=256, range=(0, 256))
    pdf = hist / float(gray.size)
    # Filter out zero probabilities to avoid log2(0)
    pdf_nonzero = pdf[pdf > 0]
    entropy = -np.sum(pdf_nonzero * np.log2(pdf_nonzero))
    return float(round(entropy, 4))


def calculate_quality_metrics(
    img_ref: np.ndarray,
    img_comp: np.ndarray,
    duration_ms: float = 0.0
) -> Dict[str, Any]:
    """
    Calculate full comparative image quality metrics between reference (original)
    and target (processed) image.
    """
    # Ensure same dimensions
    h_ref, w_ref = img_ref.shape[:2]
    h_comp, w_comp = img_comp.shape[:2]

    if (h_ref, w_ref) != (h_comp, w_comp):
        img_comp = cv2.resize(img_comp, (w_ref, h_ref), interpolation=cv2.INTER_LINEAR)

    gray_ref = to_grayscale(img_ref)
    gray_comp = to_grayscale(img_comp)

    # 1. MSE
    diff = gray_ref.astype(np.float64) - gray_comp.astype(np.float64)
    mse = float(np.mean(diff ** 2))

    # 2. PSNR
    if mse < 1e-10:
        psnr = 100.0  # Identical images
    else:
        psnr = float(10.0 * math.log10((255.0 ** 2) / mse))

    # 3. SSIM (Structural Similarity Index)
    ssim_val, ssim_map = ssim_fn(gray_ref, gray_comp, full=True)
    ssim_score = float(ssim_val)

    # 4. Entropy
    entropy_ref = calculate_entropy(gray_ref)
    entropy_comp = calculate_entropy(gray_comp)

    # 5. Histogram Distances
    hist_ref = cv2.calcHist([gray_ref], [0], None, [256], [0, 256])
    hist_comp = cv2.calcHist([gray_comp], [0], None, [256], [0, 256])
    cv2.normalize(hist_ref, hist_ref, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist_comp, hist_comp, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

    hist_corr = float(cv2.compareHist(hist_ref, hist_comp, cv2.HISTCMP_CORREL))
    hist_chi = float(cv2.compareHist(hist_ref, hist_comp, cv2.HISTCMP_CHISQR))
    hist_intersect = float(cv2.compareHist(hist_ref, hist_comp, cv2.HISTCMP_INTERSECT))
    hist_bhatt = float(cv2.compareHist(hist_ref, hist_comp, cv2.HISTCMP_BHATTACHARYYA))

    # 6. Error Heatmap
    abs_diff = np.abs(diff).astype(np.uint8)
    heatmap_bgr = cv2.applyColorMap(abs_diff, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    return {
        "mse": round(mse, 4),
        "psnr_db": round(psnr, 2),
        "ssim": round(ssim_score, 4),
        "entropy_original": entropy_ref,
        "entropy_processed": entropy_comp,
        "entropy_delta": round(entropy_comp - entropy_ref, 4),
        "histogram_correlation": round(hist_corr, 4),
        "histogram_chi_square": round(hist_chi, 4),
        "histogram_intersection": round(hist_intersect, 4),
        "histogram_bhattacharyya": round(hist_bhatt, 4),
        "processing_duration_ms": round(duration_ms, 2),
        "error_heatmap": image_to_base64(heatmap_rgb),
        "difference_gray": image_to_base64(abs_diff),
        "formulas": {
            "mse": r"\text{MSE} = \frac{1}{MN} \sum_{x=0}^{M-1} \sum_{y=0}^{N-1} [I_1(x,y) - I_2(x,y)]^2",
            "psnr": r"\text{PSNR} = 10 \cdot \log_{10}\left( \frac{255^2}{\text{MSE}} \right) \text{ dB}",
            "ssim": r"\text{SSIM}(x,y) = \frac{(2\mu_x\mu_y + c_1)(2\sigma_{xy} + c_2)}{(\mu_x^2 + \mu_y^2 + c_1)(\sigma_x^2 + \sigma_y^2 + c_2)}",
            "entropy": r"H = -\sum_{i=0}^{255} p(i) \log_2 p(i)",
        }
    }
