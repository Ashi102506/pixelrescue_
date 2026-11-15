"""
Tests for Module 5: Image Restoration Engine
"""

import numpy as np
from app.processing.restoration import degrade_image, restore_image, add_noise
from app.processing.utils import base64_to_image
from app.processing.metrics import calculate_quality_metrics


def test_noise_generation(sample_cameraman):
    noisy_gauss, info = add_noise(sample_cameraman, "gaussian", var=0.01)
    assert noisy_gauss.shape == sample_cameraman.shape
    assert not np.array_equal(noisy_gauss, sample_cameraman)

    noisy_sp, _ = add_noise(sample_cameraman, "salt_and_pepper", p_salt=0.02, p_pepper=0.02)
    assert noisy_sp.shape == sample_cameraman.shape


def test_degradation_and_restoration(sample_cameraman):
    deg_res = degrade_image(sample_cameraman, blur_type="motion", blur_kernel_size=7, noise_type="gaussian", noise_strength=0.01)
    deg_img = base64_to_image(deg_res["degraded_image"])

    # Restore with Wiener filter
    rest_res = restore_image(deg_img, method="wiener", kernel_size=7, wiener_k=0.02)
    rest_img = base64_to_image(rest_res["restored_image"])

    assert rest_img.shape[:2] == sample_cameraman.shape[:2]
    
    # Calculate metrics
    m_deg = calculate_quality_metrics(sample_cameraman, deg_img)
    m_rest = calculate_quality_metrics(sample_cameraman, rest_img)
    assert "psnr_db" in m_deg
    assert "psnr_db" in m_rest
