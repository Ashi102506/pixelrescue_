"""
Tests for FastAPI HTTP Endpoints
"""

from fastapi.testclient import TestClient
from app.main import app
from app.processing.utils import generate_synthetic_samples, image_to_base64

client = TestClient(app)
samples = generate_synthetic_samples()
sample_b64 = image_to_base64(samples["cameraman"])


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["name"] == "PIXELRESCUE API"

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"


def test_samples_endpoint():
    res = client.get("/api/samples/")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    assert any(s["id"] == "cameraman" for s in data)


def test_metadata_endpoint():
    res = client.post("/api/fundamentals/metadata", json={"image": sample_b64})
    assert res.status_code == 200
    assert res.json()["width"] == 256


def test_enhancement_transform_endpoint():
    res = client.post(
        "/api/enhancement/transform",
        json={"image": sample_b64, "operation": "negative"}
    )
    assert res.status_code == 200
    assert "image" in res.json()
    assert "formula" in res.json()


def test_spatial_filter_endpoint():
    res = client.post(
        "/api/spatial/filter",
        json={"image": sample_b64, "filter_type": "mean", "kernel_size": 3}
    )
    assert res.status_code == 200
    assert "image" in res.json()
    assert "kernel" in res.json()


def test_frequency_spectra_endpoint():
    res = client.post("/api/frequency/spectra", json={"image": sample_b64})
    assert res.status_code == 200
    assert "log_magnitude_image" in res.json()
    assert "phase_image" in res.json()


def test_restoration_challenge_endpoint():
    res = client.post(
        "/api/restoration/challenge",
        json={
            "image": sample_b64,
            "blur_type": "motion",
            "blur_kernel_size": 7,
            "noise_type": "gaussian",
            "noise_strength": 0.01,
            "rest_method": "wiener",
            "rest_kernel_size": 7,
        }
    )
    assert res.status_code == 200
    assert "degraded_image" in res.json()
    assert "restored_image" in res.json()
    assert "metrics_degraded" in res.json()
