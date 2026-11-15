import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  HelpCircle,
  Download,
  Share2,
  FileText,
  Activity,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { ImageViewer } from '../common/ImageViewer';
import { MathFormula } from '../common/MathFormula';
import { api } from '../../services/api';
import { QualityMetrics } from '../../types/dip';

export const QualityLab: React.FC = () => {
  const { originalImage, processedImage, activeAlgorithm, activeMetrics, metadata, openMathModal, setProcessing } =
    useWorkspaceStore();

  const [metrics, setMetrics] = useState<QualityMetrics | null>(activeMetrics);

  const handleComputeMetrics = async () => {
    if (!originalImage || !processedImage) return;
    setProcessing(true, 'Computing objective quality metrics (MSE, PSNR, SSIM, Entropy)...');
    try {
      const res = await api.compareQuality(originalImage, processedImage);
      setMetrics(res);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (originalImage && processedImage) {
      handleComputeMetrics();
    }
  }, [originalImage, processedImage]);

  const handleDownloadReport = () => {
    if (!metrics || !metadata) return;

    const report = `# PIXELRESCUE — SCIENTIFIC IMAGE PROCESSING EXPERIMENT REPORT
Generated: ${new Date().toISOString()}
Academic Standard: Gonzalez & Woods Digital Image Processing (4th Ed.)

## 1. IMAGE METADATA
- Filename: ${metadata.filename}
- Resolution: ${metadata.width} × ${metadata.height} px
- Color Space: ${metadata.color_mode} (${metadata.bit_depth}-bit)
- Total Pixels: ${metadata.total_pixels}
- File Size: ${metadata.file_size_formatted}

## 2. APPLIED PROCESSING
- Active Algorithm: ${activeAlgorithm}
- Mathematical Formulation: Embedded in system pipeline

## 3. OBJECTIVE MATHEMATICAL METRICS
| Metric | Calculated Value | Ideal/Interpretation |
| :--- | :--- | :--- |
| **Mean Squared Error (MSE)** | ${metrics.mse} | 0.0 indicates identical images |
| **Peak Signal-to-Noise Ratio (PSNR)** | ${metrics.psnr_db} dB | > 30 dB is high fidelity; > 40 dB is excellent |
| **Structural Similarity (SSIM)** | ${metrics.ssim.toFixed(4)} | 1.0 indicates identical perceptual structure |
| **Original Shannon Entropy** | ${metrics.entropy_original} bits/pixel | Measure of information richness (0..8) |
| **Processed Shannon Entropy** | ${metrics.entropy_processed} bits/pixel | Delta: ${metrics.entropy_delta} |
| **Histogram Correlation** | ${metrics.histogram_correlation} | 1.0 = identical probability distribution |
| **Bhattacharyya Distance** | ${metrics.histogram_bhattacharyya} | 0.0 = identical distributions |

---
PIXELRESCUE Scientific Verification Engine
`;

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelrescue_report_${metadata.filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-obsidian-950">
      {/* Center Image Workspace with Heatmap */}
      <div className="flex-1 p-3 flex flex-col min-w-0">
        <ImageViewer differenceImage={metrics?.error_heatmap} />
      </div>

      {/* Right Inspector & Metric Cards */}
      <div className="w-full lg:w-96 bg-obsidian-900 border-l border-hairline p-4 overflow-y-auto space-y-4 select-none shrink-0 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
              07
            </span>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Quality Analysis
              </h2>
              <p className="text-[10px] font-mono text-slate-500">Objective Fidelity & SSIM Metrology</p>
            </div>
          </div>
          <button
            onClick={() =>
              openMathModal({
                title: 'Objective Image Quality Metrics',
                category: 'Quality Assessment',
                formula: String.raw`\text{PSNR} = 10 \cdot \log_{10}\left( \frac{255^2}{\text{MSE}} \right), \quad \text{SSIM} = \frac{(2\mu_x\mu_y + c_1)(2\sigma_{xy} + c_2)}{(\mu_x^2 + \mu_y^2 + c_1)(\sigma_x^2 + \sigma_y^2 + c_2)}`,
                variables: [
                  { symbol: 'MSE', meaning: 'Mean Squared Error: 1/(MN) * sum((I_orig - I_proc)^2)' },
                  { symbol: 'PSNR', meaning: 'Peak Signal-to-Noise Ratio in decibels (dB)' },
                  { symbol: 'SSIM', meaning: 'Structural Similarity Index combining luminance, contrast, and structure' },
                  { symbol: 'Entropy (H)', meaning: 'Shannon information content: -sum( p(i) * log2(p(i)) )' },
                ],
                explanation:
                  'Subjective human visual inspection is inconsistent; objective numerical metrics provide mathematically reproducible measurement. PSNR measures pixel amplitude fidelity against noise. SSIM models human visual perception by comparing local luminance, contrast, and structural covariance. Shannon entropy measures average information content in bits/pixel.',
                complexity: 'O(M * N)',
                reference: 'Gonzalez & Woods, Digital Image Processing, Section 8.1 & 11.4',
              })
            }
            className="p-1.5 rounded bg-surface-raised hover:bg-surface-overlay border border-hairline text-slate-400 hover:text-slate-200 transition-colors"
            title="Algorithm Theory"
          >
            <HelpCircle size={13} className="text-cyan-400" />
          </button>
        </div>

        {/* Primary Metric Scorecards */}
        {metrics && (
          <div className="space-y-3 font-mono">
            {/* PSNR */}
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-cyan-400 font-semibold uppercase tracking-wider">PSNR Fidelity</span>
                <span className="text-slate-500">Peak Signal-to-Noise</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {metrics.psnr_db.toFixed(2)} <span className="text-xs font-mono text-cyan-400">dB</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans pt-0.5">
                {metrics.psnr_db > 35
                  ? 'High fidelity reconstruction; minimal artifact distortion.'
                  : metrics.psnr_db > 25
                  ? 'Moderate fidelity with noticeable transform alteration.'
                  : 'Substantial structural variance or high frequency loss.'}
              </div>
            </div>

            {/* SSIM */}
            <div className="bg-surface-raised p-3.5 rounded-lg border border-hairline space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-purple-400 font-semibold uppercase tracking-wider">SSIM Index</span>
                <span className="text-slate-500">Structural Similarity</span>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {metrics.ssim.toFixed(4)} <span className="text-xs font-mono text-slate-500">/ 1.0</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans pt-0.5">
                Luminance, contrast, and structure covariance match score.
              </div>
            </div>

            {/* MSE & Entropy */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-surface-raised p-3 rounded-lg border border-hairline">
                <div className="text-[9px] text-slate-500 uppercase">MSE Error</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 tabular-nums">{metrics.mse.toFixed(2)}</div>
              </div>
              <div className="bg-surface-raised p-3 rounded-lg border border-hairline">
                <div className="text-[9px] text-slate-500 uppercase">Processed Entropy</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 tabular-nums">
                  {metrics.entropy_processed.toFixed(2)} <span className="text-[9px] font-normal text-slate-500">bpp</span>
                </div>
              </div>
            </div>

            {/* Statistical Distances */}
            <div className="bg-surface-raised p-3 rounded-lg border border-hairline space-y-1.5 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block border-b border-hairline pb-1">
                Histogram Statistical Distances
              </span>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Correlation (r):</span>
                <span className="text-cyan-400 font-bold tabular-nums">{metrics.histogram_correlation}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Chi-Square (χ²):</span>
                <span className="text-slate-200 font-bold tabular-nums">{metrics.histogram_chi_square}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Bhattacharyya:</span>
                <span className="text-purple-400 font-bold tabular-nums">{metrics.histogram_bhattacharyya}</span>
              </div>
            </div>

            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="w-full py-2 bg-slate-100 hover:bg-white text-obsidian-950 font-semibold rounded text-xs flex items-center justify-center space-x-2 border border-white/20 transition-all shadow-sm active:scale-[0.99] mt-3"
            >
              <Download size={13} />
              <span>Download Academic Report (.md)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
