"""
PIXELRESCUE — Module 1: Image Fundamentals Processing Engine
Implements mathematically rigorous operations for:
- Metadata extraction & intensity statistics
- Pixel inspection & neighborhood analysis
- RGB channel decomposition
- Grayscale conversions
- Spatial sampling reduction & interpolation
- Intensity quantization (false contouring analysis)
- 4-neighbor, 8-neighbor & m-connectivity
- Pixel distance metrics (Euclidean, City-block D4, Chessboard D8)
"""

import math
from typing import Dict, Any, List, Tuple
import numpy as np
import cv2
from PIL import Image
from .utils import to_grayscale, get_neighborhood, image_to_base64


def extract_metadata(img: np.ndarray, file_size_bytes: int = 0, filename: str = "image.png") -> Dict[str, Any]:
    """Extract comprehensive dimensional, color, and statistical metadata."""
    h, w = img.shape[:2]
    channels = 1 if len(img.shape) == 2 else img.shape[2]
    dtype_str = str(img.dtype)
    bit_depth = 8 if img.dtype == np.uint8 else 16
    
    # Statistical analysis
    if channels == 1:
        color_mode = "Grayscale"
        stats = {
            "min": int(np.min(img)),
            "max": int(np.max(img)),
            "mean": round(float(np.mean(img)), 2),
            "std": round(float(np.std(img)), 2),
            "median": int(np.median(img)),
        }
    else:
        color_mode = "RGB" if channels == 3 else "RGBA"
        stats = {
            "min": [int(np.min(img[:, :, i])) for i in range(channels)],
            "max": [int(np.max(img[:, :, i])) for i in range(channels)],
            "mean": [round(float(np.mean(img[:, :, i])), 2) for i in range(channels)],
            "std": [round(float(np.std(img[:, :, i])), 2) for i in range(channels)],
        }

    return {
        "filename": filename,
        "width": w,
        "height": h,
        "channels": channels,
        "color_mode": color_mode,
        "bit_depth": bit_depth,
        "total_pixels": w * h,
        "data_type": dtype_str,
        "file_size_bytes": file_size_bytes or (w * h * channels),
        "file_size_formatted": f"{(file_size_bytes or (w * h * channels)) / 1024:.1f} KB",
        "aspect_ratio": f"{w}:{h}" if math.gcd(w, h) == 0 else f"{w // math.gcd(w, h)}:{h // math.gcd(w, h)}",
        "statistics": stats,
    }


