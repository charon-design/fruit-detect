"""
水果病害与新鲜度检测 Flask 后端服务
使用 OpenCV 图像处理管线实现病害斑点检测和新鲜度评估
"""

import base64
import io
import os

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder=None)
CORS(app)  # 开发模式跨域支持

# React 构建产物目录（生产模式使用）
BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dist')


def encode_image_to_base64(img):
    """将 OpenCV 图像编码为 base64 PNG 字符串"""
    _, buffer = cv2.imencode('.png', img)
    return base64.b64encode(buffer).decode('utf-8')


def process_image(image_bytes):
    """
    执行完整的图像处理管线，返回各步骤图像和检测结果
    """
    # 解码上传的图像
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    original = img.copy()

    # ---- 第1步：灰度转换 ----
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ---- 第2步：高斯模糊（σ=1.2，核大小自动计算） ----
    # OpenCV 高斯核大小必须为奇数，σ=1.2 时自动计算核大小
    # 当 ksize=(0,0) 时，OpenCV 会根据 sigma 自动计算核大小
    gaussian_blur = cv2.GaussianBlur(gray, (0, 0), sigmaX=1.2, sigmaY=1.2)

    # ---- 第3步：中值模糊（3×3） ----
    median_blur = cv2.medianBlur(gaussian_blur, 3)

    # ---- 第4步：直方图均衡化 ----
    hist_enhanced = cv2.equalizeHist(median_blur)

    # ---- 第5步：自适应阈值分割 ----
    # 阈值系数 = 0.35，公式：mean * (1 - 0.35)，THRESH_BINARY_INV
    threshold_coeff = 0.35
    threshold = cv2.adaptiveThreshold(
        hist_enhanced,
        255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=51,  # 局部邻域块大小
        C=0  # 常数偏移，使用 mean * (1 - coeff) 代替
    )
    # 自定义阈值：mean * (1 - 0.35)
    # 由于 cv2.adaptiveThreshold 不支持自定义公式，手动实现
    # 使用均值作为局部阈值基准
    mean_val = cv2.blur(hist_enhanced, (51, 51))
    custom_thresh_val = mean_val * (1 - threshold_coeff)
    threshold = np.where(hist_enhanced > custom_thresh_val, 0, 255).astype(np.uint8)

    # ---- 第6步：形态学操作 ----
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    # 开运算：2次迭代
    morphology = cv2.morphologyEx(threshold, cv2.MORPH_OPEN, kernel, iterations=2)
    # 闭运算：2次迭代
    morphology = cv2.morphologyEx(morphology, cv2.MORPH_CLOSE, kernel, iterations=2)

    # ---- 计算指标 ----
    total_pixels = morphology.shape[0] * morphology.shape[1]
    disease_pixels = cv2.countNonZero(morphology)
    disease_ratio = disease_pixels / total_pixels

    # 品质等级：根据病害斑点面积占比
    if disease_ratio < 0.02:
        quality_level = 'A级（优）'
        quality_desc = '病斑占比 < 2%，品质优良'
    elif disease_ratio < 0.08:
        quality_level = 'B级（良）'
        quality_desc = '病斑占比 2%~8%，品质良好'
    elif disease_ratio < 0.20:
        quality_level = 'C级（中）'
        quality_desc = '病斑占比 8%~20%，品质一般'
    else:
        quality_level = 'D级（差）'
        quality_desc = '病斑占比 ≥ 20%，品质较差'

    # 新鲜度：健康果皮区域的灰度均值和标准差
    # 健康区域 = 非病害区域（morphology 中为 0 的像素）
    healthy_mask = (morphology == 0)
    if np.any(healthy_mask):
        healthy_pixels = gray[healthy_mask]
        healthy_mean = float(np.mean(healthy_pixels))
        healthy_std = float(np.std(healthy_pixels))
    else:
        healthy_mean = 0.0
        healthy_std = 0.0

    # 新鲜度等级判断
    if healthy_mean > 120 and healthy_std > 30:
        freshness_level = '新鲜'
        freshness_desc = f'均值={healthy_mean:.1f} (>120) 标准差={healthy_std:.1f} (>30)，颜色鲜明且纹理丰富'
    elif healthy_mean > 80:
        freshness_level = '较新鲜'
        freshness_desc = f'均值={healthy_mean:.1f} (80~120) 标准差={healthy_std:.1f}，颜色尚可'
    else:
        freshness_level = '不新鲜'
        freshness_desc = f'均值={healthy_mean:.1f} (<80) 标准差={healthy_std:.1f}，颜色暗淡或发黑'

    # ---- 生成结果标注图 ----
    # 在原图上用红色半透明叠加标注病害区域
    result_marked = original.copy()
    red_overlay = original.copy()

    # 找到病害区域轮廓
    contours, _ = cv2.findContours(morphology, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour_count = len(contours)

    # 用红色填充病害区域（半透明叠加）
    red_overlay[morphology > 0] = [0, 0, 255]  # BGR 红色
    # 半透明混合：alpha=0.4
    result_marked = cv2.addWeighted(red_overlay, 0.4, original, 0.6, 0)

    # 绘制轮廓描边
    cv2.drawContours(result_marked, contours, -1, (0, 0, 255), 2)

    # ---- 编码各步骤图像为 base64 ----
    steps = {
        'gray': encode_image_to_base64(gray),
        'gaussian_blur': encode_image_to_base64(gaussian_blur),
        'median_blur': encode_image_to_base64(median_blur),
        'hist_enhanced': encode_image_to_base64(hist_enhanced),
        'threshold': encode_image_to_base64(threshold),
        'morphology': encode_image_to_base64(morphology),
    }

    metrics = {
        'disease_ratio': round(disease_ratio, 6),
        'quality_level': quality_level,
        'quality_desc': quality_desc,
        'healthy_mean': round(healthy_mean, 2),
        'healthy_std': round(healthy_std, 2),
        'freshness_level': freshness_level,
        'freshness_desc': freshness_desc,
        'contour_count': contour_count,
    }

    return {
        'steps': steps,
        'result_marked': encode_image_to_base64(result_marked),
        'metrics': metrics,
    }


@app.route('/api/detect', methods=['POST'])
def detect():
    """病害与新鲜度检测 API"""
    if 'image' not in request.files:
        return jsonify({'error': '未上传图片文件'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': '文件名为空'}), 400

    image_bytes = file.read()
    result = process_image(image_bytes)

    if result is None:
        return jsonify({'error': '无法解析图片，请检查文件格式'}), 400

    return jsonify({'success': True, 'data': result})


# ---- 生产模式：托管 React 构建产物 ----
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """生产模式下托管 React 前端静态文件"""
    if path and os.path.exists(os.path.join(BUILD_DIR, path)):
        return send_from_directory(BUILD_DIR, path)
    # SPA 回退到 index.html
    return send_from_directory(BUILD_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
