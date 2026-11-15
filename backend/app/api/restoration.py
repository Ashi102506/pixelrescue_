"""
API Router for Module 5: Image Restoration Engine
"""

from fastapi import APIRouter
from ..schemas.schemas import DegradationRequest, RestorationRequest, RestorationChallengeRequest
from ..processing.utils import base64_to_image, image_to_base64
from ..processing.restoration import degrade_image, restore_image
from ..processing.metrics import calculate_quality_metrics

router = APIRouter(prefix="/restoration", tags=["Module 5: Image Restoration"])


@router.post("/degrade")
def apply_degradation(req: DegradationRequest):
    img = base64_to_image(req.image)
    res = degrade_image(
        img=img,
        blur_type=req.blur_type,
        blur_kernel_size=req.blur_kernel_size,
        motion_angle=req.motion_angle,
        gaussian_blur_sigma=req.gaussian_blur_sigma,
        noise_type=req.noise_type,
        noise_strength=req.noise_strength,
        seed=req.seed
    )
    raw_deg = res.pop("_raw_degraded")
    
    # Calculate degradation metrics vs clean original
    metrics = calculate_quality_metrics(img, raw_deg)
    res["metrics_vs_clean"] = metrics
    return res


@router.post("/restore")
def apply_restoration(req: RestorationRequest):
    img = base64_to_image(req.image)
    res = restore_image(
        img=img,
        method=req.method,
        kernel_size=req.kernel_size,
        wiener_k=req.wiener_k,
        inverse_cutoff=req.inverse_cutoff,
        motion_angle=req.motion_angle,
        notch_u0=req.notch_u0,
        notch_v0=req.notch_v0
    )
    raw_rest = res.pop("_raw_restored")
    return res


@router.post("/challenge")
def run_restoration_challenge(req: RestorationChallengeRequest):
    """
    Run automated Restoration Challenge comparing:
    Ground Truth Clean -> Degraded -> Restored with full objective metrics!
    """
    clean_img = base64_to_image(req.image)
    
    # 1. Degrade
    deg_res = degrade_image(
        img=clean_img,
        blur_type=req.blur_type,
        blur_kernel_size=req.blur_kernel_size,
        motion_angle=req.motion_angle,
        gaussian_blur_sigma=req.gaussian_blur_sigma,
        noise_type=req.noise_type,
        noise_strength=req.noise_strength,
        seed=req.seed
    )
    degraded_raw = deg_res.pop("_raw_degraded")

    # 2. Restore
    rest_res = restore_image(
        img=degraded_raw,
        method=req.rest_method,
        kernel_size=req.rest_kernel_size,
        wiener_k=req.wiener_k,
        inverse_cutoff=req.inverse_cutoff,
        motion_angle=req.motion_angle
    )
    restored_raw = rest_res.pop("_raw_restored")

    # 3. Compare Metrics
    metrics_deg = calculate_quality_metrics(clean_img, degraded_raw)
    metrics_rest = calculate_quality_metrics(clean_img, restored_raw)

    return {
        "clean_image": image_to_base64(clean_img),
        "degraded_image": deg_res["degraded_image"],
        "restored_image": rest_res["restored_image"],
        "metrics_degraded": metrics_deg,
        "metrics_restored": metrics_rest,
        "psnr_improvement_db": round(metrics_rest["psnr_db"] - metrics_deg["psnr_db"], 2),
        "mse_reduction": round(metrics_deg["mse"] - metrics_rest["mse"], 2),
        "ssim_improvement": round(metrics_rest["ssim"] - metrics_deg["ssim"], 4),
        "degradation_info": deg_res,
        "restoration_info": rest_res,
    }
