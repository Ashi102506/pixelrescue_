"""
Pytest Fixtures for PIXELRESCUE
"""

import pytest
import numpy as np
from app.processing.utils import generate_synthetic_samples, image_to_base64


@pytest.fixture
def synthetic_images():
    return generate_synthetic_samples()


@pytest.fixture
def sample_cameraman(synthetic_images):
    return synthetic_images["cameraman"]


@pytest.fixture
def sample_mandrill(synthetic_images):
    return synthetic_images["mandrill"]


@pytest.fixture
def test_image_b64(sample_cameraman):
    return image_to_base64(sample_cameraman)
