"""
Tests for Module 3: Spatial Filtering & 2D Convolution
"""

import numpy as np
from app.processing.spatial import apply_spatial_filter, compute_kernel_math_step
from app.processing.utils import base64_to_image


def test_mean_filter(sample_cameraman):
    res = apply_spatial_filter(sample_cameraman, filter_type="mean", kernel_size=3)
    filtered = base64_to_image(res["image"])
    assert filtered.shape == sample_cameraman.shape
    assert res["kernel_size"] == 3
    # Kernel weights should sum to 1.0
    k = np.array(res["kernel"])
    assert abs(np.sum(k) - 1.0) < 1e-4


def test_gaussian_filter(sample_cameraman):
    res = apply_spatial_filter(sample_cameraman, filter_type="gaussian", kernel_size=5, sigma=1.5)
    filtered = base64_to_image(res["image"])
    assert filtered.shape == sample_cameraman.shape
    k = np.array(res["kernel"])
    assert abs(np.sum(k) - 1.0) < 1e-4


def test_laplacian_filter(sample_cameraman):
    res = apply_spatial_filter(sample_cameraman, filter_type="laplacian", laplacian_mode="8_neighbor")
    filtered = base64_to_image(res["image"])
    assert filtered.shape[:2] == sample_cameraman.shape[:2]
    assert "laplacian_raw" in res["extra"]


def test_sobel_edge(sample_cameraman):
    res = apply_spatial_filter(sample_cameraman, filter_type="sobel")
    filtered = base64_to_image(res["image"])
    assert filtered.shape[:2] == sample_cameraman.shape[:2]
    assert "gx" in res["extra"]
    assert "gy" in res["extra"]


def test_kernel_step_inspector(sample_cameraman):
    step = compute_kernel_math_step(sample_cameraman, 100, 100, filter_type="mean", kernel_size=3)
    assert step["x"] == 100
    assert step["y"] == 100
    assert len(step["neighborhood_patch"]) == 3
    assert len(step["elementwise_product"]) == 3
    assert len(step["step_terms"]) == 9
    assert 0 <= step["resulting_pixel"] <= 255
