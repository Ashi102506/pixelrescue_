"""
PIXELRESCUE — Advanced Visual Node-Based Processing Pipeline Execution Engine
Receives a directed acyclic graph (DAG) of processing nodes and edges,
computes topological ordering, executes each node in sequence passing numpy image arrays,
and returns intermediate output previews and execution status for every node.
"""

import time
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import cv2

from .utils import base64_to_image, image_to_base64, to_grayscale
from .fundamentals import simulate_sampling, simulate_quantization
from .enhancement import (
    image_negative, log_transform, gamma_transform, contrast_stretching,
    binary_threshold, adjust_brightness_contrast
)
from .histogram import equalize_histogram
from .spatial import apply_spatial_filter
from .frequency import apply_frequency_filter
from .color import adjust_hsi_color, apply_pseudocolor
from .metrics import calculate_quality_metrics


def execute_node_operation(node_type: str, params: Dict[str, Any], input_img: np.ndarray) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Execute a single processing node on an input image array."""
    out_img = input_img.copy()
    meta = {}

    if node_type == "grayscale":
        method = params.get("method", "luminance")
        out_img = to_grayscale(input_img, method)
        if len(input_img.shape) == 3 and input_img.shape[2] == 3:
            # Keep 3-channel for downstream nodes expecting color if needed
            out_img = cv2.cvtColor(out_img, cv2.COLOR_GRAY2RGB)
        meta["description"] = f"Converted to grayscale ({method})"

    elif node_type == "sampling":
        factor = int(params.get("factor", 4))
        interp = params.get("interpolation", "nearest")
        out_img, _ = simulate_sampling(input_img, factor=factor, interpolation=interp)
        meta["description"] = f"Downsampled by 1/{factor}x using {interp}"

    elif node_type == "quantization":
        levels = int(params.get("levels", 8))
        out_img, _ = simulate_quantization(input_img, levels=levels)
        meta["description"] = f"Quantized to {levels} intensity levels"

    elif node_type == "negative":
        out_img = 255 - input_img
        meta["description"] = "Inverted intensities"

    elif node_type == "log":
        res = log_transform(input_img)
        # Parse image from base64
        out_img = base64_to_image(res["image"])
        meta["description"] = "Logarithmic dynamic range compression"

    elif node_type == "gamma":
        gamma = float(params.get("gamma", 1.5))
        res = gamma_transform(input_img, gamma=gamma)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"Gamma power-law correction (γ={gamma})"

    elif node_type == "contrast_stretch":
        r1 = int(params.get("r1", 50))
        s1 = int(params.get("s1", 20))
        r2 = int(params.get("r2", 200))
        s2 = int(params.get("s2", 235))
        res = contrast_stretching(input_img, r1, s1, r2, s2)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"Contrast stretched: [{r1}->{s1}], [{r2}->{s2}]"

    elif node_type == "brightness_contrast":
        alpha = float(params.get("alpha", 1.2))
        beta = float(params.get("beta", 10.0))
        res = adjust_brightness_contrast(input_img, alpha=alpha, beta=beta)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"Adjusted contrast (α={alpha}) & brightness (β={beta})"

    elif node_type == "threshold":
        thresh = int(params.get("threshold", 128))
        res = binary_threshold(input_img, threshold=thresh)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"Binary thresholded at T={thresh}"

    elif node_type == "histogram_eq":
        res = equalize_histogram(input_img)
        out_img = base64_to_image(res["image"])
        meta["description"] = "Histogram Equalization"

    elif node_type == "spatial_filter":
        f_type = params.get("filter_type", "gaussian")
        k_size = int(params.get("kernel_size", 5))
        sigma = float(params.get("sigma", 1.5))
        k_boost = float(params.get("k_boost", 1.5))
        res = apply_spatial_filter(input_img, filter_type=f_type, kernel_size=k_size, sigma=sigma, k_boost=k_boost)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"Spatial Filter: {f_type} ({k_size}x{k_size})"

    elif node_type == "frequency_filter":
        f_family = params.get("family", "butterworth")
        pass_type = params.get("pass_type", "lowpass")
        cutoff = float(params.get("cutoff", 40.0))
        order = int(params.get("order", 2))
        res = apply_frequency_filter(input_img, filter_family=f_family, pass_type=pass_type, cutoff=cutoff, order=order)
        out_img = base64_to_image(res["panel_4_reconstructed"])
        meta["description"] = f"2D FFT {f_family.title()} {pass_type.upper()} (D0={cutoff})"

    elif node_type == "color_adjust":
        hue = float(params.get("hue_shift", 0.0))
        sat = float(params.get("saturation", 1.0))
        val = float(params.get("intensity", 1.0))
        res = adjust_hsi_color(input_img, hue_shift_deg=hue, saturation_scale=sat, intensity_scale=val)
        out_img = base64_to_image(res["image"])
        meta["description"] = f"HSI adjusted: H+{hue}°, S*{sat}, I*{val}"

    elif node_type == "pseudocolor":
        cmap = params.get("colormap", "jet")
        res = apply_pseudocolor(input_img, colormap_name=cmap)
        out_img = base64_to_image(res["continuous_pseudocolor"])
        meta["description"] = f"Pseudo-color colormap ({cmap})"

    elif node_type == "output":
        out_img = input_img
        meta["description"] = "Final Output"

    return out_img, meta


def execute_pipeline(
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    initial_image_b64: str
) -> Dict[str, Any]:
    """
    Execute node graph in topological order.
    Returns preview images for each node and final output.
    """
    t_start = time.time()
    
    # Adjacency list and in-degrees
    node_map = {n["id"]: n for n in nodes}
    in_degree = {n["id"]: 0 for n in nodes}
    adj = {n["id"]: [] for n in nodes}

    for edge in edges:
        u = edge["source"]
        v = edge["target"]
        if u in adj and v in in_degree:
            adj[u].append(v)
            in_degree[v] += 1

    # Topological sort (Kahn's algorithm)
    queue = [n_id for n_id, deg in in_degree.items() if deg == 0]
    topo_order = []

    while queue:
        u = queue.pop(0)
        topo_order.append(u)
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)

    # Decode initial image
    base_img = base64_to_image(initial_image_b64)
    node_outputs = {}
    node_previews = {}
    node_logs = []

    # Execute
    for node_id in topo_order:
        node = node_map[node_id]
        n_type = node.get("data", {}).get("type", node.get("type", "input"))
        n_params = node.get("data", {}).get("params", {})

        # Find incoming image
        incoming_sources = [e["source"] for e in edges if e["target"] == node_id]
        if not incoming_sources or n_type == "input":
            current_input = base_img
        else:
            # Take first incoming output
            current_input = node_outputs.get(incoming_sources[0], base_img)

        try:
            t0 = time.time()
            out_img, meta = execute_node_operation(n_type, n_params, current_input)
            exec_time = round((time.time() - t0) * 1000, 1)

            node_outputs[node_id] = out_img
            node_previews[node_id] = image_to_base64(out_img)
            node_logs.append({
                "node_id": node_id,
                "label": node.get("data", {}).get("label", n_type),
                "type": n_type,
                "time_ms": exec_time,
                "description": meta.get("description", "Executed successfully"),
                "status": "success",
            })
        except Exception as e:
            node_logs.append({
                "node_id": node_id,
                "label": node.get("data", {}).get("label", n_type),
                "type": n_type,
                "status": "error",
                "error": str(e),
            })
            node_outputs[node_id] = current_input
            node_previews[node_id] = image_to_base64(current_input)

    total_duration_ms = round((time.time() - t_start) * 1000, 2)
    last_node_id = topo_order[-1] if topo_order else None
    final_output_b64 = node_previews.get(last_node_id, initial_image_b64)

    # Compute quality metrics comparing base to final output
    final_img = node_outputs.get(last_node_id, base_img)
    metrics = calculate_quality_metrics(base_img, final_img, duration_ms=total_duration_ms)

    return {
        "node_previews": node_previews,
        "final_output": final_output_b64,
        "logs": node_logs,
        "metrics": metrics,
        "duration_ms": total_duration_ms,
    }
