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
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Center Image Workspace with Heatmap */}
      <div className="flex-1 p-4 flex flex-col min-w-0">
        <ImageViewer differenceImage={metrics?.error_heatmap} />
      </div>

      {/* Right Inspector & Metric Cards */}
      <div className="w-full lg:w-96 bg-charcoal-900 border-l border-slate-800 p-5 overflow-y-auto space-y-6 select-none shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-blue-400 font-semibold tracking-wider uppercase">
              Module 7
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">Quality Analysis</h2>
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
            className="p-1.5 rounded-lg bg-charcoal-850 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            <HelpCircle size={16} className="text-blue-400" />
          </button>
        </div>

        {/* Primary Metric Scorecards */}
        {metrics && (
          <div className="space-y-3 font-mono">
            {/* PSNR */}
            <div className="bg-charcoal-950 p-4 rounded-xl border border-cyan-500/40 shadow-glow-cyan">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-bold uppercase">PSNR Fidelity</span>
                <span className="text-[10px] text-slate-400">Peak Signal-to-Noise</span>
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {metrics.psnr_db.toFixed(2)} <span className="text-sm font-normal text-cyan-400">dB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                {metrics.psnr_db > 35
                  ? 'Excellent reconstruction fidelity'
                  : metrics.psnr_db > 25
                  ? 'Moderate fidelity / noticeable transformation'
                  : 'High distortion or heavy filtering'}
              </div>
            </div>

            {/* SSIM */}
            <div className="bg-charcoal-950 p-4 rounded-xl border border-violet-500/40 shadow-glow-violet">
              <div className="flex justify-between items-center text-xs">
                <span className="text-violet-400 font-bold uppercase">SSIM Index</span>
                <span className="text-[10px] text-slate-400">Structural Similarity</span>
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {metrics.ssim.toFixed(4)} <span className="text-sm font-normal text-violet-400">/ 1.0</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                Human visual perception structural correlation score.
              </div>
            </div>

            {/* MSE & Entropy */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Mean Squared Error</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">{metrics.mse.toFixed(2)}</div>
              </div>
              <div className="bg-charcoal-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Processed Entropy</div>
                <div className="text-base font-bold text-slate-200 mt-0.5">
                  {metrics.entropy_processed.toFixed(2)} <span className="text-[10px] font-normal">b/px</span>
                </div>
              </div>
            </div>

            {/* Statistical Distances */}
            <div className="bg-charcoal-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block border-b border-slate-800 pb-1">
                Histogram Statistical Distances
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400">Correlation:</span>
                <span className="text-cyan-400 font-bold">{metrics.histogram_correlation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chi-Square:</span>
                <span className="text-slate-200 font-bold">{metrics.histogram_chi_square}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bhattacharyya:</span>
                <span className="text-violet-400 font-bold">{metrics.histogram_bhattacharyya}</span>
              </div>
            </div>

            {/* Download Report Button */}
            <button
              onClick={handleDownloadReport}
              className="w-full py-2.5 bg-charcoal-850 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center justify-center space-x-2 transition-colors shadow-md mt-4"
            >
              <Download size={14} className="text-cyan-400" />
              <span>Download Academic Report (.md)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
