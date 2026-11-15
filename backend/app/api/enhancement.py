"""
API Router for Module 2: Enhancement Studio & Histogram Laboratory
"""

from fastapi import APIRouter, HTTPException
from ..schemas.schemas import BaseImageRequest, IntensityTransformRequest, HistogramSpecificationRequest
from ..processing.utils import base64_to_image
from ..processing.enhancement import (
    image_negative, log_transform, inv_log_transform, gamma_transform,
    contrast_stretching, binary_threshold, adaptive_threshold, adjust_brightness_contrast
)
from ..processing.histogram import compute_histogram_and_cdf, equalize_histogram, specify_histogram

router = APIRouter(prefix="/enhancement", tags=["Module 2: Enhancement Studio"])


@router.post("/transform")
def apply_intensity_transform(req: IntensityTransformRequest):
    img = base64_to_image(req.image)
    op = req.operation.lower()
    
    if op == "negative":
        return image_negative(img)
    elif op == "log":
        return log_transform(img, req.c_factor)
    elif op == "inv_log":
        return inv_log_transform(img)
    elif op == "gamma":
        return gamma_transform(img, req.gamma)
    elif op == "contrast_stretch":
        return contrast_stretching(img, req.r1, req.s1, req.r2, req.s2)
    elif op == "threshold":
        return binary_threshold(img, req.threshold_val)
    elif op == "adaptive_threshold":
        return adaptive_threshold(img, req.block_size, req.c_constant)
    elif op == "brightness_contrast":
        return adjust_brightness_contrast(img, req.alpha, req.beta)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown intensity transformation: {req.operation}")


@router.post("/histogram")
def get_histogram(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return compute_histogram_and_cdf(img)


@router.post("/equalize")
def equalize(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return equalize_histogram(img)


@router.post("/specify")
def specify(req: HistogramSpecificationRequest):
    img = base64_to_image(req.image)
    ref_img = base64_to_image(req.reference_image) if req.reference_image else None
    return specify_histogram(
        source_img=img,
        target_type=req.target_type,
        reference_img=ref_img,
        gaussian_mean=req.gaussian_mean,
        gaussian_std=req.gaussian_std
    )
