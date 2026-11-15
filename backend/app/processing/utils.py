"""
PIXELRESCUE Processing Engine Utilities
Handles image encoding/decoding, color conversions, neighborhood patch extraction,
and generation of standard academic test images (Cameraman, Lena, Mandrill, etc.).
"""

import io
import base64
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2


def image_to_base64(image_array: np.ndarray, format: str = "PNG") -> str:
    """Convert numpy image array (uint8 or float) to base64 data URL."""
    if image_array.dtype != np.uint8:
        # Normalize/clip to 0..255
        clipped = np.clip(image_array, 0, 255).astype(np.uint8)
    else:
        clipped = image_array

    if len(clipped.shape) == 2:
        pil_img = Image.fromarray(clipped, mode="L")
    elif len(clipped.shape) == 3 and clipped.shape[2] == 3:
        pil_img = Image.fromarray(clipped, mode="RGB")
    elif len(clipped.shape) == 3 and clipped.shape[2] == 4:
        pil_img = Image.fromarray(clipped, mode="RGBA")
    else:
        # Fallback
        pil_img = Image.fromarray(clipped[:, :, 0], mode="L")

    buffer = io.BytesIO()
    pil_img.save(buffer, format=format)
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
    mime = "image/png" if format.upper() == "PNG" else f"image/{format.lower()}"
    return f"data:{mime};base64,{encoded}"


def base64_to_image(b64_string: str) -> np.ndarray:
    """Decode base64 data URL or raw base64 string to RGB or Grayscale numpy array."""
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    image_bytes = base64.b64decode(b64_string)
    pil_img = Image.open(io.BytesIO(image_bytes))
    
    # Ensure RGB or Grayscale
    if pil_img.mode in ("RGBA", "LA"):
        # Convert RGBA to RGB on white background
        background = Image.new("RGB", pil_img.size, (255, 255, 255))
        background.paste(pil_img, mask=pil_img.split()[-1])
        pil_img = background
    elif pil_img.mode != "RGB" and pil_img.mode != "L":
        pil_img = pil_img.convert("RGB")
        
    return np.array(pil_img)


def to_grayscale(img: np.ndarray, method: str = "luminance") -> np.ndarray:
    """Convert RGB image array to 2D grayscale uint8 array."""
    if len(img.shape) == 2:
        return img.astype(np.uint8)
    
    r = img[:, :, 0].astype(np.float32)
    g = img[:, :, 1].astype(np.float32)
    b = img[:, :, 2].astype(np.float32)
    
    if method == "luminance":
        # ITU-R BT.601 standard: 0.299 R + 0.587 G + 0.114 B
        gray = 0.299 * r + 0.587 * g + 0.114 * b
    elif method == "average":
        gray = (r + g + b) / 3.0
    elif method == "desaturation":
        gray = (np.maximum(np.maximum(r, g), b) + np.minimum(np.minimum(r, g), b)) / 2.0
    else:
        gray = 0.299 * r + 0.587 * g + 0.114 * b
        
    return np.clip(gray, 0, 255).astype(np.uint8)


def get_neighborhood(img: np.ndarray, x: int, y: int, size: int = 3) -> np.ndarray:
    """Extract neighborhood patch centered at (x, y) with boundary reflection."""
    h, w = img.shape[:2]
    pad = size // 2
    x = max(0, min(w - 1, x))
    y = max(0, min(h - 1, y))
    
    # Use reflection padding
    if len(img.shape) == 2:
        padded = np.pad(img, pad, mode="reflect")
        patch = padded[y : y + size, x : x + size]
    else:
        padded = np.pad(img, ((pad, pad), (pad, pad), (0, 0)), mode="reflect")
        patch = padded[y : y + size, x : x + size, :]
    return patch


