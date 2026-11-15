"""
PIXELRESCUE — Module 4: SPECTRA Frequency Domain Laboratory
Flagship mathematical engine implementing:
- 2D Fast Fourier Transform (FFT2) & Centering (fftshift)
- Inverse 2D FFT (IFFT2) & Spatial Reconstruction
- Complex Spectrum Extraction: Log-Magnitude, Magnitude, and Phase
- 2D Frequency Domain Filtering: G(u,v) = F(u,v) * H(u,v)
- Filter Transfer Functions:
    * Ideal Low-Pass (ILPF) & Ideal High-Pass (IHPF)
    * Butterworth Low-Pass (BLPF) & Butterworth High-Pass (BHPF)
    * Gaussian Low-Pass (GLPF) & Gaussian High-Pass (GHPF)
    * Notch Rejection Filter for periodic noise
- Radial Transfer Function Profiles for Scientific Plotting
- Comprehensive Educational Explanations & Ringing Artifact Analysis
"""

import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from .utils import to_grayscale, image_to_base64


def compute_fft_spectra(img: np.ndarray) -> Dict[str, Any]:
    """
    Compute 2D FFT, centered magnitude, log-magnitude, and phase spectra.
    """
    gray = to_grayscale(img).astype(np.float32)
    h, w = gray.shape

    # 1. 2D FFT and Centering
    F = np.fft.fft2(gray)
    F_shifted = np.fft.fftshift(F)

    # 2. Magnitude: |F(u,v)|
    magnitude = np.abs(F_shifted)
    
    # 3. Log-Magnitude: c * ln(1 + |F(u,v)|) normalized to 0..255
    log_magnitude = np.log(1.0 + magnitude)
    max_log = np.max(log_magnitude)
    if max_log > 0:
        log_mag_display = (log_magnitude / max_log * 255.0).astype(np.uint8)
    else:
        log_mag_display = np.zeros((h, w), dtype=np.uint8)

    # 4. Phase: angle in [-pi, pi] normalized to 0..255
    phase = np.angle(F_shifted)
    phase_display = ((phase + np.pi) / (2.0 * np.pi) * 255.0).astype(np.uint8)

    # Colormapped spectrum for high-tech visualization
    spectrum_colored = cv2.applyColorMap(log_mag_display, cv2.COLORMAP_INFERNO)
    spectrum_colored = cv2.cvtColor(spectrum_colored, cv2.COLOR_BGR2RGB)

    # Compute radial energy distribution
    cy, cx = h // 2, w // 2
    y, x = np.ogrid[:h, :w]
    distances = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    max_r = int(min(cx, cy))
    radial_energy = []
    radii = list(range(0, max_r, max(1, max_r // 50)))
    
    for r in radii:
        mask = (distances >= r) & (distances < r + (max_r // 50))
        mean_energy = float(np.mean(magnitude[mask])) if np.any(mask) else 0.0
        radial_energy.append(round(mean_energy, 2))

    return {
        "width": w,
        "height": h,
        "dc_component": round(float(magnitude[cy, cx]), 2),
        "log_magnitude_image": image_to_base64(log_mag_display),
        "log_magnitude_colored": image_to_base64(spectrum_colored),
        "phase_image": image_to_base64(phase_display),
        "radial_profile": {
            "radii": radii,
            "energy": radial_energy,
        },
        "formula_dft": r"F(u,v) = \sum_{x=0}^{M-1} \sum_{y=0}^{N-1} f(x,y) e^{-j 2\pi (\frac{ux}{M} + \frac{vy}{N})}",
        "formula_magnitude": r"|F(u,v)| = \left[ R^2(u,v) + I^2(u,v) \right]^{1/2}",
        "formula_phase": r"\phi(u,v) = \arctan\left( \frac{I(u,v)}{R(u,v)} \right)",
        "formula_log": r"D(u,v) = c \cdot \ln(1 + |F(u,v)|)",
    }


def generate_filter_mask(
    shape: Tuple[int, int],
    filter_family: str = "butterworth",
    pass_type: str = "lowpass",
    cutoff: float = 30.0,
    order: int = 2,
    notch_u0: float = 40.0,
    notch_v0: float = 40.0,
    notch_d0: float = 10.0
) -> Tuple[np.ndarray, str, str]:
    """
    Generate centered 2D filter transfer function H(u,v).
    Returns (H, formula_latex, explanation).
    """
    h, w = shape
    cy, cx = h / 2.0, w / 2.0
    
    u = np.arange(h) - cy
    v = np.arange(w) - cx
    V, U = np.meshgrid(v, u)
    D = np.sqrt(U ** 2 + V ** 2)
    
    cutoff = max(1.0, float(cutoff))
    order = max(1, int(order))

    if filter_family == "ideal":
        if pass_type == "lowpass":
            H = np.where(D <= cutoff, 1.0, 0.0)
            formula = r"H(u,v) = \begin{cases} 1 & \text{if } D(u,v) \le D_0 \\ 0 & \text{if } D(u,v) > D_0 \end{cases}"
            explanation = "Ideal Low-Pass Filter (ILPF). Sharp cutoff produces severe ringing artifacts (Gibbs phenomenon) in the spatial domain due to sinc oscillations."
        else:
            H = np.where(D > cutoff, 1.0, 0.0)
            formula = r"H(u,v) = \begin{cases} 0 & \text{if } D(u,v) \le D_0 \\ 1 & \text{if } D(u,v) > D_0 \end{cases}"
            explanation = "Ideal High-Pass Filter (IHPF). Eliminates all low frequencies below D0; creates sharp edge outlines with halo and ringing artifacts."

    elif filter_family == "butterworth":
        if pass_type == "lowpass":
            H = 1.0 / (1.0 + (D / cutoff) ** (2 * order))
            formula = rf"H(u,v) = \frac{{1}}{{1 + \left[ \frac{{D(u,v)}}{{D_0}} \right]^{{2n}}}} \quad (D_0={cutoff}, n={order})"
            explanation = f"Butterworth Low-Pass Filter (BLPF) of order n={order}. Smooth transition between passband and stopband. At n=1, virtually no ringing; at higher orders (n>=3), ringing progressively emerges."
        else:
            # Avoid division by zero at center
            D_safe = np.where(D == 0, 1e-6, D)
            H = 1.0 / (1.0 + (cutoff / D_safe) ** (2 * order))
            formula = rf"H(u,v) = \frac{{1}}{{1 + \left[ \frac{{D_0}}{{D(u,v)}} \right]^{{2n}}}} \quad (D_0={cutoff}, n={order})"
            explanation = f"Butterworth High-Pass Filter (BHPF) of order n={order}. Smoothly attenuates low frequencies with controllable transition slope."

    elif filter_family == "gaussian":
        if pass_type == "lowpass":
            H = np.exp(-(D ** 2) / (2.0 * (cutoff ** 2)))
            formula = rf"H(u,v) = \exp\left( -\frac{{D^2(u,v)}}{{2 D_0^2}} \right) \quad (D_0={cutoff})"
            explanation = "Gaussian Low-Pass Filter (GLPF). Since the Fourier inverse of a 2D Gaussian is also a Gaussian, this filter produces completely zero ringing artifacts."
        else:
            H = 1.0 - np.exp(-(D ** 2) / (2.0 * (cutoff ** 2)))
            formula = rf"H(u,v) = 1 - \exp\left( -\frac{{D^2(u,v)}}{{2 D_0^2}} \right) \quad (D_0={cutoff})"
            explanation = "Gaussian High-Pass Filter (GHPF). Attenuates low frequencies with perfectly smooth decay; preserves clean, natural-looking edges with no halo artifacts."

    elif filter_family == "notch":
        # Notch rejection filter: symmetric notches centered at (u0, v0) and (-u0, -v0)
        D1 = np.sqrt((U - notch_u0) ** 2 + (V - notch_v0) ** 2)
        D2 = np.sqrt((U + notch_u0) ** 2 + (V + notch_v0) ** 2)
        
        # Butterworth notch reject
        notch_d0 = max(1.0, float(notch_d0))
        H1 = 1.0 / (1.0 + (notch_d0 / np.where(D1 == 0, 1e-6, D1)) ** (2 * order))
        H2 = 1.0 / (1.0 + (notch_d0 / np.where(D2 == 0, 1e-6, D2)) ** (2 * order))
        H = H1 * H2
        formula = rf"H_{{NR}}(u,v) = \prod_{{k=1}}^{{2}} \frac{{1}}{{1 + \left[ \frac{{D_0}}{{D_k(u,v)}} \right]^{{2n}}}} \quad (u_0={notch_u0}, v_0={notch_v0})"
        explanation = f"Notch Rejection Filter targeting periodic noise peaks at frequencies (+/-{notch_u0}, +/-{notch_v0}) with radius D0={notch_d0}."
    else:
        H = np.ones((h, w), dtype=np.float32)
        formula = "H(u,v) = 1"
        explanation = "All-pass filter."

    return H.astype(np.float32), formula, explanation


def apply_frequency_filter(
    img: np.ndarray,
    filter_family: str = "butterworth",
    pass_type: str = "lowpass",
    cutoff: float = 30.0,
    order: int = 2,
    notch_u0: float = 40.0,
    notch_v0: float = 40.0,
    notch_d0: float = 10.0
) -> Dict[str, Any]:
    """
    Execute complete 4-panel frequency domain processing:
    1. Spatial Original
    2. Centered Fourier Magnitude Spectrum
    3. 2D Filter Transfer Function Mask H(u, v)
    4. Reconstructed Output Image: g(x, y) = Real(IFFT2(fftshift_inv(F_shifted * H)))
    """
    gray = to_grayscale(img).astype(np.float32)
    h, w = gray.shape

    # 1. FFT
    F = np.fft.fft2(gray)
    F_shifted = np.fft.fftshift(F)

    # 2. Filter Mask H(u,v)
    H, formula, explanation = generate_filter_mask(
        (h, w),
        filter_family=filter_family,
        pass_type=pass_type,
        cutoff=cutoff,
        order=order,
        notch_u0=notch_u0,
        notch_v0=notch_v0,
        notch_d0=notch_d0
    )

    # 3. Filtering in Frequency Domain: G(u,v) = F(u,v) * H(u,v)
    G_shifted = F_shifted * H

    # 4. Inverse FFT: g(x, y) = IFFT(ifftshift(G_shifted))
    G = np.fft.ifftshift(G_shifted)
    g_complex = np.fft.ifft2(G)
    g_spatial = np.real(g_complex)
    g_reconstructed = np.clip(g_spatial, 0, 255).astype(np.uint8)

    # Spectra for visualizations
    # Original Spectrum
    orig_mag = np.log(1.0 + np.abs(F_shifted))
    max_orig = np.max(orig_mag)
    orig_mag_vis = (orig_mag / (max_orig if max_orig > 0 else 1.0) * 255.0).astype(np.uint8)

    # Filtered Spectrum
    filtered_mag = np.log(1.0 + np.abs(G_shifted))
    max_filt = np.max(filtered_mag)
    filt_mag_vis = (filtered_mag / (max_filt if max_filt > 0 else 1.0) * 255.0).astype(np.uint8)

    # Filter Mask Visualization (0..255)
    mask_vis = (H * 255.0).astype(np.uint8)

    # Colorize filter mask for sleek appearance (Cyan-Electric style)
    mask_colored = np.zeros((h, w, 3), dtype=np.uint8)
    mask_colored[:, :, 0] = (H * 30).astype(np.uint8)
    mask_colored[:, :, 1] = (H * 220).astype(np.uint8)
    mask_colored[:, :, 2] = (H * 255).astype(np.uint8)

    # Generate radial profile of H(D)
    d_max = int(min(h, w) // 2)
    sample_radii = np.linspace(0, d_max, 50)
    if filter_family == "ideal":
        profile_h = [1.0 if d <= cutoff else 0.0 for d in sample_radii] if pass_type == "lowpass" else [0.0 if d <= cutoff else 1.0 for d in sample_radii]
    elif filter_family == "butterworth":
        if pass_type == "lowpass":
            profile_h = [round(float(1.0 / (1.0 + (d / cutoff) ** (2 * order))), 4) for d in sample_radii]
        else:
            profile_h = [round(float(1.0 / (1.0 + (cutoff / max(1e-3, d)) ** (2 * order))), 4) for d in sample_radii]
    elif filter_family == "gaussian":
        if pass_type == "lowpass":
            profile_h = [round(float(np.exp(-(d ** 2) / (2.0 * cutoff ** 2))), 4) for d in sample_radii]
        else:
            profile_h = [round(float(1.0 - np.exp(-(d ** 2) / (2.0 * cutoff ** 2))), 4) for d in sample_radii]
    else:
        profile_h = [1.0 for _ in sample_radii]

    return {
        "panel_1_original": image_to_base64(img),
        "panel_2_spectrum": image_to_base64(orig_mag_vis),
        "panel_3_filter_mask": image_to_base64(mask_vis),
        "panel_3_filter_colored": image_to_base64(mask_colored),
        "panel_4_reconstructed": image_to_base64(g_reconstructed),
        "filtered_spectrum": image_to_base64(filt_mag_vis),
        "parameters": {
            "family": filter_family,
            "pass_type": pass_type,
            "cutoff_d0": cutoff,
            "order_n": order,
            "notch_u0": notch_u0,
            "notch_v0": notch_v0,
            "notch_d0": notch_d0,
        },
        "radial_profile": {
            "distances": [round(float(d), 1) for d in sample_radii],
            "transfer_h": profile_h,
        },
        "formula": formula,
        "explanation": explanation,
    }
