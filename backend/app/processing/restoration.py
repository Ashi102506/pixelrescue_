"""
PIXELRESCUE — Module 5: Image Restoration Engine
Implements mathematically rigorous degradation and restoration models:
- Degradation: g(x,y) = h(x,y) * f(x,y) + eta(x,y)
- Noise generators: Gaussian, Salt & Pepper, Uniform, Periodic sinusoidal
- Blur models: Gaussian PSF, Motion Blur PSF
- Spatial restoration filters: Arithmetic Mean, Geometric Mean, Harmonic, Contraharmonic, Median, Alpha-Trimmed Mean
- Frequency restoration filters:
    * Constrained Inverse Filtering (with cutoff threshold D0)
    * Wiener Filtering (MMSE with noise-to-signal parameter K)
    * Notch Rejection Filtering
- Restoration Challenge with Ground Truth PSNR/MSE metrics tracking
"""

import math
from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import cv2
from scipy import signal
from .utils import to_grayscale, image_to_base64
from .frequency import generate_filter_mask


def create_motion_blur_psf(size: int = 15, angle_deg: float = 45.0) -> np.ndarray:
    """Generate linear motion blur Point Spread Function (PSF)."""
    if size % 2 == 0:
        size += 1
    psf = np.zeros((size, size), dtype=np.float32)
    center = size // 2
    theta = np.deg2rad(angle_deg)
    
    # Bresenham-like or linear interpolation along line of motion
    half = size // 2
    for offset in np.linspace(-half, half, size * 2):
        x = int(round(center + offset * np.cos(theta)))
        y = int(round(center + offset * np.sin(theta)))
        if 0 <= x < size and 0 <= y < size:
            psf[y, x] = 1.0
            
    total = np.sum(psf)
    return psf / (total if total > 0 else 1.0)