def inspect_pixel(img: np.ndarray, x: int, y: int, neighborhood_size: int = 3) -> Dict[str, Any]:
    """Inspect exact pixel value, coordinates, normalized values, and local neighborhood."""
    h, w = img.shape[:2]
    x = max(0, min(w - 1, int(x)))
    y = max(0, min(h - 1, int(y)))
    
    is_color = len(img.shape) == 3 and img.shape[2] >= 3
    
    if is_color:
        r, g, b = int(img[y, x, 0]), int(img[y, x, 1]), int(img[y, x, 2])
        # Luminance
        gray_val = int(round(0.299 * r + 0.587 * g + 0.114 * b))
        pixel_data = {
            "x": x,
            "y": y,
            "r": r,
            "g": g,
            "b": b,
            "hex": f"#{r:02x}{g:02x}{b:02x}",
            "normalized_rgb": [round(r / 255.0, 3), round(g / 255.0, 3), round(b / 255.0, 3)],
            "grayscale_equivalent": gray_val,
        }
        patch = get_neighborhood(to_grayscale(img), x, y, neighborhood_size)
    else:
        gray_val = int(img[y, x])
        pixel_data = {
            "x": x,
            "y": y,
            "r": gray_val,
            "g": gray_val,
            "b": gray_val,
            "hex": f"#{gray_val:02x}{gray_val:02x}{gray_val:02x}",
            "normalized_rgb": [round(gray_val / 255.0, 3)] * 3,
            "grayscale_equivalent": gray_val,
        }
        patch = get_neighborhood(img, x, y, neighborhood_size)

    neighborhood_matrix = patch.tolist()
    
    return {
        "pixel": pixel_data,
        "neighborhood": {
            "size": neighborhood_size,
            "center": (neighborhood_size // 2, neighborhood_size // 2),
            "matrix": neighborhood_matrix,
        }
    }


def separate_channels(img: np.ndarray) -> Dict[str, str]:
    """Separate RGB image into R, G, B channels, rendered as isolated color and grayscale."""
    if len(img.shape) == 2:
        # Grayscale image, duplicate to 3 identical channels
        b64 = image_to_base64(img)
        return {"r": b64, "g": b64, "b": b64, "r_gray": b64, "g_gray": b64, "b_gray": b64}

    h, w = img.shape[:2]
    r_chan = img[:, :, 0]
    g_chan = img[:, :, 1]
    b_chan = img[:, :, 2]

    # Colorized channels (e.g. Red channel shows in red only)
    r_color = np.zeros((h, w, 3), dtype=np.uint8)
    r_color[:, :, 0] = r_chan
    
    g_color = np.zeros((h, w, 3), dtype=np.uint8)
    g_color[:, :, 1] = g_chan
    
    b_color = np.zeros((h, w, 3), dtype=np.uint8)
    b_color[:, :, 2] = b_chan

    return {
        "r": image_to_base64(r_color),
        "g": image_to_base64(g_color),
        "b": image_to_base64(b_color),
        "r_gray": image_to_base64(r_chan),
        "g_gray": image_to_base64(g_chan),
        "b_gray": image_to_base64(b_chan),
    }


def convert_grayscale(img: np.ndarray, method: str = "luminance") -> Tuple[np.ndarray, str]:
    """Convert image to grayscale with chosen method."""
    gray = to_grayscale(img, method)
    return gray, image_to_base64(gray)


def simulate_sampling(img: np.ndarray, factor: int = 4, interpolation: str = "nearest") -> Tuple[np.ndarray, str]:
    """
    Demonstrate spatial sampling reduction.
    Downsamples image by `factor`, then upscales back using nearest/bilinear interpolation
    to clearly show pixelation and loss of spatial resolution.
    """
    factor = max(1, min(64, factor))
    h, w = img.shape[:2]
    down_w = max(1, w // factor)
    down_h = max(1, h // factor)

    interp_flag = cv2.INTER_NEAREST if interpolation == "nearest" else cv2.INTER_LINEAR
    
    # Downsample
    small = cv2.resize(img, (down_w, down_h), interpolation=interp_flag)
    # Upsample back for direct visual comparison
    reconstructed = cv2.resize(small, (w, h), interpolation=interp_flag)

    return reconstructed, image_to_base64(reconstructed)


def simulate_quantization(img: np.ndarray, levels: int = 8) -> Tuple[np.ndarray, str]:
    """
    Demonstrate intensity quantization reduction (false contouring).
    Reduces continuous intensity (256 levels) to discrete `levels` (2 <= levels <= 256).
    Formula: q = floor(r * levels / 256) * (255 / (levels - 1))
    """
    levels = max(2, min(256, int(levels)))
    img_float = img.astype(np.float32)
    
    step = 256.0 / levels
    quantized_indices = np.floor(img_float / step)
    quantized_indices = np.clip(quantized_indices, 0, levels - 1)
    
    # Map back to 0..255 range
    scale = 255.0 / (levels - 1)
    quantized = np.round(quantized_indices * scale).astype(np.uint8)

    return quantized, image_to_base64(quantized)


def calculate_pixel_distances(p1: Tuple[int, int], p2: Tuple[int, int], img_shape: Tuple[int, int]) -> Dict[str, Any]:
    """
    Calculate Euclidean, City-block (D4 / Manhattan), and Chessboard (D8) distances.
    Also produces an overlay graphic highlighting the points and connection.
    """
    x1, y1 = p1
    x2, y2 = p2
    
    dx = abs(x1 - x2)
    dy = abs(y1 - y2)

    # 1. Euclidean distance: sqrt((x1-x2)^2 + (y1-y2)^2)
    d_euclidean = math.sqrt(dx ** 2 + dy ** 2)
    
    # 2. City-block / Manhattan distance: D4 = |x1-x2| + |y1-y2|
    d_cityblock = dx + dy
    
    # 3. Chessboard distance: D8 = max(|x1-x2|, |y1-y2|)
    d_chessboard = max(dx, dy)

    # Create visualization canvas
    h, w = img_shape[:2]
    vis = np.zeros((h, w, 3), dtype=np.uint8) + 20  # dark graphite background
    
    # Draw grid lines subtly
    step = max(16, min(h, w) // 16)
    for gy in range(0, h, step):
        cv2.line(vis, (0, gy), (w, gy), (40, 40, 50), 1)
    for gx in range(0, w, step):
        cv2.line(vis, (gx, 0), (gx, h), (40, 40, 50), 1)

    # Draw City-block path (L-shaped path: cyan)
    cv2.line(vis, (x1, y1), (x2, y1), (0, 230, 230), 2)
    cv2.line(vis, (x2, y1), (x2, y2), (0, 230, 230), 2)

    # Draw Euclidean line (Direct diagonal line: electric violet)
    cv2.line(vis, (x1, y1), (x2, y2), (180, 80, 255), 2)

    # Draw Chessboard bounding box (dash-like / amber box)
    box_min_x, box_max_x = min(x1, x2), max(x1, x2)
    box_min_y, box_max_y = min(y1, y2), max(y1, y2)
    cv2.rectangle(vis, (box_min_x, box_min_y), (box_max_x, box_max_y), (255, 180, 50), 1)

    # Mark points
    cv2.circle(vis, (x1, y1), 6, (0, 255, 150), -1)
    cv2.circle(vis, (x1, y1), 8, (255, 255, 255), 1)
    cv2.putText(vis, f"P1({x1},{y1})", (x1 + 10, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 150), 1)

    cv2.circle(vis, (x2, y2), 6, (255, 80, 80), -1)
    cv2.circle(vis, (x2, y2), 8, (255, 255, 255), 1)
    cv2.putText(vis, f"P2({x2},{y2})", (x2 + 10, y2 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 80, 80), 1)

    return {
        "p1": {"x": x1, "y": y1},
        "p2": {"x": x2, "y": y2},
        "dx": dx,
        "dy": dy,
        "euclidean": round(d_euclidean, 3),
        "cityblock_d4": d_cityblock,
        "chessboard_d8": d_chessboard,
        "formula_euclidean": r"D_e(p, q) = \sqrt{(x - s)^2 + (y - t)^2}",
        "formula_d4": r"D_4(p, q) = |x - s| + |y - t|",
        "formula_d8": r"D_8(p, q) = \max(|x - s|, |y - t|)",
        "overlay_image": image_to_base64(vis),
    }


def analyze_connectivity(img: np.ndarray, seed: Tuple[int, int], threshold: int = 128) -> Dict[str, Any]:
    """
    Demonstrate 4-neighborhood vs 8-neighborhood connectivity.
    Binarizes image at threshold and finds connected component starting from seed.
    """
    gray = to_grayscale(img)
    _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    
    h, w = binary.shape
    sx, sy = max(0, min(w - 1, seed[0])), max(0, min(h - 1, seed[1]))

    # If seed is not in foreground, invert or pick seed value
    seed_val = binary[sy, sx]
    binary_roi = (binary == seed_val).astype(np.uint8) * 255

    # 4-connectivity floodfill
    mask_4 = np.zeros((h + 2, w + 2), dtype=np.uint8)
    ff_4 = binary_roi.copy()
    cv2.floodFill(ff_4, mask_4, (sx, sy), 150, flags=4 | (255 << 8))
    component_4 = (ff_4 == 150).astype(np.uint8) * 255

    # 8-connectivity floodfill
    mask_8 = np.zeros((h + 2, w + 2), dtype=np.uint8)
    ff_8 = binary_roi.copy()
    cv2.floodFill(ff_8, mask_8, (sx, sy), 150, flags=8 | (255 << 8))
    component_8 = (ff_8 == 150).astype(np.uint8) * 255

    # Colorize comparison
    vis_comp = np.zeros((h, w, 3), dtype=np.uint8)
    # Background binary in faint gray
    vis_comp[binary_roi > 0] = [60, 60, 70]
    # 8-connected in blue
    vis_comp[component_8 > 0] = [200, 100, 30]
    # 4-connected in cyan (overlap)
    vis_comp[component_4 > 0] = [0, 230, 230]
    # Seed point
    cv2.circle(vis_comp, (sx, sy), 4, (0, 255, 0), -1)

    return {
        "seed": {"x": sx, "y": sy},
        "threshold": threshold,
        "pixels_4_connected": int(np.sum(component_4 > 0)),
        "pixels_8_connected": int(np.sum(component_8 > 0)),
        "binary_mask": image_to_base64(binary_roi),
        "conn_4_image": image_to_base64(component_4),
        "conn_8_image": image_to_base64(component_8),
        "comparison_overlay": image_to_base64(vis_comp),
    }
