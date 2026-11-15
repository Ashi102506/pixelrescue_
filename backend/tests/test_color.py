"""
Tests for Module 6: Color Processing Laboratory
"""

import numpy as np
from app.processing.color import (
    rgb_to_cmy, cmy_to_rgb, rgb_to_hsi, hsi_to_rgb,
    decompose_color_channels, adjust_hsi_color, apply_pseudocolor
)
from app.processing.utils import base64_to_image


def test_rgb_cmy_inversion(sample_mandrill):
    cmy = rgb_to_cmy(sample_mandrill)
    rgb_rec = cmy_to_rgb(cmy)
    assert np.array_equal(sample_mandrill, rgb_rec)


def test_rgb_to_hsi_and_back(sample_mandrill):
    H, S, I = rgb_to_hsi(sample_mandrill)
    assert H.shape == (256, 256)
    assert S.shape == (256, 256)
    assert I.shape == (256, 256)
    assert np.all(H >= 0.0) and np.all(H <= 360.0)
    assert np.all(S >= 0.0) and np.all(S <= 1.0)
    assert np.all(I >= 0.0) and np.all(I <= 1.0)

    # Inverse mapping
    rgb_rec = hsi_to_rgb(H, S, I)
    # Check close reconstruction (floating point rounding within tolerance)
    diff = np.abs(sample_mandrill.astype(int) - rgb_rec.astype(int))
    assert np.mean(diff) < 2.5


def test_color_decomposition(sample_mandrill):
    res = decompose_color_channels(sample_mandrill)
    assert "rgb" in res and "cmy" in res and "hsi" in res
    assert "r" in res["rgb"]
    assert "c" in res["cmy"]
    assert "h" in res["hsi"]


def test_pseudocolor(sample_cameraman):
    res = apply_pseudocolor(sample_cameraman, colormap_name="jet")
    assert "continuous_pseudocolor" in res
    assert "sliced_pseudocolor" in res
