"""
Tests for Module 4: SPECTRA Frequency Domain Laboratory
"""

import numpy as np
from app.processing.frequency import compute_fft_spectra, apply_frequency_filter, generate_filter_mask
from app.processing.utils import base64_to_image


def test_fft_spectra_computation(sample_cameraman):
    res = compute_fft_spectra(sample_cameraman)
    assert res["width"] == 256
    assert res["height"] == 256
    assert res["dc_component"] > 0
    assert "log_magnitude_image" in res
    assert "phase_image" in res
    assert len(res["radial_profile"]["energy"]) > 0


def test_filter_mask_generation():
    shape = (256, 256)
    # Butterworth Low-pass center must be 1.0
    H_lp, _, _ = generate_filter_mask(shape, "butterworth", "lowpass", cutoff=30.0, order=2)
    assert abs(H_lp[128, 128] - 1.0) < 1e-3
    assert H_lp[0, 0] < 0.1

    # Butterworth High-pass center must be 0.0
    H_hp, _, _ = generate_filter_mask(shape, "butterworth", "highpass", cutoff=30.0, order=2)
    assert abs(H_hp[128, 128]) < 1e-3
    assert H_hp[0, 0] > 0.9


def test_frequency_filtering_pipeline(sample_cameraman):
    res = apply_frequency_filter(
        sample_cameraman,
        filter_family="butterworth",
        pass_type="lowpass",
        cutoff=40.0,
        order=2
    )
    # Check 4 synchronized panel images are generated
    assert "panel_1_original" in res
    assert "panel_2_spectrum" in res
    assert "panel_3_filter_mask" in res
    assert "panel_4_reconstructed" in res
    
    recon = base64_to_image(res["panel_4_reconstructed"])
    assert recon.shape == (256, 256)
    assert recon.dtype == np.uint8
