import { useDetectionStore } from "@/hooks/useDetectionStore";
import type { StepImages } from "@/utils/opencvProcessor";

const STEP_META: { key: keyof StepImages; label: string; desc: string }[] = [
  { key: "gray", label: "灰度图", desc: "RGB → 灰度" },
  { key: "gaussian_blur", label: "高斯滤波", desc: "σ = 1.2" },
  { key: "median_blur", label: "中值滤波", desc: "3×3 核" },
  { key: "hist_enhanced", label: "直方图均衡", desc: "对比度增强" },
  { key: "threshold", label: "阈值分割", desc: "系数 0.35" },
  { key: "morphology", label: "形态学去噪", desc: "开+闭运算" },
];

export default function StepGallery() {
  const { result } = useDetectionStore();

  if (!result) return null;

  return (
    <div>
      <h3 className="text-lg font-bold text-forest-700 mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 rounded-full bg-orange-accent" />
        图像处理中间步骤
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STEP_META.map((step, i) => (
          <div
            key={step.key}
            className="step-card rounded-xl bg-white shadow-sm overflow-hidden border border-forest-100/50"
          >
            <div className="px-3 py-2 bg-forest-50/80 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-forest-600 text-white text-xs flex items-center justify-center font-mono font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-forest-700 text-sm font-medium leading-tight">
                  {step.label}
                </p>
                <p className="text-forest-400 text-xs leading-tight">
                  {step.desc}
                </p>
              </div>
            </div>
            <div className="p-2">
              <img
                src={result.steps[step.key]}
                alt={step.label}
                className="w-full rounded-md object-contain max-h-44"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