def generate_synthetic_samples() -> dict:
    """Generate high quality synthetic academic test images for instant use."""
    samples = {}
    size = 256

    # 1. Cameraman Silhouette / Academic Scene
    cam = np.zeros((size, size), dtype=np.uint8)
    # Sky gradient
    for y in range(size // 2):
        cam[y, :] = int(180 + (y / (size // 2)) * 40)
    # Ground
    cam[size // 2:, :] = 70
    # Add grass texture
    noise = np.random.RandomState(42).randint(-15, 15, size=(size // 2, size))
    cam[size // 2:, :] = np.clip(cam[size // 2:, :] + noise, 0, 255).astype(np.uint8)
    # Building in distance
    cam[60:130, 20:80] = 120
    cam[50:130, 80:140] = 100
    # Tripod and cameraman silhouette
    cv2.circle(cam, (170, 90), 18, (30,), -1)  # head
    cv2.rectangle(cam, (155, 105), (185, 175), (30,), -1)  # coat
    cv2.line(cam, (150, 125), (130, 115), (25,), 8)  # camera arm
    cv2.rectangle(cam, (115, 100), (135, 125), (20,), -1)  # camera box
    cv2.line(cam, (115, 112), (100, 112), (15,), 6)  # lens
    # Tripod legs
    cv2.line(cam, (125, 125), (95, 230), (30,), 4)
    cv2.line(cam, (125, 125), (125, 230), (30,), 4)
    cv2.line(cam, (125, 125), (155, 230), (30,), 4)
    # Convert to RGB
    samples["cameraman"] = cv2.cvtColor(cam, cv2.COLOR_GRAY2RGB)

    # 2. Geometric Shapes / Text / Edge Resolution Target
    geom = np.zeros((size, size, 3), dtype=np.uint8) + 240
    # Concentric circles
    for r in range(15, 110, 20):
        cv2.circle(geom, (128, 128), r, (30, 50, 120), 2)
    # Slanted lines for frequency / edge testing
    for offset in range(-100, 120, 20):
        cv2.line(geom, (20, 128 + offset), (236, 128 + offset + 30), (160, 40, 40), 2)
    # Square & polygons
    cv2.rectangle(geom, (40, 40), (90, 90), (34, 139, 34), -1)
    cv2.circle(geom, (200, 60), 30, (220, 100, 30), -1)
    # Grating bars of decreasing width (spatial frequency target)
    x_pos = 30
    for bar_w in [8, 6, 4, 3, 2, 1]:
        for _ in range(3):
            cv2.rectangle(geom, (x_pos, 190), (x_pos + bar_w, 240), (10, 10, 10), -1)
            x_pos += bar_w * 2
    samples["resolution_chart"] = geom

    # 3. Moon / Astronomical Surface (rich textures and shadows for enhancement)
    moon = np.zeros((size, size), dtype=np.uint8)
    center = (128, 128)
    radius = 100
    y, x = np.ogrid[:size, :size]
    mask = (x - center[0]) ** 2 + (y - center[1]) ** 2 <= radius ** 2
    # Texture using multi-frequency sinusoids
    tex = (
        np.sin(x / 8.0) * np.cos(y / 8.0) * 35
        + np.sin(x / 3.0 + y / 4.0) * 15
        + np.cos(x / 1.5) * 10
    )
    # Base lunar shading (crescent lighting)
    shading = (x - (center[0] - 50)) / 120.0
    shading = np.clip(shading, 0.1, 1.0)
    lunar = (120 + tex) * shading
    # Add craters
    rng = np.random.RandomState(101)
    for _ in range(12):
        cx = rng.randint(center[0] - 70, center[0] + 70)
        cy = rng.randint(center[1] - 70, center[1] + 70)
        cr = rng.randint(6, 22)
        cv2.circle(moon, (cx, cy), cr, (40,), -1)
        cv2.circle(moon, (cx + 2, cy + 2), cr, (180,), 2)
    lunar_final = np.where(mask, np.clip(lunar + moon, 20, 240), 10).astype(np.uint8)
    samples["moon"] = cv2.cvtColor(lunar_final, cv2.COLOR_GRAY2RGB)

    # 4. Colorful Mandrill / Baboon Approximation (Rich color spaces and textures)
    mandrill = np.zeros((size, size, 3), dtype=np.uint8)
    # Fur gradient
    fur = rng.randint(50, 140, size=(size, size)).astype(np.uint8)
    mandrill[:, :, 0] = fur  # Red
    mandrill[:, :, 1] = (fur * 0.7).astype(np.uint8)  # Green
    mandrill[:, :, 2] = (fur * 0.4).astype(np.uint8)  # Blue
    # Vivid red nose
    cv2.ellipse(mandrill, (128, 145), (20, 45), 0, 0, 360, (230, 30, 30), -1)
    # Bright blue cheek ridges
    cv2.ellipse(mandrill, (90, 140), (22, 35), -15, 0, 360, (30, 120, 240), -1)
    cv2.ellipse(mandrill, (166, 140), (22, 35), 15, 0, 360, (30, 120, 240), -1)
    # Golden eyes
    cv2.circle(mandrill, (95, 85), 14, (240, 200, 20), -1)
    cv2.circle(mandrill, (161, 85), 14, (240, 200, 20), -1)
    cv2.circle(mandrill, (95, 85), 6, (10, 10, 10), -1)
    cv2.circle(mandrill, (161, 85), 6, (10, 10, 10), -1)
    # Whiskers / muzzle
    cv2.ellipse(mandrill, (128, 195), (45, 20), 0, 0, 360, (210, 190, 160), -1)
    samples["mandrill"] = mandrill

    # 5. Checkerboard and Step Wedge (Ideal for sampling, quantization & connectivity)
    wedge = np.zeros((size, size, 3), dtype=np.uint8)
    # 8-step gray wedge
    step_w = size // 8
    for i in range(8):
        val = int(i * 36)
        wedge[:128, i * step_w:(i + 1) * step_w] = val
    # Checkerboard bottom
    check_size = 16
    for y_idx in range(128, size, check_size):
        for x_idx in range(0, size, check_size):
            if ((y_idx // check_size) + (x_idx // check_size)) % 2 == 0:
                wedge[y_idx:y_idx + check_size, x_idx:x_idx + check_size] = (220, 220, 220)
            else:
                wedge[y_idx:y_idx + check_size, x_idx:x_idx + check_size] = (30, 30, 30)
    samples["step_wedge"] = wedge

    return samples
