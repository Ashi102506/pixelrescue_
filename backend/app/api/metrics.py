"""
API Router for Module 7: Image Quality Analysis
"""

from fastapi import APIRouter
from ..schemas.schemas import QualityMetricsRequest
from ..processing.utils import base64_to_image
from ..processing.metrics import calculate_quality_metrics

router = APIRouter(prefix="/metrics", tags=["Module 7: Quality Analysis"])


@router.post("/compare")
def compare_images(req: QualityMetricsRequest):
    ref_img = base64_to_image(req.reference_image)
    target_img = base64_to_image(req.target_image)
    return calculate_quality_metrics(
        img_ref=ref_img,
        img_comp=target_img,
        duration_ms=req.duration_ms
    )
