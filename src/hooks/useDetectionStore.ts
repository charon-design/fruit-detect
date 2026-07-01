import { create } from "zustand";
import { processImage, waitForOpencv } from "@/utils/opencvProcessor";
import type { DetectionResult } from "@/utils/opencvProcessor";

interface DetectionState {
  file: File | null;
  originalUrl: string | null;
  result: DetectionResult | null;
  loading: boolean;
  error: string | null;

  setFile: (file: File | null) => void;
  detect: () => Promise<void>;
  reset: () => void;
}

export const useDetectionStore = create<DetectionState>((set, get) => ({
  file: null,
  originalUrl: null,
  result: null,
  loading: false,
  error: null,

  setFile: (file) => {
    const prev = get().originalUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      file,
      originalUrl: file ? URL.createObjectURL(file) : null,
      result: null,
      error: null,
    });
  },

  detect: async () => {
    const file = get().file;
    if (!file) return;

    set({ loading: true, error: null, result: null });

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("图片加载失败"));
      });

      await waitForOpencv();
      const result = processImage(img);
      URL.revokeObjectURL(img.src);

      set({ result, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "未知错误";
      set({ error: message, loading: false });
    }
  },

  reset: () => {
    const prev = get().originalUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      file: null,
      originalUrl: null,
      result: null,
      loading: false,
      error: null,
    });
  },
}));
