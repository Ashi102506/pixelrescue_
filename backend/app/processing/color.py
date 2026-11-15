"""
PIXELRESCUE — Module 6: Color Processing Laboratory
Implements mathematically rigorous color transformations:
- RGB <-> CMY conversions
- Exact Gonzalez & Woods RGB <-> HSI forward and inverse transformations
- Color channel decomposition (R, G, B, C, M, Y, H, S, I)
- Color space adjustments: Hue shift, Saturation scaling, Intensity scaling
- Pseudo-Color Processing (Intensity slicing & Scientific colormaps: Jet, Viridis, Plasma, etc.)
"""

import math
from typing import Dict, Any, List, Tuple
import numpy as np
import cv2
from .utils import to_grayscale, image_to_base64


def rgb_to_cmy(img_rgb: np.ndarray) -> np.ndarray:
    """
    Convert RGB image to CMY:
    C = 1 - R, M = 1 - G, Y = 1 - B
    Returns float32 normalized [0, 1] or uint8.
    """
    return 255 - img_rgb


def cmy_to_rgb(img_cmy: np.ndarray) -> np.ndarray:
    """Convert CMY image back to RGB."""
    return 255 - img_cmy


def rgb_to_hsi(img_rgb: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Exact Gonzalez & Woods mathematical formulation of RGB to HSI:
    R, G, B in [0, 1].
    I = 1/3 * (R + G + B)
    S = 1 - 3/(R + G + B) * min(R, G, B)
    theta = arccos( 0.5 * ((R - G) + (R - B)) / sqrt((R - G)^2 + (R - B)(G - B)) )
    H = theta if B <= G else 360 - theta
    Returns H in [0, 360], S in [0, 1], I in [0, 1].
    """
    img_float = img_rgb.astype(np.float64) / 255.0
    R = img_float[:, :, 0]
    G = img_float[:, :, 1]
    B = img_float[:, :, 2]

    # Intensity
    I = (R + G + B) / 3.0

    # Saturation
    sum_rgb = R + G + B
    min_rgb = np.minimum(np.minimum(R, G), B)
    
    # Where sum_rgb == 0, S is 0
    S = np.zeros_like(I)
    nonzero_mask = sum_rgb > 1e-6
    S[nonzero_mask] = 1.0 - (3.0 / sum_rgb[nonzero_mask]) * min_rgb[nonzero_mask]
    S = np.clip(S, 0.0, 1.0)

    # Hue
    num = 0.5 * ((R - G) + (R - B))
    den = np.sqrt((R - G) ** 2 + (R - B) * (G - B)) + 1e-8
    theta_rad = np.arccos(np.clip(num / den, -1.0, 1.0))
    theta_deg = np.rad2deg(theta_rad)

    H = np.where(B <= G, theta_deg, 360.0 - theta_deg)
    # Undefined hue when S == 0 is set to 0
    H[S == 0] = 0.0

    return H, S, I


def hsi_to_rgb(H: np.ndarray, S: np.ndarray, I: np.ndarray) -> np.ndarray:
    """
    Exact Gonzalez & Woods inverse mapping from HSI to RGB:
    H in [0, 360], S in [0, 1], I in [0, 1].
    Returns uint8 RGB array.
    """
    H = np.mod(H, 360.0)
    R = np.zeros_like(H)
    G = np.zeros_like(H)
    B = np.zeros_like(H)

    # Sector 1: 0 <= H < 120 (RG sector)
    mask1 = (H >= 0.0) & (H < 120.0)
    h_rad1 = np.deg2rad(H[mask1])
    b1 = I[mask1] * (1.0 - S[mask1])
    r1 = I[mask1] * (1.0 + (S[mask1] * np.cos(h_rad1)) / (np.cos(np.deg2rad(60.0) - h_rad1) + 1e-8))
    g1 = 3.0 * I[mask1] - (r1 + b1)
    R[mask1], G[mask1], B[mask1] = r1, g1, b1

    # Sector 2: 120 <= H < 240 (GB sector)
    mask2 = (H >= 120.0) & (H < 240.0)
    h_rad2 = np.deg2rad(H[mask2] - 120.0)
    r2 = I[mask2] * (1.0 - S[mask2])
    g2 = I[mask2] * (1.0 + (S[mask2] * np.cos(h_rad2)) / (np.cos(np.deg2rad(60.0) - h_rad2) + 1e-8))
    b2 = 3.0 * I[mask2] - (r2 + g2)
    R[mask2], G[mask2], B[mask2] = r2, g2, b2

    # Sector 3: 240 <= H < 360 (BR sector)
    mask3 = (H >= 240.0) & (H <= 360.0)
    h_rad3 = np.deg2rad(H[mask3] - 240.0)
    g3 = I[mask3] * (1.0 - S[mask3])
    b3 = I[mask3] * (1.0 + (S[mask3] * np.cos(h_rad3)) / (np.cos(np.deg2rad(60.0) - h_rad3) + 1e-8))
    r3 = 3.0 * I[mask3] - (g3 + b3)
    R[mask3], G[mask3], B[mask3] = r3, g3, b3

    rgb = np.stack([R, G, B], axis=-1)
    rgb = np.clip(rgb * 255.0, 0, 255).astype(np.uint8)
    return rgb


def decompose_color_channels(img: np.ndarray) -> Dict[str, Any]:
    """
    Decompose image into:
    - RGB: Red, Green, Blue
    - CMY: Cyan, Magenta, Yellow
    - HSI: Hue, Saturation, Intensity
    """
    if len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] == 1):
        # Grayscale image, promote to RGB
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    h, w = img.shape[:2]
    # RGB channels
    R = img[:, :, 0]
    G = img[:, :, 1]
    B = img[:, :, 2]

    # CMY
    cmy = rgb_to_cmy(img)
    C = cmy[:, :, 0]
    M = cmy[:, :, 1]
    Y = cmy[:, :, 2]

    # HSI
    H_deg, S_norm, I_norm = rgb_to_hsi(img)
    H_vis = (H_deg / 360.0 * 255.0).astype(np.uint8)
    S_vis = (S_norm * 255.0).astype(np.uint8)
    I_vis = (I_norm * 255.0).astype(np.uint8)

    # Colormapped Hue spectrum
    hue_color = cv2.applyColorMap(H_vis, cv2.COLORMAP_HSV)
    hue_color = cv2.cvtColor(hue_color, cv2.COLOR_BGR2RGB)

    return {
        "rgb": {
            "r": image_to_base64(R),
            "g": image_to_base64(G),
            "b": image_to_base64(B),
        },
        "cmy": {
            "c": image_to_base64(C),
            "m": image_to_base64(M),
            "y": image_to_base64(Y),
        },
        "hsi": {
            "h": image_to_base64(H_vis),
            "h_colored": image_to_base64(hue_color),
            "s": image_to_base64(S_vis),
            "i": image_to_base64(I_vis),
        },
        "formulas": {
            "cmy": r"\begin{bmatrix} C \\ M \\ Y \end{bmatrix} = \begin{bmatrix} 1 \\ 1 \\ 1 \end{bmatrix} - \begin{bmatrix} R \\ G \\ B \end{bmatrix}",
            "hsi_i": r"I = \frac{1}{3}(R + G + B)",
            "hsi_s": r"S = 1 - \frac{3}{(R + G + B)} \min(R, G, B)",
            "hsi_h": r"H = \begin{cases} \theta & B \le G \\ 360^\circ - \theta & B > G \end{cases} \quad \theta = \arccos\left( \frac{\frac{1}{2}[(R-G)+(R-B)]}{\sqrt{(R-G)^2 + (R-B)(G-B)}} \right)",
        }
    }


def adjust_hsi_color(
    img: np.ndarray,
    hue_shift_deg: float = 0.0,
    saturation_scale: float = 1.0,
    intensity_scale: float = 1.0
) -> Dict[str, Any]:
    """Adjust image by converting to HSI, altering H/S/I channels, and transforming back."""
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)

    H, S, I = rgb_to_hsi(img)

    # Apply adjustments
    H_new = np.mod(H + hue_shift_deg, 360.0)
    S_new = np.clip(S * saturation_scale, 0.0, 1.0)
    I_new = np.clip(I * intensity_scale, 0.0, 1.0)

    reconstructed_rgb = hsi_to_rgb(H_new, S_new, I_new)

    return {
        "image": image_to_base64(reconstructed_rgb),
        "params": {
            "hue_shift_deg": hue_shift_deg,
            "saturation_scale": saturation_scale,
            "intensity_scale": intensity_scale,
        },
        "formula": r"\tilde{H} = (H + \Delta H) \bmod 360^\circ, \quad \tilde{S} = \text{clip}(S \cdot k_s, 0, 1), \quad \tilde{I} = \text{clip}(I \cdot k_i, 0, 1)",
    }


def apply_pseudocolor(
    img: np.ndarray,
    colormap_name: str = "jet",
    intensity_slices: int = 8
) -> Dict[str, Any]:
    """
    Apply pseudo-color processing (intensity slicing or smooth colormaps) to monochrome image.
    Colormaps: jet, viridis, plasma, inferno, turbo, bone, rainbow, hot.
    """
    gray = to_grayscale(img)
    
    colormaps_map = {
        "jet": cv2.COLORMAP_JET,
        "viridis": cv2.COLORMAP_VIRIDIS,
        "plasma": cv2.COLORMAP_PLASMA,
        "inferno": cv2.COLORMAP_INFERNO,
        "turbo": cv2.COLORMAP_TURBO,
        "bone": cv2.COLORMAP_BONE,
        "rainbow": cv2.COLORMAP_RAINBOW,
        "hot": cv2.COLORMAP_HOT,
    }

    cm_code = colormaps_map.get(colormap_name.lower(), cv2.COLORMAP_JET)
    
    # 1. Continuous colormap
    colored_bgr = cv2.applyColorMap(gray, cm_code)
    colored_rgb = cv2.cvtColor(colored_bgr, cv2.COLOR_BGR2RGB)

    # 2. Discrete Intensity Slicing demonstration
    slices = max(2, min(32, intensity_slices))
    step = 256 // slices
    sliced_gray = (gray // step) * step + (step // 2)
    sliced_bgr = cv2.applyColorMap(sliced_gray.astype(np.uint8), cm_code)
    sliced_rgb = cv2.cvtColor(sliced_bgr, cv2.COLOR_BGR2RGB)

    return {
        "continuous_pseudocolor": image_to_base64(colored_rgb),
        "sliced_pseudocolor": image_to_base64(sliced_rgb),
        "colormap": colormap_name,
        "slices": slices,
        "explanation": "Pseudo-color assigns colors to monochrome intensities according to a defined transformation function or slicing planes.",
        "formula": r"f(x,y) \in [l_k, l_{k+1}) \implies c_k = (R_k, G_k, B_k)",
    }
