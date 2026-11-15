"""
API Router for Built-in Academic DIP Sample Images
"""

from fastapi import APIRouter
from ..processing.utils import generate_synthetic_samples, image_to_base64
from ..processing.fundamentals import extract_metadata

router = APIRouter(prefix="/samples", tags=["Sample Images"])

# Cache generated samples
_SAMPLES_CACHE = None


def get_cached_samples():
    global _SAMPLES_CACHE
    if _SAMPLES_CACHE is None:
        _SAMPLES_CACHE = generate_synthetic_samples()
    return _SAMPLES_CACHE


@router.get("/")
def list_sample_images():
    """List all available academic sample test cards."""
    samples = get_cached_samples()
    descriptions = {
        "cameraman": "Cameraman Silhouette (Standard DIP test image for edge detection and spatial filtering)",
        "resolution_chart": "Geometric Resolution Chart (Concentric circles, lines, frequency grating targets)",
        "moon": "Lunar Surface & Craters (Rich shadow detail and texture for contrast enhancement & high-boost)",
        "mandrill": "Mandrill / Baboon (Rich multi-channel color features for HSI/CMY color space analysis)",
        "step_wedge": "Step Wedge & Checkerboard (8-step gray gradient for sampling, quantization & thresholding)",
    }

    results = []
    for key, arr in samples.items():
        b64 = image_to_base64(arr)
        meta = extract_metadata(arr, filename=f"{key}.png")
        results.append({
            "id": key,
            "name": key.replace("_", " ").title(),
            "description": descriptions.get(key, ""),
            "thumbnail": b64,
            "metadata": meta,
        })
    return results


@router.get("/{sample_id}")
def get_sample_image(sample_id: str):
    """Retrieve base64 image and metadata for a specific academic test image."""
    samples = get_cached_samples()
    if sample_id not in samples:
        # Default to cameraman if not found
        sample_id = "cameraman"
    arr = samples[sample_id]
    b64 = image_to_base64(arr)
    meta = extract_metadata(arr, filename=f"{sample_id}.png")
    return {
        "id": sample_id,
        "name": sample_id.replace("_", " ").title(),
        "image": b64,
        "metadata": meta,
    }
