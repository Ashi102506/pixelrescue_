"""
PIXELRESCUE — Module 3: Spatial Filtering & 2D Convolution Engine
Implements mathematically rigorous spatial filtering operations:
- 2D Convolution engine with customizable kernels and boundary padding
- Smoothing filters: Box Mean, Weighted Average, Gaussian Blur, Median, Min, Max
- Sharpening filters: Laplacian, Unsharp Masking, High-Boost
- Edge detectors: Sobel X/Y, Prewitt X/Y, Gradient Magnitude & Direction
- Interactive Kernel Visualizer & Element-Wise Mathematical Step-by-Step Calculator
"""

import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from scipy import signal, ndimage
from .utils import to_grayscale, get_neighborhood, image_to_base64


def create_gaussian_kernel(size: int = 5, sigma: float = 1.0) -> np.ndarray:
    """Generate normalized 2D Gaussian kernel."""
    if size % 2 == 0:
        size += 1
    ax = np.linspace(-(size // 2), size // 2, size)
    xx, yy = np.meshgrid(ax, ax)
    kernel = np.exp(-0.5 * (np.square(xx) + np.square(yy)) / np.square(sigma))
    return kernel / np.sum(kernel)


def apply_spatial_filter(
    img: np.ndarray,
    filter_type: str = "mean",
    kernel_size: int = 3,
    sigma: float = 1.0,
    k_boost: float = 1.5,
    laplacian_mode: str = "8_neighbor",
    padding: str = "reflect"
) -> Dict[str, Any]:
    """
    Apply spatial filter with exact mathematical convolution or rank operations.
    Returns processed image, kernel matrix, formula, and academic explanation.
    """
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel_size = max(3, min(31, kernel_size))
    
    is_color = len(img.shape) == 3 and img.shape[2] >= 3
    pad_mode = "reflect" if padding == "reflect" else ("constant" if padding == "zero" else "edge")

    kernel = None
    formula = ""
    explanation = ""
    extra_data = {}

    if filter_type == "mean":
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32) / (kernel_size * kernel_size)
        formula = r"g(x,y) = \frac{1}{M N} \sum_{s=-a}^{a} \sum_{t=-b}^{b} f(x+s, y+t)"
        explanation = f"Standard Box Mean filter of size {kernel_size}x{kernel_size}. Replaces center pixel with neighborhood arithmetic mean."
        if is_color:
            result = cv2.blur(img, (kernel_size, kernel_size), borderType=cv2.BORDER_REFLECT)
        else:
            result = cv2.blur(img, (kernel_size, kernel_size), borderType=cv2.BORDER_REFLECT)

    elif filter_type == "weighted_average":
        # 3x3 or 5x5 Gaussian-like integer weighted kernel
        if kernel_size == 3:
            raw_k = np.array([
                [1, 2, 1],
                [2, 4, 2],
                [1, 2, 1]
            ], dtype=np.float32)
            kernel = raw_k / 16.0
        else:
            kernel = create_gaussian_kernel(kernel_size, sigma=1.2)
        formula = r"g(x,y) = \frac{\sum_{s=-a}^a \sum_{t=-b}^b w(s,t) f(x+s, y+t)}{\sum_{s=-a}^a \sum_{t=-b}^b w(s,t)}"
        explanation = "Weighted averaging gives higher weight to center pixels, reducing blurring of fine edges compared to uniform mean."
        if is_color:
            result = cv2.filter2D(img, -1, kernel, borderType=cv2.BORDER_REFLECT)
        else:
            result = cv2.filter2D(img, -1, kernel, borderType=cv2.BORDER_REFLECT)

    elif filter_type == "gaussian":
        kernel = create_gaussian_kernel(kernel_size, sigma)
        formula = rf"G(x,y) = \frac{{1}}{{2\pi\sigma^2}} e^{{-\frac{{x^2 + y^2}}{{2\sigma^2}}}} \quad (\sigma={sigma})"
        explanation = f"Isotropic 2D Gaussian smoothing filter with standard deviation sigma={sigma}. Perfectly circular symmetric frequency response."
        if is_color:
            result = cv2.GaussianBlur(img, (kernel_size, kernel_size), sigmaX=sigma, borderType=cv2.BORDER_REFLECT)
        else:
            result = cv2.GaussianBlur(img, (kernel_size, kernel_size), sigmaX=sigma, borderType=cv2.BORDER_REFLECT)

    elif filter_type == "median":
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32)  # for display
        formula = r"g(x,y) = \text{median}\{f(x+s, y+t) \mid (s,t) \in S_{xy}\}"
        explanation = "Nonlinear order-statistic filter. Highly effective at removing salt-and-pepper / impulse noise while preserving sharp boundaries."
        if is_color:
            result = cv2.medianBlur(img, kernel_size)
        else:
            result = cv2.medianBlur(img, kernel_size)

    elif filter_type == "min":
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32)
        formula = r"g(x,y) = \min_{(s,t) \in S_{xy}} \{f(x+s, y+t)\}"
        explanation = "0th percentile rank filter (grayscale erosion). Expands dark structures and removes salt noise."
        if is_color:
            result = cv2.erode(img, np.ones((kernel_size, kernel_size), np.uint8))
        else:
            result = cv2.erode(img, np.ones((kernel_size, kernel_size), np.uint8))

    elif filter_type == "max":
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32)
        formula = r"g(x,y) = \max_{(s,t) \in S_{xy}} \{f(x+s, y+t)\}"
        explanation = "100th percentile rank filter (grayscale dilation). Expands bright structures and removes pepper noise."
        if is_color:
            result = cv2.dilate(img, np.ones((kernel_size, kernel_size), np.uint8))
        else:
            result = cv2.dilate(img, np.ones((kernel_size, kernel_size), np.uint8))

    elif filter_type == "laplacian":
        if laplacian_mode == "4_neighbor":
            kernel = np.array([
                [0,  1, 0],
                [1, -4, 1],
                [0,  1, 0]
            ], dtype=np.float32)
            formula = r"\nabla^2 f = \frac{\partial^2 f}{\partial x^2} + \frac{\partial^2 f}{\partial y^2} \approx [f(x+1,y)+f(x-1,y)+f(x,y+1)+f(x,y-1)] - 4f(x,y)"
        else:  # 8-neighbor
            kernel = np.array([
                [1,  1, 1],
                [1, -8, 1],
                [1,  1, 1]
            ], dtype=np.float32)
            formula = r"\nabla^2 f = [f(x+1,y)+...+f(x-1,y-1)] - 8f(x,y)"
        
        explanation = "Second-order isotropic derivative operator highlighting rapid intensity transitions (discontinuities)."
        
        # Compute laplacian on float32 to avoid negative overflow
        gray = to_grayscale(img).astype(np.float32)
        lap = cv2.filter2D(gray, cv2.CV_32F, kernel, borderType=cv2.BORDER_REFLECT)
        
        # In Gonzalez & Woods, sharpened image = f(x,y) - c * Laplacian when center is negative
        sharpened = gray - lap
        sharpened = np.clip(sharpened, 0, 255).astype(np.uint8)
        
        # Raw laplacian normalized for display (zero maps to 128)
        lap_display = np.clip(lap + 128.0, 0, 255).astype(np.uint8)
        
        extra_data["laplacian_raw"] = image_to_base64(lap_display)
        result = sharpened if not is_color else cv2.cvtColor(sharpened, cv2.COLOR_GRAY2RGB)

    elif filter_type == "unsharp_masking" or filter_type == "high_boost":
        k = 1.0 if filter_type == "unsharp_masking" else float(k_boost)
        formula = rf"g(x,y) = f(x,y) + k \cdot g_{{mask}}(x,y) \quad \text{{where}} \quad g_{{mask}} = f(x,y) - \bar{{f}}(x,y) \quad (k={k})"
        explanation = f"Unsharp Masking (k=1) or High-Boost Filtering (k={k}). Subtracts blurred image to generate high-pass detail mask, then scales back to enhance fine edges."
        
        img_float = img.astype(np.float32)
        blurred = cv2.GaussianBlur(img_float, (kernel_size, kernel_size), sigmaX=sigma, borderType=cv2.BORDER_REFLECT)
        mask = img_float - blurred
        boosted = img_float + k * mask
        result = np.clip(boosted, 0, 255).astype(np.uint8)
        
        mask_display = np.clip(mask + 128.0, 0, 255).astype(np.uint8)
        extra_data["unsharp_mask"] = image_to_base64(mask_display)
        kernel = create_gaussian_kernel(kernel_size, sigma)

    elif filter_type in ("sobel", "sobel_x", "sobel_y", "prewitt", "prewitt_x", "prewitt_y", "gradient_magnitude"):
        gray = to_grayscale(img).astype(np.float32)
        
        if "prewitt" in filter_type:
            kx = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)
            ky = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)
            op_name = "Prewitt"
        else:
            kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
            ky = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
            op_name = "Sobel"

        gx = cv2.filter2D(gray, cv2.CV_32F, kx, borderType=cv2.BORDER_REFLECT)
        gy = cv2.filter2D(gray, cv2.CV_32F, ky, borderType=cv2.BORDER_REFLECT)
        mag = np.sqrt(gx**2 + gy**2)
        direction = np.arctan2(gy, gx) * (180.0 / np.pi)

        if filter_type.endswith("_x"):
            kernel = kx
            result = np.clip(np.abs(gx), 0, 255).astype(np.uint8)
            formula = r"G_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix} * f" if op_name == "Sobel" else r"G_x = \begin{bmatrix} -1 & 0 & 1 \\ -1 & 0 & 1 \\ -1 & 0 & 1 \end{bmatrix} * f"
            explanation = f"{op_name} X-derivative detects vertical edges."
        elif filter_type.endswith("_y"):
            kernel = ky
            result = np.clip(np.abs(gy), 0, 255).astype(np.uint8)
            formula = r"G_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix} * f" if op_name == "Sobel" else r"G_y = \begin{bmatrix} -1 & -1 & -1 \\ 0 & 0 & 0 \\ 1 & 1 & 1 \end{bmatrix} * f"
            explanation = f"{op_name} Y-derivative detects horizontal edges."
        else:  # Magnitude
            kernel = kx
            result = np.clip(mag, 0, 255).astype(np.uint8)
            formula = r"M(x,y) = \sqrt{G_x^2 + G_y^2} \quad \alpha(x,y) = \arctan\left(\frac{G_y}{G_x}\right)"
            explanation = f"{op_name} Gradient Magnitude measures the total rate of spatial intensity change."

        extra_data["gx"] = image_to_base64(np.clip(np.abs(gx), 0, 255).astype(np.uint8))
        extra_data["gy"] = image_to_base64(np.clip(np.abs(gy), 0, 255).astype(np.uint8))

    else:
        # Default fallback
        result = img
        kernel = np.array([[0, 0, 0], [0, 1, 0], [0, 0, 0]], dtype=np.float32)
        formula = "Identity"
        explanation = "Pass-through."

    return {
        "image": image_to_base64(result),
        "kernel": [[round(float(v), 4) for v in row] for row in kernel] if kernel is not None else [],
        "kernel_size": kernel.shape[0] if kernel is not None else 3,
        "formula": formula,
        "explanation": explanation,
        "extra": extra_data,
    }


