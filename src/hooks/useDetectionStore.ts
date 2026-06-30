import { create } from "zustand";

export interface StepImages {
  gray: string;
  gaussian_blur: string;
  median_blur: string;
  hist_enhanced: string;
  threshold: string;
  morphology: string;
}

export interface Metrics {
  disease_ratio: number;
  quality_level: string;
  quality_desc: string;
  healthy_mean: number;
  healthy_std: number;
  freshness_level: string;
  freshness_desc: string;
  contour_count: number;
}

export interface DetectionResult {
  steps: StepImages;
  result_marked: string;
  metrics: Metrics;
}

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
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `请求失败 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "检测失败");
      }

      set({ result: data.data, loading: false });
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
