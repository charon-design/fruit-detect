import { useCallback, useRef, useState } from "react";
import { Upload, ImagePlus, X } from "lucide-react";
import { useDetectionStore } from "@/hooks/useDetectionStore";

export default function UploadZone() {
  const { file, originalUrl, setFile } = useDetectionStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);

  const handleFile = useCallback(
    (f: FileList | null) => {
      if (f && f[0]) setFile(f[0]);
    },
    [setFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragover(false);
      handleFile(e.dataTransfer.files);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      {originalUrl ? (
        <div className="relative rounded-2xl overflow-hidden bg-white shadow-md card-hover">
          <img
            src={originalUrl}
            alt="已上传图片"
            className="w-full max-h-72 object-contain"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-forest-900/70 to-transparent px-4 py-3">
            <p className="text-white text-sm truncate">{file?.name}</p>
            <p className="text-white/70 text-xs">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ""}
            </p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-forest-900/60 hover:bg-red-500/80 text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragover(true);
          }}
          onDragLeave={() => setDragover(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`upload-zone ${dragover ? "dragover" : ""} rounded-2xl bg-white/60 cursor-pointer flex flex-col items-center justify-center py-16 px-8 transition-all`}
        >
          <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
            {dragover ? (
              <ImagePlus size={28} className="text-orange-accent" />
            ) : (
              <Upload size={28} className="text-forest-500" />
            )}
          </div>
          <p className="text-forest-600 font-medium text-base mb-1">
            {dragover ? "松开即可上传" : "拖拽图片到这里，或点击选择"}
          </p>
          <p className="text-forest-400 text-sm">
            支持 JPG / PNG / BMP 格式
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files)}
          />
        </div>
      )}
    </div>
  );
}
