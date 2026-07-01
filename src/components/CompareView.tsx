import { useDetectionStore } from "@/hooks/useDetectionStore";

export default function CompareView() {
  const { originalUrl, result } = useDetectionStore();

  if (!result) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 原图 */}
      <div className="rounded-2xl bg-white shadow-md overflow-hidden card-hover">
        <div className="px-4 py-3 bg-forest-600 text-white text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-forest-200" />
          原始图片
        </div>
        <div className="p-4">
          {originalUrl && (
            <img
              src={originalUrl}
              alt="原图"
              className="w-full rounded-lg object-contain max-h-80"
            />
          )}
        </div>
      </div>

      {/* 结果图 */}
      <div className="rounded-2xl bg-white shadow-md overflow-hidden card-hover">
        <div className="px-4 py-3 bg-gradient-to-r from-orange-dark to-orange-accent text-white text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-light" />
          检测结果 — 病斑标注
        </div>
        <div className="p-4">
          <img
            src={result.result_marked}
            alt="检测结果"
            className="w-full rounded-lg object-contain max-h-80"
          />
        </div>
      </div>
    </div>
  );
}
