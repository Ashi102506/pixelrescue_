"""
Tests for Module 7: Image Quality Analysis
"""

import numpy as np
from app.processing.metrics import calculate_quality_metrics, calculate_entropy


def test_quality_metrics_identical(sample_cameraman):
    metrics = calculate_quality_metrics(sample_cameraman, sample_cameraman)
    assert metrics["mse"] == 0.0
    assert metrics["psnr_db"] == 100.0
    assert metrics["ssim"] == 1.0


def test_quality_metrics_different(sample_cameraman, sample_mandrill):
    metrics = calculate_quality_metrics(sample_cameraman, sample_mandrill)
    assert metrics["mse"] > 0
    assert metrics["psnr_db"] < 40.0
    assert metrics["ssim"] < 1.0
    assert "error_heatmap" in metrics


def test_entropy(sample_cameraman):
    ent = calculate_entropy(sample_cameraman)
    assert 0 < ent <= 8.0  # 8-bit image entropy bound
