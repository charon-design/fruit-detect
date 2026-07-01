declare const cv: any;

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

/**
 * 检查 OpenCV.js 全局对象是否已就绪
 */
export function isOpencvReady(): boolean {
  return typeof cv !== 'undefined' && cv.Mat !== undefined;
}

/**
 * 等待 OpenCV.js 全局对象就绪
 */
export function waitForOpencv(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOpencvReady()) {
      resolve();
      return;
    }
    // cv 对象还未定义，轮询等待
    if (typeof cv === 'undefined') {
      const poll = setInterval(() => {
        if (typeof cv !== 'undefined') {
          clearInterval(poll);
          initListener();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(poll);
        if (!isOpencvReady()) {
          reject(new Error('等待 OpenCV.js 加载超时'));
        }
      }, 30000);
      return;
    }
    initListener();

    function initListener() {
      if (isOpencvReady()) {
        resolve();
        return;
      }
      const origInit = cv.onRuntimeInitialized;
      cv.onRuntimeInitialized = () => {
        if (origInit) origInit();
        resolve();
      };
      setTimeout(() => {
        if (isOpencvReady()) {
          resolve();
        } else {
          reject(new Error('等待 OpenCV.js 初始化超时'));
        }
      }, 30000);
    }
  });
}

/**
 * 将 cv.Mat 转为 base64 PNG data URL
 */
function matToDataUrl(mat: any): string {
  const canvas = document.createElement('canvas');
  cv.imshow(canvas, mat);
  return canvas.toDataURL('image/png');
}

/**
 * 执行完整的水果病害检测图像处理管线
 */
