"""
Tests for Visual Processing Pipeline Execution Engine
"""

from app.processing.pipeline_engine import execute_pipeline
from app.processing.utils import image_to_base64


def test_pipeline_dag_execution(sample_cameraman):
    b64_in = image_to_base64(sample_cameraman)

    nodes = [
        {"id": "1", "data": {"type": "input", "label": "Image Input"}},
        {"id": "2", "data": {"type": "grayscale", "label": "Grayscale", "params": {"method": "luminance"}}},
        {"id": "3", "data": {"type": "histogram_eq", "label": "Histogram EQ"}},
        {"id": "4", "data": {"type": "spatial_filter", "label": "Gaussian Blur", "params": {"filter_type": "gaussian", "kernel_size": 3, "sigma": 1.0}}},
        {"id": "5", "data": {"type": "output", "label": "Output Preview"}},
    ]

    edges = [
        {"source": "1", "target": "2"},
        {"source": "2", "target": "3"},
        {"source": "3", "target": "4"},
        {"source": "4", "target": "5"},
    ]

    result = execute_pipeline(nodes, edges, b64_in)
    assert "node_previews" in result
    assert "1" in result["node_previews"]
    assert "5" in result["node_previews"]
    assert len(result["logs"]) == 5
    assert result["metrics"]["psnr_db"] > 0
