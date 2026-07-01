import { useDetectionStore } from "@/hooks/useDetectionStore";
import { ShieldCheck, Sparkles, Settings2 } from "lucide-react";

function QualityBadge({ level }: { level: string }) {
  const grade = level.charAt(0).toUpperCase();
  const badgeClass =
    grade === "A"
      ? "badge-a"
      : grade === "B"
      ? "badge-b"
      : grade === "C"
      ? "badge-c"
      : "badge-d";
  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-white font-bold text-lg ${badgeClass}`}
    >
      {level}
    </span>
  );
}

function FreshnessTag({ level }: { level: string }) {
  const isFresh = level === "新鲜";
  const isSomewhat = level === "较新鲜";
  const cls = isFresh
    ? "bg-forest-500 text-white"
    : isSomewhat
    ? "bg-orange-accent text-white"
    : "bg-red-500 text-white";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${cls}`}>
      {level}
    </span>
  );
}

export default function ReportPanel() {
  const { result } = useDetectionStore();

  if (!result) return null;

  const { metrics } = result;

  return (
    <div className="space-y-5">
      {/* 品质检测 */}
      <div className="rounded-2xl bg-white shadow-md overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-forest-600 to-forest-500 text-white flex items-center gap-2">
          <ShieldCheck size={18} />
          <span className="font-semibold text-sm">品质检测 — 病斑面积占比</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <QualityBadge level={metrics.quality_level} />
            <div>
              <p className="text-2xl font-mono font-bold text-forest-700">
                {(metrics.disease_ratio * 100).toFixed(2)}%
              </p>
              <p className="text-forest-400 text-sm">{metrics.quality_desc}</p>
            </div>
          </div>
          {/* 进度条 */}
          <div className="w-full h-3 rounded-full bg-forest-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(metrics.disease_ratio * 100, 100)}%`,
                background:
                  metrics.disease_ratio < 0.02
                    ? "linear-gradient(90deg, #2D6A4F, #40916C)"
                    : metrics.disease_ratio < 0.08
                    ? "linear-gradient(90deg, #40916C, #74C69D)"
                    : metrics.disease_ratio < 0.2
                    ? "linear-gradient(90deg, #F77F00, #FCBF49)"
                    : "linear-gradient(90deg, #E36414, #D62828)",
              }}
            />
          </div>
          <p className="text-xs text-forest-400 mt-2">
            检测到病斑区域数：{metrics.contour_count}
          </p>
        </div>
      </div>

      {/* 新鲜度检测 */}
      <div className="rounded-2xl bg-white shadow-md overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-orange-dark to-orange-accent text-white flex items-center gap-2">
          <Sparkles size={18} />
          <span className="font-semibold text-sm">新鲜度检测 — 健康果皮灰度统计</span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4 mb-3">
            <FreshnessTag level={metrics.freshness_level} />
            <p className="text-forest-500 text-sm">{metrics.freshness_desc}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-cream p-3 text-center">
              <p className="text-xs text-forest-400 mb-1">灰度均值</p>
              <p className="text-xl font-mono font-bold text-forest-700">
                {metrics.healthy_mean.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl bg-cream p-3 text-center">
              <p className="text-xs text-forest-400 mb-1">灰度标准差</p>
              <p className="text-xl font-mono font-bold text-forest-700">
                {metrics.healthy_std.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 处理参数 */}
      <div className="rounded-2xl bg-forest-800 text-white overflow-hidden">
        <div className="px-5 py-3 bg-forest-900 flex items-center gap-2">
          <Settings2 size={18} />
          <span className="font-semibold text-sm">图像处理参数</span>
        </div>
        <div className="p-5 font-mono text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex justify-between">
              <span className="text-forest-300">高斯 σ</span>
              <span className="text-orange-light">1.2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-300">中值滤波核</span>
              <span className="text-orange-light">3×3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-300">阈值系数</span>
              <span className="text-orange-light">0.35</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-300">结构元</span>
              <span className="text-orange-light">3×3 矩形</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-forest-300">形态学运算</span>
              <span className="text-orange-light">开运算 ×2 + 闭运算 ×2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
