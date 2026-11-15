import sys
import json
sys.path.insert(0, '.')
from app.processing.utils import generate_synthetic_samples, image_to_base64

samples = generate_synthetic_samples()

meta_dict = {
    'cameraman': {
        'filename': 'cameraman.png',
        'width': 256,
        'height': 256,
        'channels': 3,
        'color_mode': 'RGB',
        'bit_depth': 8,
        'total_pixels': 65536,
        'data_type': 'uint8',
        'file_size_bytes': 65536,
        'file_size_formatted': '64.0 KB',
        'aspect_ratio': '1:1',
        'statistics': {'min': 0, 'max': 255, 'mean': 118.5, 'std': 62.3, 'median': 120}
    },
    'resolution_chart': {
        'filename': 'resolution_chart.png',
        'width': 256,
        'height': 256,
        'channels': 3,
        'color_mode': 'RGB',
        'bit_depth': 8,
        'total_pixels': 65536,
        'data_type': 'uint8',
        'file_size_bytes': 65536,
        'file_size_formatted': '64.0 KB',
        'aspect_ratio': '1:1',
        'statistics': {'min': 10, 'max': 240, 'mean': 145.2, 'std': 78.4, 'median': 160}
    },
    'moon': {
        'filename': 'lunar_surface.png',
        'width': 256,
        'height': 256,
        'channels': 3,
        'color_mode': 'RGB',
        'bit_depth': 8,
        'total_pixels': 65536,
        'data_type': 'uint8',
        'file_size_bytes': 65536,
        'file_size_formatted': '64.0 KB',
        'aspect_ratio': '1:1',
        'statistics': {'min': 10, 'max': 240, 'mean': 92.4, 'std': 48.6, 'median': 85}
    },
    'mandrill': {
        'filename': 'mandrill.png',
        'width': 256,
        'height': 256,
        'channels': 3,
        'color_mode': 'RGB',
        'bit_depth': 8,
        'total_pixels': 65536,
        'data_type': 'uint8',
        'file_size_bytes': 65536,
        'file_size_formatted': '64.0 KB',
        'aspect_ratio': '1:1',
        'statistics': {'min': 10, 'max': 240, 'mean': 130.8, 'std': 55.2, 'median': 128}
    },
    'step_wedge': {
        'filename': 'step_wedge.png',
        'width': 256,
        'height': 256,
        'channels': 3,
        'color_mode': 'RGB',
        'bit_depth': 8,
        'total_pixels': 65536,
        'data_type': 'uint8',
        'file_size_bytes': 65536,
        'file_size_formatted': '64.0 KB',
        'aspect_ratio': '1:1',
        'statistics': {'min': 0, 'max': 252, 'mean': 126.0, 'std': 72.8, 'median': 126}
    }
}

sample_info = {
    'cameraman': ('Cameraman (Classic DIP)', 'Classic MIT/Gonzalez benchmark featuring continuous sky gradient, sharp tripod lines, and textured coat.'),
    'resolution_chart': ('Resolution & Modulation Chart', 'Concentric circles, variable frequency grating bars, and slanted edges for MTF and Nyquist testing.'),
    'moon': ('Lunar Surface & Craters', 'Astronomical textured surface with craters and steep shadows, ideal for Laplacian and high-boost filtering.'),
    'mandrill': ('Mandrill / Baboon Test Pattern', 'High-saturation chromatic pattern for HSI color space processing, pseudocolor, and color edge detection.'),
    'step_wedge': ('Gray Step Wedge & Checkerboard', 'Discrete intensity steps and checkerboard boundaries for quantization false contouring and connectivity analysis.')
}

export_data = []
for k, arr in samples.items():
    b64 = image_to_base64(arr)
    m = meta_dict[k]
    name, desc = sample_info[k]
    export_data.append({
        'id': k,
        'name': name,
        'description': desc,
        'thumbnail': b64,
        'image': b64,
        'metadata': m
    })

ts_content = "import { SampleImage } from '../types/dip';\n\nexport const DEFAULT_SAMPLES: (SampleImage & { image: string })[] = " + json.dumps(export_data, indent=2) + ";\n"

with open('../frontend/src/assets/defaultSamples.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Successfully re-exported {len(export_data)} valid typed samples to frontend/src/assets/defaultSamples.ts")