def compute_kernel_math_step(
    img: np.ndarray,
    x: int,
    y: int,
    filter_type: str = "mean",
    kernel_size: int = 3,
    sigma: float = 1.0
) -> Dict[str, Any]:
    """
    Step-by-step element-wise convolution calculation at a specific pixel (x, y):
    1. Extract neighborhood patch P of image
    2. Retrieve kernel W
    3. Element-wise product: Product = W .* P
    4. Summation: Sum = sum(Product)
    5. Resulting pixel value g(x, y) = clip(round(Sum), 0, 255)
    6. Generate highlighting overlay image showing the neighborhood box.
    """
    gray = to_grayscale(img)
    h, w = gray.shape
    x = max(0, min(w - 1, int(x)))
    y = max(0, min(h - 1, int(y)))
    
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel_size = max(3, min(9, kernel_size))
    
    # Retrieve kernel
    if filter_type == "mean":
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32) / (kernel_size * kernel_size)
    elif filter_type == "gaussian":
        kernel = create_gaussian_kernel(kernel_size, sigma)
    elif filter_type == "weighted_average":
        raw = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]], dtype=np.float32)
        kernel = raw / 16.0
    elif filter_type == "sobel_x":
        kernel = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
    elif filter_type == "sobel_y":
        kernel = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
    elif filter_type == "laplacian":
        kernel = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
    else:
        kernel = np.ones((kernel_size, kernel_size), dtype=np.float32) / (kernel_size * kernel_size)

    k_h, k_w = kernel.shape
    pad = k_h // 2
    
    # Extract neighborhood
    patch = get_neighborhood(gray, x, y, k_h).astype(np.float32)
    
    # Element-wise product
    prod = kernel * patch
    total_sum = float(np.sum(prod))
    final_val = int(np.clip(round(total_sum), 0, 255))

    # Visual overlay marking target pixel and neighborhood box
    vis = cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)
    top_left = (max(0, x - pad), max(0, y - pad))
    bottom_right = (min(w - 1, x + pad), min(h - 1, y + pad))
    
    # Highlight neighborhood in cyan
    cv2.rectangle(vis, top_left, bottom_right, (0, 240, 240), 2)
    # Center pixel in bright magenta
    cv2.circle(vis, (x, y), 3, (255, 0, 200), -1)

    # Detailed multiplication steps representation
    step_terms = []
    for r in range(k_h):
        for c in range(k_w):
            w_val = float(kernel[r, c])
            f_val = float(patch[r, c])
            p_val = float(prod[r, c])
            step_terms.append({
                "kernel_weight": round(w_val, 4),
                "pixel_value": int(f_val),
                "term_product": round(p_val, 4),
                "coord": f"({r - pad}, {c - pad})",
            })

    return {
        "x": x,
        "y": y,
        "kernel_size": k_h,
        "kernel_matrix": [[round(float(v), 4) for v in row] for row in kernel],
        "neighborhood_patch": [[int(v) for v in row] for row in patch],
        "elementwise_product": [[round(float(v), 4) for v in row] for row in prod],
        "summation": round(total_sum, 4),
        "resulting_pixel": final_val,
        "step_terms": step_terms,
        "formula": r"g(x,y) = \sum_{s=-a}^a \sum_{t=-b}^b w(s,t) \cdot f(x+s, y+t)",
        "overlay_image": image_to_base64(vis),
    }
