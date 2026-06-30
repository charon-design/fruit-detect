FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖（OpenCV 需要）
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY api/ ./api/

# 复制前端构建产物
COPY dist/ ./dist/

# HF Spaces 默认端口 7860
ENV PORT=7860

CMD ["gunicorn", "api.server:app", "-b", "0.0.0.0:7860"]