export function processImage(imageElement: HTMLImageElement): DetectionResult {
  // 将 HTMLImageElement 绘制到 canvas 上，再用 cv.imread 读取
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = imageElement.naturalWidth || imageElement.width;
  srcCanvas.height = imageElement.naturalHeight || imageElement.height;
  const ctx = srcCanvas.getContext('2d')!;
  ctx.drawImage(imageElement, 0, 0);

  const img = cv.imread(srcCanvas);
  const original = img.clone();

  // ---- 第1步：灰度转换 ----
  const gray = new cv.Mat();
  cv.cvtColor(img, gray, cv.COLOR_BGR2GRAY);

  // ---- 第2步：高斯模糊（σ=1.2，ksize=(0,0) 自动计算） ----
  const gaussianBlur = new cv.Mat();
  cv.GaussianBlur(gray, gaussianBlur, new cv.Size(0, 0), 1.2, 1.2);

  // ---- 第3步：中值模糊（3×3） ----
  const medianBlur = new cv.Mat();
  cv.medianBlur(gaussianBlur, medianBlur, 3);

  // ---- 第4步：直方图均衡化 ----
  const histEnhanced = new cv.Mat();
  cv.equalizeHist(medianBlur, histEnhanced);

  // ---- 第5步：自适应阈值分割 ----
  // 阈值系数 = 0.35，手动实现：mean*(1-0.35) 作为阈值
  const thresholdCoeff = 0.35;
  const meanVal = new cv.Mat();
  cv.blur(histEnhanced, meanVal, new cv.Size(51, 51));

  // 计算 custom_thresh_val = meanVal * (1 - thresholdCoeff)
  const customThreshVal = new cv.Mat();
  cv.multiply(meanVal, new cv.Mat.ones(meanVal.rows, meanVal.cols, meanVal.type()), customThreshVal, 1 - thresholdCoeff);

  // threshold: 大于阈值为0，否则为255（THRESH_BINARY_INV 逻辑）
  const threshold = new cv.Mat();
  cv.compare(histEnhanced, customThreshVal, threshold, cv.CMP_GT);
  // threshold 中 > 阈值的为 255( CMP_GT 返回 255)，需要取反
  const thresholdResult = new cv.Mat();
  cv.bitwise_not(threshold, thresholdResult);

  // ---- 第6步：形态学操作 ----
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const morphologyOpen = new cv.Mat();
  cv.morphologyEx(thresholdResult, morphologyOpen, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), 2);
  const morphology = new cv.Mat();
  cv.morphologyEx(morphologyOpen, morphology, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), 2);

  // ---- 计算指标 ----
  const totalPixels = morphology.rows * morphology.cols;
  const diseasePixels = cv.countNonZero(morphology);
  const diseaseRatio = diseasePixels / totalPixels;

  // 品质等级
  let qualityLevel: string;
  let qualityDesc: string;
  if (diseaseRatio < 0.02) {
    qualityLevel = 'A级（优）';
    qualityDesc = '病斑占比 < 2%，品质优良';
  } else if (diseaseRatio < 0.08) {
    qualityLevel = 'B级（良）';
    qualityDesc = '病斑占比 2%~8%，品质良好';
  } else if (diseaseRatio < 0.20) {
    qualityLevel = 'C级（中）';
    qualityDesc = '病斑占比 8%~20%，品质一般';
  } else {
    qualityLevel = 'D级（差）';
    qualityDesc = '病斑占比 ≥ 20%，品质较差';
  }

  // 新鲜度：健康果皮区域的灰度统计
  // 健康区域 = morphology 中为 0 的像素
  const healthyMask = new cv.Mat();
  cv.bitwise_not(morphology, healthyMask);

  let healthyMean = 0;
  let healthyStd = 0;

  const healthyMeanVal = new cv.Mat();
  const healthyStdVal = new cv.Mat();
  cv.meanStdDev(gray, healthyMeanVal, healthyStdVal, healthyMask);
  healthyMean = healthyMeanVal.data64F[0];
  healthyStd = healthyStdVal.data64F[0];

  // 新鲜度等级判断
  let freshnessLevel: string;
  let freshnessDesc: string;
  if (healthyMean > 120 && healthyStd > 30) {
    freshnessLevel = '新鲜';
    freshnessDesc = `均值=${healthyMean.toFixed(1)} (>120) 标准差=${healthyStd.toFixed(1)} (>30)，颜色鲜明且纹理丰富`;
  } else if (healthyMean > 80) {
    freshnessLevel = '较新鲜';
    freshnessDesc = `均值=${healthyMean.toFixed(1)} (80~120) 标准差=${healthyStd.toFixed(1)}，颜色尚可`;
  } else {
    freshnessLevel = '不新鲜';
    freshnessDesc = `均值=${healthyMean.toFixed(1)} (<80) 标准差=${healthyStd.toFixed(1)}，颜色暗淡或发黑`;
  }

  // ---- 生成结果标注图 ----
  const resultMarked = original.clone();
  const redOverlay = original.clone();

  // 找到病害区域轮廓
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(morphology, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  const contourCount = contours.size();

  // 用红色填充病害区域
  const diseaseMask3ch = new cv.Mat();
  cv.cvtColor(morphology, diseaseMask3ch, cv.COLOR_GRAY2BGR);
  const redColor = new cv.Mat(original.rows, original.cols, original.type(), new cv.Scalar(0, 0, 255, 255));
  redColor.copyTo(redOverlay, diseaseMask3ch);

  // 半透明混合：alpha=0.4 → addWeighted(red, 0.4, original, 0.6, 0)
  const blended = new cv.Mat();
  cv.addWeighted(redOverlay, 0.4, original, 0.6, 0, blended);

  // 绘制轮廓描边（红色，线宽2）
  const red = new cv.Scalar(0, 0, 255, 255);
  for (let i = 0; i < contours.size(); i++) {
    cv.drawContours(blended, contours, i, red, 2);
  }

  // ---- 编码各步骤图像为 base64 data URL ----
  const steps: StepImages = {
    gray: matToDataUrl(gray),
    gaussian_blur: matToDataUrl(gaussianBlur),
    median_blur: matToDataUrl(medianBlur),
    hist_enhanced: matToDataUrl(histEnhanced),
    threshold: matToDataUrl(thresholdResult),
    morphology: matToDataUrl(morphology),
  };
  const resultMarkedDataUrl = matToDataUrl(blended);

  const metrics: Metrics = {
    disease_ratio: Math.round(diseaseRatio * 1000000) / 1000000,
    quality_level: qualityLevel,
    quality_desc: qualityDesc,
    healthy_mean: Math.round(healthyMean * 100) / 100,
    healthy_std: Math.round(healthyStd * 100) / 100,
    freshness_level: freshnessLevel,
    freshness_desc: freshnessDesc,
    contour_count: contourCount,
  };

  // ---- 释放所有 cv.Mat 内存 ----
  img.delete();
  original.delete();
  gray.delete();
  gaussianBlur.delete();
  medianBlur.delete();
  histEnhanced.delete();
  meanVal.delete();
  customThreshVal.delete();
  threshold.delete();
  thresholdResult.delete();
  kernel.delete();
  morphologyOpen.delete();
  morphology.delete();
  healthyMask.delete();
  healthyMeanVal.delete();
  healthyStdVal.delete();
  resultMarked.delete();
  redOverlay.delete();
  redColor.delete();
  diseaseMask3ch.delete();
  blended.delete();
  contours.delete();
  hierarchy.delete();

  return {
    steps,
    result_marked: resultMarkedDataUrl,
    metrics,
  };
}
