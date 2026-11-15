"""
API Router for Module 3: Spatial Filtering Lab
"""

from fastapi import APIRouter
from ..schemas.schemas import SpatialFilterRequest, SpatialStepRequest
from ..processing.utils import base64_to_image
from ..processing.spatial import apply_spatial_filter, compute_kernel_math_step

router = APIRouter(prefix="/spatial", tags=["Module 3: Spatial Filtering"])


@router.post("/filter")
def run_spatial_filter(req: SpatialFilterRequest):
    img = base64_to_image(req.image)
    return apply_spatial_filter(
        img=img,
        filter_type=req.filter_type,
        kernel_size=req.kernel_size,
        sigma=req.sigma,
        k_boost=req.k_boost,
        laplacian_mode=req.laplacian_mode,
        padding=req.padding
    )


@router.post("/step-inspect")
def inspect_kernel_step(req: SpatialStepRequest):
    img = base64_to_image(req.image)
    return compute_kernel_math_step(
        img=img,
        x=req.x,
        y=req.y,
        filter_type=req.filter_type,
        kernel_size=req.kernel_size,
        sigma=req.sigma
    )
