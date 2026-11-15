"""
Tests for Module 1: Image Fundamentals
"""

import numpy as np
from app.processing.fundamentals import (
    extract_metadata, inspect_pixel, separate_channels,
    convert_grayscale, simulate_sampling, simulate_quantization,
    calculate_pixel_distances, analyze_connectivity
)
from app.processing.utils import base64_to_image


def test_metadata_extraction(sample_cameraman):
    meta = extract_metadata(sample_cameraman, file_size_bytes=65536, filename="cameraman.png")
    assert meta["width"] == 256
    assert meta["height"] == 256
    assert meta["channels"] == 3
    assert meta["color_mode"] == "RGB"
    assert "statistics" in meta
    assert meta["total_pixels"] == 256 * 256


def test_pixel_inspection(sample_cameraman):
    res = inspect_pixel(sample_cameraman, 128, 128, neighborhood_size=3)
    assert res["pixel"]["x"] == 128
    assert res["pixel"]["y"] == 128
    assert len(res["neighborhood"]["matrix"]) == 3
    assert len(res["neighborhood"]["matrix"][0]) == 3


def test_channel_separation(sample_mandrill):
    channels = separate_channels(sample_mandrill)
    assert "r" in channels
    assert "g" in channels
    assert "b" in channels
    assert "r_gray" in channels


def test_grayscale_conversion(sample_mandrill):
    gray, b64 = convert_grayscale(sample_mandrill, method="luminance")
    assert len(gray.shape) == 2
    assert gray.shape == (256, 256)
    assert gray.dtype == np.uint8


def test_sampling_simulation(sample_cameraman):
    sampled, b64 = simulate_sampling(sample_cameraman, factor=4, interpolation="nearest")
    assert sampled.shape == sample_cameraman.shape
    assert b64.startswith("data:image/png;base64,")


def test_quantization_simulation(sample_cameraman):
    quant, b64 = simulate_quantization(sample_cameraman, levels=4)
    # Check that number of unique values is <= 4
    unique_vals = np.unique(quant)
    assert len(unique_vals) <= 4


def test_pixel_distances():
    res = calculate_pixel_distances((10, 20), (40, 60), (256, 256))
    assert res["dx"] == 30
    assert res["dy"] == 40
    # 3-4-5 triangle: sqrt(30^2 + 40^2) = 50.0
    assert res["euclidean"] == 50.0
    # D4 = 30 + 40 = 70
    assert res["cityblock_d4"] == 70
    # D8 = max(30, 40) = 40
    assert res["chessboard_d8"] == 40


def test_connectivity(sample_cameraman):
    res = analyze_connectivity(sample_cameraman, (128, 128), threshold=128)
    assert "pixels_4_connected" in res
    assert "pixels_8_connected" in res
    assert res["pixels_8_connected"] >= res["pixels_4_connected"]