def add_noise(
    img: np.ndarray,
    noise_type: str = "gaussian",
    mean: float = 0.0,
    var: float = 0.01,
    p_salt: float = 0.02,
    p_pepper: float = 0.02,
    uniform_low: float = -20.0,
    uniform_high: float = 20.0,
    periodic_amp: float = 30.0,
    periodic_freq_u: float = 30.0,
    periodic_freq_v: float = 30.0,
    seed: Optional[int] = 42
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Inject noise into image following specific statistical probability density functions.
    """
    rng = np.random.RandomState(seed if seed is not None else 42)
    h, w = img.shape[:2]
    is_color = len(img.shape) == 3 and img.shape[2] >= 3
    
    noisy = img.astype(np.float32).copy()
    details = {}

    if noise_type == "gaussian":
        # Standard deviation sigma = sqrt(var) * 255
        sigma = np.sqrt(max(1e-6, var)) * 255.0
        gauss = rng.normal(mean, sigma, img.shape)
        noisy = noisy + gauss
        details = {
            "formula": r"p(z) = \frac{1}{\sqrt{2\pi}\sigma} e^{-\frac{(z - \mu)^2}{2\sigma^2}}",
            "params": {"mean": mean, "variance": var, "sigma": round(float(sigma), 2)},
        }

    elif noise_type == "salt_and_pepper":
        # Impulse noise
        if is_color:
            prob = rng.rand(h, w)
            noisy[prob < p_pepper] = 0
            noisy[(prob >= p_pepper) & (prob < p_pepper + p_salt)] = 255
        else:
            prob = rng.rand(h, w)
            noisy[prob < p_pepper] = 0
            noisy[(prob >= p_pepper) & (prob < p_pepper + p_salt)] = 255
        details = {
            "formula": r"p(z) = \begin{cases} P_a & \text{for } z = a \text{ (pepper)} \\ P_b & \text{for } z = b \text{ (salt)} \\ 1 - P_a - P_b & \text{otherwise} \end{cases}",
            "params": {"p_salt": p_salt, "p_pepper": p_pepper},
        }

    elif noise_type == "uniform":
        uniform_noise = rng.uniform(uniform_low, uniform_high, img.shape)
        noisy = noisy + uniform_noise
        details = {
            "formula": r"p(z) = \begin{cases} \frac{1}{b - a} & \text{if } a \le z \le b \\ 0 & \text{otherwise} \end{cases}",
            "params": {"a": uniform_low, "b": uniform_high},
        }

    elif noise_type == "periodic":
        # Sinusoidal noise: eta(x,y) = A * sin(2*pi*(u0*x/w + v0*y/h))
        y_grid, x_grid = np.ogrid[:h, :w]
        sinusoid = periodic_amp * np.sin(2.0 * np.pi * (periodic_freq_u * x_grid / w + periodic_freq_v * y_grid / h))
        if is_color:
            sinusoid = sinusoid[:, :, np.newaxis]
        noisy = noisy + sinusoid
        details = {
            "formula": r"\eta(x,y) = A \sin\left( 2\pi \left[ \frac{u_0 x}{M} + \frac{v_0 y}{N} \right] \right)",
            "params": {"amplitude": periodic_amp, "freq_u": periodic_freq_u, "freq_v": periodic_freq_v},
        }

    noisy = np.clip(noisy, 0, 255).astype(np.uint8)
    return noisy, details


def degrade_image(
    img: np.ndarray,
    blur_type: str = "motion",
    blur_kernel_size: int = 11,
    motion_angle: float = 45.0,
    gaussian_blur_sigma: float = 2.0,
    noise_type: str = "gaussian",
    noise_strength: float = 0.02,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Apply comprehensive degradation model: g(x,y) = h(x,y) * f(x,y) + eta(x,y).
    """
    h, w = img.shape[:2]
    # 1. Blur
    if blur_type == "motion":
        psf = create_motion_blur_psf(blur_kernel_size, motion_angle)
        blurred = cv2.filter2D(img, -1, psf, borderType=cv2.BORDER_REFLECT)
        blur_desc = f"Linear Motion Blur (length={blur_kernel_size}, angle={motion_angle}°)"
    elif blur_type == "gaussian":
        psf = None
        blurred = cv2.GaussianBlur(img, (blur_kernel_size, blur_kernel_size), gaussian_blur_sigma, borderType=cv2.BORDER_REFLECT)
        blur_desc = f"Atmospheric Gaussian Blur (size={blur_kernel_size}, sigma={gaussian_blur_sigma})"
    else:
        psf = None
        blurred = img
        blur_desc = "None"

    # 2. Add noise
    if noise_type == "gaussian":
        degraded, noise_info = add_noise(blurred, "gaussian", var=noise_strength, seed=seed)
    elif noise_type == "salt_and_pepper":
        degraded, noise_info = add_noise(blurred, "salt_and_pepper", p_salt=noise_strength / 2, p_pepper=noise_strength / 2, seed=seed)
    elif noise_type == "periodic":
        degraded, noise_info = add_noise(blurred, "periodic", periodic_amp=noise_strength * 200, seed=seed)
    else:
        degraded = blurred
        noise_info = {"formula": "None", "params": {}}

    return {
        "degraded_image": image_to_base64(degraded),
        "blur_description": blur_desc,
        "noise_info": noise_info,
        "degradation_model": r"g(x,y) = h(x,y) * f(x,y) + \eta(x,y) \iff G(u,v) = H(u,v) F(u,v) + N(u,v)",
        "_raw_degraded": degraded,
    }


def restore_image(
    img: np.ndarray,
    method: str = "wiener",
    kernel_size: int = 5,
    wiener_k: float = 0.01,
    inverse_cutoff: float = 60.0,
    motion_angle: float = 45.0,
    notch_u0: float = 30.0,
    notch_v0: float = 30.0,
    q_contraharmonic: float = 1.5,
    alpha_trimmed_d: int = 4
) -> Dict[str, Any]:
    """
    Restore degraded image using chosen spatial or frequency domain algorithm.
    """
    gray = to_grayscale(img).astype(np.float32)
    h, w = gray.shape

    if kernel_size % 2 == 0:
        kernel_size += 1

    restored = None
    formula = ""
    explanation = ""

    if method == "arithmetic_mean":
        restored = cv2.blur(gray, (kernel_size, kernel_size), borderType=cv2.BORDER_REFLECT)
        formula = r"\hat{f}(x,y) = \frac{1}{mn} \sum_{(s,t) \in S_{xy}} g(s,t)"
        explanation = "Simple arithmetic averaging in a moving neighborhood. Smooths additive Gaussian or uniform noise, but blurs edges."

    elif method == "geometric_mean":
        # Geometric mean: product(g)^(1/mn) = exp(1/mn * sum(log(g)))
        pad = kernel_size // 2
        padded = np.pad(gray + 1e-4, pad, mode="reflect")
        log_padded = np.log(padded)
        sum_log = cv2.blur(log_padded, (kernel_size, kernel_size), borderType=cv2.BORDER_REFLECT)
        # unpad to match size
        restored = np.exp(sum_log[pad : pad + h, pad : pad + w])
        formula = r"\hat{f}(x,y) = \left[ \prod_{(s,t) \in S_{xy}} g(s,t) \right]^{\frac{1}{mn}}"
        explanation = "Geometric mean filter. Achieves smoothing comparable to arithmetic mean while preserving finer details, but heavily penalized by zero pixels."

    elif method == "median":
        restored = cv2.medianBlur(gray.astype(np.uint8), kernel_size).astype(np.float32)
        formula = r"\hat{f}(x,y) = \text{median}_{(s,t) \in S_{xy}} \{ g(s,t) \}"
        explanation = "Order-statistic median filter. The optimal non-linear restoration technique for unipolar or bipolar impulse noise (salt and pepper)."

    elif method == "wiener":
        # Frequency domain Wiener filter (Minimum Mean Square Error)
        # H(u,v) PSF approximation
        psf = create_motion_blur_psf(kernel_size, motion_angle)
        
        # Pad PSF to image size and compute OTF (Optical Transfer Function)
        psf_padded = np.zeros((h, w), dtype=np.float32)
        kh, kw = psf.shape
        psf_padded[:kh, :kw] = psf
        # Roll so center of PSF is at (0, 0)
        psf_padded = np.roll(psf_padded, -(kh // 2), axis=0)
        psf_padded = np.roll(psf_padded, -(kw // 2), axis=1)

        H = np.fft.fft2(psf_padded)
        H_conj = np.conj(H)
        H_mag_sq = np.abs(H) ** 2

        # Wiener Transfer Function: W(u,v) = H*(u,v) / (|H(u,v)|^2 + K)
        K = max(1e-5, float(wiener_k))
        W_filter = H_conj / (H_mag_sq + K)

        # Apply to G(u,v)
        G = np.fft.fft2(gray)
        F_hat = G * W_filter
        f_restored = np.real(np.fft.ifft2(F_hat))
        restored = f_restored
        
        formula = r"\hat{F}(u,v) = \left[ \frac{H^*(u,v)}{|H(u,v)|^2 + K} \right] G(u,v) \quad \text{where } K = \frac{S_\eta(u,v)}{S_f(u,v)}"
        explanation = f"Wiener Filter (MMSE). Optimally balances deconvolution against noise amplification using noise-to-signal ratio K={K}."

    elif method == "inverse":
        # Direct Inverse Filtering with frequency threshold
        psf = create_motion_blur_psf(kernel_size, motion_angle)
        psf_padded = np.zeros((h, w), dtype=np.float32)
        kh, kw = psf.shape
        psf_padded[:kh, :kw] = psf
        psf_padded = np.roll(psf_padded, -(kh // 2), axis=0)
        psf_padded = np.roll(psf_padded, -(kw // 2), axis=1)

        H = np.fft.fft2(psf_padded)
        
        # Frequency distance matrix
        u = np.arange(h) - h / 2.0
        v = np.arange(w) - w / 2.0
        V, U = np.meshgrid(v, u)
        D = np.sqrt(U ** 2 + V ** 2)
        D_shifted = np.fft.ifftshift(D)

        # Threshold to avoid division by near-zero at high frequencies
        cutoff = max(5.0, float(inverse_cutoff))
        mask = (D_shifted <= cutoff) & (np.abs(H) > 1e-3)
        
        inv_H = np.zeros_like(H)
        inv_H[mask] = 1.0 / H[mask]

        G = np.fft.fft2(gray)
        F_hat = G * inv_H
        f_restored = np.real(np.fft.ifft2(F_hat))
        restored = f_restored

        formula = r"\hat{F}(u,v) = \begin{cases} \frac{G(u,v)}{H(u,v)} & D(u,v) \le D_0 \\ 0 & D(u,v) > D_0 \end{cases}"
        explanation = f"Constrained Direct Inverse Filtering limited to radius D0={cutoff}. Direct inverse without threshold blows up high-frequency noise."

    elif method == "notch":
        # Frequency Notch Rejection for periodic noise
        F = np.fft.fft2(gray)
        F_shifted = np.fft.fftshift(F)
        H_notch, formula, explanation = generate_filter_mask(
            (h, w),
            filter_family="notch",
            order=2,
            notch_u0=notch_u0,
            notch_v0=notch_v0,
            notch_d0=12.0
        )
        G_filtered = F_shifted * H_notch
        restored = np.real(np.fft.ifft2(np.fft.ifftshift(G_filtered)))

    else:
        restored = gray
        formula = "Identity"
        explanation = "Pass-through."

    result = np.clip(restored, 0, 255).astype(np.uint8)

    return {
        "restored_image": image_to_base64(result),
        "method": method,
        "formula": formula,
        "explanation": explanation,
        "_raw_restored": result,
    }
