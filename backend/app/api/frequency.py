"""
API Router for Module 4: SPECTRA Frequency Domain Laboratory
"""

from fastapi import APIRouter
from ..schemas.schemas import BaseImageRequest, FrequencyFilterRequest
from ..processing.utils import base64_to_image
from ..processing.frequency import compute_fft_spectra, apply_frequency_filter

router = APIRouter(prefix="/frequency", tags=["Module 4: SPECTRA Frequency Domain"])


@router.post("/spectra")
def get_spectra(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return compute_fft_spectra(img)


@router.post("/filter")
def run_frequency_filter(req: FrequencyFilterRequest):
    img = base64_to_image(req.image)
    return apply_frequency_filter(
        img=img,
        filter_family=req.filter_family,
        pass_type=req.pass_type,
        cutoff=req.cutoff,
        order=req.order,
        notch_u0=req.notch_u0,
        notch_v0=req.notch_v0,
        notch_d0=req.notch_d0
    )
