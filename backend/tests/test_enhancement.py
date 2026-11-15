"""
Tests for Module 2: Enhancement Studio & Histogram Laboratory
"""

import numpy as np
from app.processing.enhancement import (
    image_negative, log_transform, gamma_transform, contrast_stretching,
    binary_threshold, adjust_brightness_contrast
)
from app.processing.histogram import compute_histogram_and_cdf, equalize_histogram, specify_histogram
from app.processing.utils import base64_to_image


def test_image_negative(sample_cameraman):
    res = image_negative(sample_cameraman)
    neg_img = base64_to_image(res["image"])
    assert np.allclose(neg_img, 255 - sample_cameraman)


def test_log_transform(sample_cameraman):
    res = log_transform(sample_cameraman)
    log_img = base64_to_image(res["image"])
    assert log_img.shape == sample_cameraman.shape
    assert res["params"]["c"] > 0


def test_gamma_transform(sample_cameraman):
    res_bright = gamma_transform(sample_cameraman, gamma=0.5)
    res_dark = gamma_transform(sample_cameraman, gamma=2.0)
    img_bright = base64_to_image(res_bright["image"])
    img_dark = base64_to_image(res_dark["image"])
    # Gamma 0.5 should result in higher average intensity than Gamma 2.0
    assert np.mean(img_bright) > np.mean(img_dark)


def test_contrast_stretching(sample_cameraman):
    res = contrast_stretching(sample_cameraman, r1=50, s1=10, r2=200, s2=240)
    stretched = base64_to_image(res["image"])
    assert stretched.shape == sample_cameraman.shape
    assert len(res["lut"]) == 256


def test_binary_threshold(sample_cameraman):
    res = binary_threshold(sample_cameraman, threshold=100)
    thresh_img = base64_to_image(res["image"])
    unique = np.unique(thresh_img)
    assert all(val in [0, 255] for val in unique)


def test_histogram_and_cdf(sample_cameraman):
    hist_data = compute_histogram_and_cdf(sample_cameraman)
    assert len(hist_data["bins"]) == 256
    cdf = hist_data["channels"]["gray"]["cdf"]
    assert len(cdf) == 256
    # CDF must end at approximately 1.0
    assert abs(cdf[-1] - 1.0) < 1e-3


def test_histogram_equalization(sample_cameraman):
    res = equalize_histogram(sample_cameraman)
    eq_img = base64_to_image(res["image"])
    assert eq_img.shape == sample_cameraman.shape
    assert len(res["lut"]) == 256


def test_histogram_specification(sample_cameraman, sample_mandrill):
    res = specify_histogram(sample_cameraman, target_type="reference", reference_img=sample_mandrill)
    matched_img = base64_to_image(res["image"])
    assert matched_img.shape[:2] == sample_cameraman.shape[:2]
    assert len(res["lut"]) == 256
