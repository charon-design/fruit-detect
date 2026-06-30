import { Loader2, Apple, ScanSearch, RotateCcw } from "lucide-react";
import { useDetectionStore } from "@/hooks/useDetectionStore";
import UploadZone from "@/components/UploadZone";
import CompareView from "@/components/CompareView";
import StepGallery from "@/components/StepGallery";
import ReportPanel from "@/components/ReportPanel";

export default function Home() {
  const { file, loading, error, result, detect, reset } = useDetectionStore();

  return (
    <div className="min-h-screen bg-cream">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-cream/80 border-b border-forest-100/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-600 to-forest-400 flex items-center justify-center shadow-md">
              <Apple size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-forest-700 leading-tight">
                水果病害与新鲜度检测
              </h1>
              <p className="text-xs text-forest-400">
                纯数字图像处理 · 无需AI训练
              </p>
            </div>
          </div>
          {result && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 text-forest-600 text-sm hover:bg-forest-100 transition-colors"
            >
              <RotateCcw size={14} />
              重新检测
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 上传 + 操作区 */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UploadZone />
          </div>
          <div className="flex flex-col justify-center gap-4">
            <button
              onClick={detect}
              disabled={!file || loading}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: !file
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #1B4332, #2D6A4F, #F77F00)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  正在检测…
                </>
              ) : (
                <>
                  <ScanSearch size={20} />
                  一键检测
                </>
              )}
            </button>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
                {error}
              </div>
            )}
            {!file && !result && (
              <div className="text-center text-forest-300 text-sm">
                请先上传一张水果图片
              </div>
            )}
          </div>
        </section>

        {/* 结果区域 */}
        {result && (
          <>
            {/* 对比展示 */}
            <section>
              <h3 className="text-lg font-bold text-forest-700 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-forest-500" />
                原图与结果对比
              </h3>
              <CompareView />
            </section>

            {/* 中间步骤画廊 */}
            <section>
              <StepGallery />
            </section>

            {/* 检测报告 */}
            <section>
              <h3 className="text-lg font-bold text-forest-700 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-orange-accent" />
                检测报告
              </h3>
              <ReportPanel />
            </section>
          </>
        )}

        {/* 等待提示 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-2xl bg-forest-50 flex items-center justify-center animate-pulse-soft">
              <Apple size={36} className="text-forest-500" />
            </div>
            <p className="text-forest-500 font-medium">
              正在执行图像处理管线…
            </p>
            <p className="text-forest-300 text-sm">
              灰度 → 滤波 → 增强 → 分割 → 形态学 → 评级
            </p>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="mt-12 border-t border-forest-100/50 py-6 text-center text-forest-300 text-xs">
        水果病害与新鲜度检测系统 · 纯数字图像处理 · PyQt5 / Flask + React
      </footer>
    </div>
  );
}
