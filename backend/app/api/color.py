"""
API Router for Module 6: Color Processing Laboratory
"""

from fastapi import APIRouter
from ..schemas.schemas import BaseImageRequest, ColorAdjustRequest, PseudoColorRequest
from ..processing.utils import base64_to_image
from ..processing.color import decompose_color_channels, adjust_hsi_color, apply_pseudocolor

router = APIRouter(prefix="/color", tags=["Module 6: Color Processing"])


@router.post("/decompose")
def decompose(req: BaseImageRequest):
    img = base64_to_image(req.image)
    return decompose_color_channels(img)


@router.post("/adjust-hsi")
def adjust_hsi(req: ColorAdjustRequest):
    img = base64_to_image(req.image)
    return adjust_hsi_color(
        img=img,
        hue_shift_deg=req.hue_shift_deg,
        saturation_scale=req.saturation_scale,
        intensity_scale=req.intensity_scale
    )


@router.post("/pseudocolor")
def pseudocolor(req: PseudoColorRequest):
    img = base64_to_image(req.image)
    return apply_pseudocolor(
        img=img,
        colormap_name=req.colormap_name,
        intensity_slices=req.intensity_slices
    )
