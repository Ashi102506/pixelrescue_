"""
API Router for Module 1: Image Fundamentals
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Optional
import numpy as np
from PIL import Image
import io

from ..schemas.schemas import (
    BaseImageRequest, PixelInspectRequest, SamplingRequest,
    QuantizationRequest, DistanceRequest, ConnectivityRequest
)
from ..processing.utils import base64_to_image, image_to_base64
from ..processing.fundamentals import (
    extract_metadata, inspect_pixel, separate_channels,
    convert_grayscale, simulate_sampling, simulate_quantization,
    calculate_pixel_distances, analyze_connectivity
)

router = APIRouter(prefix="/fundamentals", tags=["Module 1: Fundamentals"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload and validate image (PNG, JPG, BMP, TIFF), extract metadata, return base64."""
    allowed_types = ["image/png", "image/jpeg", "image/jpg", "image/bmp", "image/tiff"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {file.content_type}. Supported: PNG, JPG, BMP, TIFF.")
    
    contents = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
        if pil_img.mode in ("RGBA", "LA"):
            bg = Image.new("RGB", pil_img.size, (255, 255, 255))
            bg.paste(pil_img, mask=pil_img.split()[-1])
            pil_img = bg
        elif pil_img.mode != "RGB" and pil_img.mode != "L":
            pil_img = pil_img.convert("RGB")
            
        arr = np.array(pil_img)
        meta = extract_metadata(arr, file_size_bytes=len(contents), filename=file.filename or "uploaded.png")
        b64 = image_to_base64(arr)
        
        return {
            "image": b64,
            "metadata": meta,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse uploaded image: {str(e)}")


@router.post("/metadata")
def get_metadata(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return extract_metadata(img)


@router.post("/inspect")
def inspect(req: PixelInspectRequest):
    img = base64_to_image(req.image)
    return inspect_pixel(img, req.x, req.y, req.neighborhood_size)


@router.post("/separate-channels")
def channels(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return separate_channels(img)


@router.post("/grayscale")
def grayscale(req: BaseImageRequest, method: str = "luminance"):
    img = base64_to_image(req.image)
    _, b64 = convert_grayscale(img, method)
    return {"image": b64, "method": method}


@router.post("/sampling")
def sampling(req: SamplingRequest):
    img = base64_to_image(req.image)
    _, b64 = simulate_sampling(img, req.factor, req.interpolation)
    return {"image": b64, "factor": req.factor, "interpolation": req.interpolation}


@router.post("/quantization")
def quantization(req: QuantizationRequest):
    img = base64_to_image(req.image)
    _, b64 = simulate_quantization(img, req.levels)
    return {"image": b64, "levels": req.levels}


@router.post("/distances")
def distances(req: DistanceRequest):
    return calculate_pixel_distances(
        tuple(req.p1), tuple(req.p2), (req.height, req.width)
    )


@router.post("/connectivity")
def connectivity(req: ConnectivityRequest):
    img = base64_to_image(req.image)
    return analyze_connectivity(img, (req.seed_x, req.seed_y), req.threshold)
