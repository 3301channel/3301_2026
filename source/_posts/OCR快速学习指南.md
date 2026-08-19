---
title: "OCR 光学字符识别 — 深度技术指南"
date: 2026-08-19 15:00:00
author: ZhangSki
img: /medias/featureimages/6.jpg
top: false
cover: false
coverImg: /medias/featureimages/6.jpg
toc: true
mathjax: false
categories:
  - AI
tags:
  - OCR
---

# OCR 光学字符识别 — 深度技术指南

## 第一章：OCR 基础概念

### 1.1 定义

**OCR（Optical Character Recognition，光学字符识别）** 是指通过图像处理和模式识别技术，将图片、扫描文档、手写稿中的可见文字符号，自动转化为机器可编辑、可检索的文本编码（如 Unicode 字符串）的技术体系。

### 1.2 OCR 与相关技术的边界

| 技术 | 目标 | 典型输出 |
|------|------|----------|
| **OCR** | 图像中的字符 $\rightarrow$ 文本 | "这是一个报告" |
| **ICR（智能字符识别）** | 手写体字符识别 | 手写数字、字母 |
| **OMR（光学标记识别）** | 检测标记位置 | 答题卡涂黑区域坐标 |
| **条形码/二维码** | 编码符号 $\rightarrow$ 数字 | 商品编码 |
| **文档理解/Document AI** | 文本 $\rightarrow$ 结构化语义 | 提取发票金额、日期 |
| **版面分析（Layout Analysis）** | 识别文本块层级关系 | 段落、标题、表格边界 |

---

## 第二章：OCR 完整管线 — 深度解析

### 2.1 图像预处理

预处理的质量直接决定 OCR 的上限。这一阶段的目标是消除干扰、增强字符特征。

| 步骤 | 方法 | 作用 | 关键参数 |
|------|------|------|----------|
| **灰度化** | $Gray = 0.299R + 0.587G + 0.114B$ | 去色、降低计算量 | — |
| **二值化** | OTSU / 自适应阈值 | 分离前景文字与背景 | 阈值（全局/局部） |
| **去噪** | 高斯滤波、中值滤波、NLM | 消除传感器噪声 | 核大小（kernel size） |
| **倾斜校正** | 霍夫变换 / 最小面积矩形 | 矫正扫描角度 | 旋转角度 |
| **透视校正** | 四点透视变换 | 矫正拍摄畸变 | 4 个源坐标 + 4 个目标坐标 |
| **锐化** | Laplacian / Unsharp Mask | 增强字符边缘 | alpha 值 |
| **对比度增强** | CLAHE | 改善光照不均区域的可见性 | clip limit、tile size |
| **形态学操作** | 膨胀、腐蚀、开闭运算 | 断字连接 / 去除噪点 | 结构元素大小 |
| **图像放大** | 插值算法（Lanczos / Bicubic） | 提高小字号文字的像素密度 | 缩放因子（通常 $2\times$–$4\times$） |

**OTSU 二值化原理**：OTSU 算法通过最大化类间方差来自动选取最优阈值。设阈值 $t$ 将图像分为前景 $C_0$ 和背景 $C_1$，类间方差定义为：

$$
\sigma^2_b(t) = \omega_0(t) \cdot \omega_1(t) \cdot [\mu_0(t) - \mu_1(t)]^2
$$

其中 $\omega_0, \omega_1$ 分别为前景和背景的像素占比，$\mu_0, \mu_1$ 为各自的平均灰度值。最优阈值 $t^* = \arg\max_t \sigma^2_b(t)$。

#### Python 示例

```python
import cv2
import numpy as np

def preprocess_image(image_path: str, output_path: str = "cleaned.png") -> np.ndarray:
    """OCR 图像预处理管线"""
    # 1. 读取
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image: {image_path}")

    # 2. 灰度化
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. 去噪（双边滤波保留边缘）
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # 4. CLAHE 对比度增强
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # 5. 二值化（OTSU）
    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 6. 去噪（形态学开运算）
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    cleaned = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    # 7. 放大（小字场景）
    cleaned = cv2.resize(cleaned, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)

    cv2.imwrite(output_path, cleaned)
    return cleaned
```

#### Java 示例

```java
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.opencv.photo.Photo;

public class OcrPreprocessor {

    public static Mat preprocessImage(String imagePath, String outputPath) {
        // 1. 读取
        Mat img = Imgcodecs.imread(imagePath);
        if (img.empty()) {
            throw new IllegalArgumentException("Cannot read image: " + imagePath);
        }

        // 2. 灰度化
        Mat gray = new Mat();
        Imgproc.cvtColor(img, gray, Imgproc.COLOR_BGR2GRAY);

        // 3. 双边滤波去噪（保留边缘）
        Mat denoised = new Mat();
        Photo.bilateralFilter(gray, denoised, 9, 75, 75);

        // 4. CLAHE 对比度增强
        Mat enhanced = new Mat();
        CLAHE clahe = Imgproc.createCLAHE(2.0, new Size(8, 8));
        clahe.apply(denoised, enhanced);

        // 5. OTSU 二值化
        Mat binary = new Mat();
        Imgproc.threshold(enhanced, binary, 0, 255, Imgproc.THRESH_BINARY + Imgproc.THRESH_OTSU);

        // 6. 形态学开运算去噪
        Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_RECT, new Size(2, 2));
        Mat cleaned = new Mat();
        Imgproc.morphologyEx(binary, cleaned, Imgproc.MORPH_OPEN, kernel);

        // 7. 放大 2x
        Mat scaled = new Mat();
        Imgproc.resize(cleaned, scaled, new Size(), 2.0, 2.0, Imgproc.INTER_LANCZOS4);

        Imgcodecs.imwrite(outputPath, scaled);
        return scaled;
    }
}
```

### 2.2 文本检测

文本检测的目标是在图像中标出每个文字区域的边界框（bounding box）。现代方法主要分两类：

#### 2.2.1 基于回归的方法

| 模型 | 核心思想 | 特点 |
|------|----------|------|
| **EAST** | 全卷积网络直接回归文本框 + 旋转角度 | 速度极快，支持任意方向文本 |
| **DBNet（可微分二值化）** | 学习分割图 + 自适应阈值 | 对弯曲文本效果好，速度快 |
| **CTPN** | CNN + BLSTM 检测文字序列 | 水平文本效果好，早期经典 |

#### 2.2.2 基于分割的方法

| 模型 | 核心思想 | 特点 |
|------|----------|------|
| **PSENet（渐进式尺度扩张）** | 每个文本实例用多个尺度的核 | 密集文本分离能力强 |
| **PAN** | 轻量级分割网络 + 像素聚合 | 实时场景，手机端可用 |
| **FCENet** | 傅里叶域文本表示 | 任意形状文本极佳 |

#### 2.2.3 关键指标

- **IoU（Intersection over Union）**：预测框与真值框的交并比。定义为 $IoU = \dfrac{TP}{TP + FN + FP}$
- **F-score**：Precision 和 Recall 的调和均值，通常 $IoU \ge 0.5$ 算正确
- **H-mean**：端到端检测 + 识别的综合 F-score

### 2.3 文本识别

将检测到的文本区域裁剪后送入识别模型，输出字符串。

#### 2.3.1 主流架构对比

| 架构 | 原理 | 优缺点 |
|------|------|--------|
| **CRNN + CTC** | CNN 提取特征 $\rightarrow$ RNN 序列建模 $\rightarrow$ CTC 解码 | 速度快、无需字符对齐标注；处理不规则文本弱 |
| **Seq2Seq + Attention** | CNN 编码 $\rightarrow$ RNN/LSTM 解码 + 注意力 | 能处理弯曲/不规则文本；训练较慢，需对齐 |
| **SATRN（Self-Attention）** | 纯 Transformer 架构 | 对不规则文本鲁棒性强；参数量大 |
| **Vision-Language Model** | ViT/CNN + LLM/language head 联合训练 | 精度高但计算量大（如 TrOCR、ViTSTR） |
| **端到端多模态 LLM** | GPT-4o / Claude 直接理解 | 适合复杂场景 + 语义理解；成本高、延迟大 |

#### 2.3.2 CRNN + CTC 原理详解

```
输入图像（H=32, W=任意）
    |
    v
CNN Backbone（VGG / ResNet 变体）
    | 特征图 (C, H/4, W/4)
    v
Map-to-Sequence（去除 H 维度，合并为序列）
    | 特征序列 T = W/4
    v
BLSTM（双向 LSTM 序列建模）
    | 每个时间步输出字符概率分布
    v
CTC Decoder（Connectionist Temporal Classification）
    | 合并重复字符 + 去除空白符
    v
识别结果字符串
```

**CTC 核心思想**：在每个时间步 $t$，模型输出一个概率分布 $p(l_t \mid X)$，其中 $l_t$ 属于字符集 $C \cup \{\text{blank}\}$。解码时通过**去重合并**（collapse）去除连续重复字符和空白标记：

$$
\mathcal{B}^{-1} (\text{aa--bb--cc}) \rightarrow \text{abc}
$$

其中 $-$ 代表空白符。目标是最大化给定输入 $X$ 下输出序列 $\pi$ 的概率：

$$
p(\pi \mid X) = \prod_{t=1}^{T} p(\pi_t \mid X)
$$

优点是不需要预先把字符和图像位置对齐。

#### 2.3.3 注意力机制

在 Seq2Seq 架构中，解码器在生成第 $t$ 个字符时，通过注意力权重关注编码器输出的不同位置：

$$
\alpha_{t,i} = \frac{\exp(e_{t,i})}{\sum_{j=1}^{T} \exp(e_{t,j})}, \quad
c_t = \sum_{i=1}^{T} \alpha_{t,i} \cdot h_i
$$

其中 $e_{t,i}$ 为解码器隐状态 $s_{t-1}$ 与编码器隐状态 $h_i$ 的对齐分数，$c_t$ 为上下文向量。

### 2.4 后处理

识别完成后通常还需要以下处理来提升可用性：

| 技术 | 做法 | 场景 |
|------|------|------|
| **拼写校正** | 基于词典 + 编辑距离或语言模型 | 英文 OCR 常见错误 |
| **停用词过滤** | 去除标点、多余空格 | 全文搜索前 |
| **正则格式化** | 手机号、身份证、金额按规则重构 | 结构化提取 |
| **N-gram 语言模型** | 上下文纠正单字识别错误 | 连续文本 |
| **LLM 后纠错** | GPT / 本地小模型做语义级修正 | 高精度场景 |
| **版面还原** | 按段落顺序重组识别结果 | 多列文档、学术论文 |

#### Python 后处理示例

```python
import re
import Levenshtein

def postprocess_ocr(text: str, dictionary: set[str] = None) -> str:
    """OCR 后处理管线"""
    # 1. 去除多余空格和换行
    text = re.sub(r"\s+", " ", text).strip()

    # 2. 统一标点符号（全角→半角）
    text = text.replace("\uff0c", ",").replace("\u3001", ",")
    text = text.replace("\u3002", ".").replace("\uff1a", ":")

    # 3. 字典辅助校正（英文场景）
    if dictionary:
        words = text.split()
        corrected = []
        for w in words:
            clean = re.sub(r"[^a-zA-Z]", "", w)
            if clean and clean not in dictionary:
                # 找词典中最接近的词（编辑距离 <= 2）
                candidates = sorted(
                    dictionary,
                    key=lambda d: Levenshtein.distance(clean.lower(), d.lower())
                )
                if candidates and Levenshtein.distance(clean.lower(), candidates[0].lower()) <= 2:
                    corrected.append(w.replace(clean, candidates[0]))
                    continue
            corrected.append(w)
        text = " ".join(corrected)

    # 4. 数字格式化（如金额）
    text = re.sub(r"(\d)([a-zA-Z])", r"\1 \2", text)
    text = re.sub(r"([a-zA-Z])(\d)", r"\1 \2", text)

    return text
```

#### Java 后处理示例

```java
import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

public class OcrPostProcessor {

    public static String postprocess(String text, Set<String> dictionary) {
        // 1. 合并空白
        text = text.replaceAll("\\s+", " ").trim();

        // 2. 全角标点 → 半角
        text = text.replace('\uff0c', ',')
                    .replace('\u3001', ',')
                    .replace('\u3002', '.')
                    .replace('\uff1a', ':');

        // 3. 词典校正（英文）
        if (dictionary != null && !dictionary.isEmpty()) {
            String[] words = text.split(" ");
            StringBuilder sb = new StringBuilder();
            for (String w : words) {
                String clean = w.replaceAll("[^a-zA-Z]", "");
                if (!clean.isEmpty() && !dictionary.contains(clean.toLowerCase())) {
                    String best = dictionary.stream()
                        .min(Comparator.comparingInt(d -> levenshteinDistance(clean.toLowerCase(), d)))
                        .orElse(clean);
                    if (levenshteinDistance(clean.toLowerCase(), best) <= 2) {
                        sb.append(w.replace(clean, best)).append(" ");
                        continue;
                    }
                }
                sb.append(w).append(" ");
            }
            text = sb.toString().trim();
        }

        return text;
    }

    private static int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= b.length(); j++) dp[0][j] = j;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i-1][j] + 1, dp[i][j-1] + 1),
                    dp[i-1][j-1] + cost
                );
            }
        }
        return dp[a.length()][b.length()];
    }
}
```

**编辑距离**：给定两个字符串 $A$ 和 $B$，Levenshtein 编辑距离 $d(A, B)$ 是将 $A$ 转换为 $B$ 所需的最少单字符编辑操作（插入、删除、替换）次数。递归定义为：

$$
d(i, j) = \begin{cases}
i & \text{if } j = 0 \\
j & \text{if } i = 0 \\
d(i-1, j-1) & \text{if } A_i = B_j \\
1 + \min\{d(i-1, j),\; d(i, j-1),\; d(i-1, j-1)\} & \text{otherwise}
\end{cases}
$$

---

## 第三章：主流 OCR 引擎深入对比

### 3.1 引擎总览表

| 引擎 | 底层架构 | 语言支持 | 部署依赖 | 推理速度（CPU） | GPU 加速 | 推理框架 | 开源 |
|------|----------|----------|----------|-----------------|----------|----------|------|
| **Tesseract 5** (LSTM) | LeNet + BLSTM | 100+ | 极小（仅引擎本体） | 快 | 否 | 自研 | $\checkmark$ |
| **EasyOCR** | CRAFT + CRNN | 80+ | PyTorch 必装 | 较慢 | $\checkmark$ | PyTorch | $\checkmark$ |
| **PaddleOCR** | DBNet/Distillation + SVTR | 80+（中文最优） | PaddlePaddle | 中等 | $\checkmark$ | Paddle Inference | $\checkmark$ |
| **Surya** | 视觉 Transformer | 90+ | PyTorch + torchvision | 中等 | $\checkmark$ | PyTorch | $\checkmark$ |
| **TrOCR** (Microsoft) | ViT + Transformer | 主要英文/中文 | HuggingFace Transformers | 较慢 | $\checkmark$ | Transformers | $\checkmark$ |
| **阿里云 OCR** | 私有 | 多语言 | 无（HTTP API） | N/A | N/A | 云端 | $\times$ |
| **Google Cloud Vision** | 私有 ViT | 多语言 | 无（HTTP API） | N/A | N/A | 云端 | $\times$ |
| **Azure Form/OCR** | 私有 | 多语言 | 无（HTTP API） | N/A | N/A | 云端 | $\times$ |

### 3.2 PaddleOCR 深度解析（中文场景首选）

PaddleOCR 是目前中文 OCR 事实标准，核心组件：

- **文本检测**：DBNet++ 或 PSE-Net
  - PP-OCRv4 检测模型 mAP 在 ICDAR 数据集达 87%+
- **方向分类器**：判断文本是否需要旋转 180$^\circ$，提升倾斜文档鲁棒性
- **文本识别**：SVTR（Scene Text Recognition with Visual Transformer）
  - PP-OCRv4 识别模型精度达 83%+（中文场景）
- **模型蒸馏**：教师模型 $\rightarrow$ 学生模型，精度几乎无损但体积缩小 50%+
- **版面分析**：提供 Layout Parser 组件，支持表格、段落、标题分级

### 3.3 Tesseract 深度解析（轻量首选）

| 版本 | 识别引擎 | 特点 |
|------|----------|------|
| Tesseract 3 | 传统模板匹配 | 过时，已不推荐 |
| Tesseract 4 | LSTM 神经网络 | 大版本提升，先检测再识别 |
| Tesseract 5 | LSTM + 改进训练管线 | 准确率进一步提升 |

核心特性：
- `--psm`（Page Segmentation Mode）：0–13 共 14 种页面切割模式，控制如何分析页面布局
  - `--psm 6`：假设为统一文本块
  - `--psm 7`：单行文本
  - `--psm 13`：原始行，不做行内处理
- `--oem`（OCR Engine Mode）：0 = 仅传统引擎，1 = 仅 LSTM，2 = 两者，3 = 默认
- 支持 LSTM 训练自定义字体

---

## 第四章：代码示例 — Python 版

### 4.1 Tesseract

```python
import pytesseract
from PIL import Image, ImageFilter, ImageEnhance

def ocr_tesseract(image_path: str, lang: str = "chi_sim+eng") -> dict:
    """使用 Tesseract 进行 OCR，返回详细结果"""
    # 加载并预处理
    img = Image.open(image_path).convert("L")  # 灰度
    img = img.filter(ImageFilter.SHARPEN)
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)

    # 基础识别
    text = pytesseract.image_to_string(img, lang=lang)

    # 按行解析
    data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)

    return {
        "full_text": text,
        "lines": [
            {
                "text": data["text"][i],
                "confidence": data["conf"][i],
                "bbox": (data["left"][i], data["top"][i],
                         data["width"][i], data["height"][i])
            }
            for i in range(len(data["text"]))
            if data["text"][i].strip()
        ]
    }
```

### 4.2 PaddleOCR

```python
from paddleocr import PaddleOCR

def ocr_paddle(image_path: str, lang: str = "ch", use_gpu: bool = False) -> dict:
    """使用 PaddleOCR 进行识别"""
    ocr = PaddleOCR(
        use_angle_cls=True,   # 是否使用方向分类器
        lang=lang,
        use_gpu=use_gpu,
        det_db_thresh=0.3,    # 检测阈值，降低可检测更多文本
        det_db_box_thresh=0.5, # 框过滤阈值
        rec_batch_num=6        # 并行识别批大小
    )
    result = ocr.ocr(image_path, cls=True)

    if not result or not result[0]:
        return {"texts": [], "raw": []}

    lines = []
    for line in result[0]:
        bbox, (text, confidence) = line
        lines.append({
            "bbox": bbox,          # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            "text": text,
            "confidence": confidence
        })

    return {"texts": [l["text"] for l in lines], "raw": lines}
```

### 4.3 EasyOCR

```python
import easyocr

def ocr_easy(image_path: str, languages: list[str] = None) -> dict:
    """使用 EasyOCR 进行识别"""
    if languages is None:
        languages = ["ch_sim", "en"]

    reader = easyocr.Reader(languages, gpu=False)

    results = reader.readtext(
        image_path,
        paragraph=True,         # 自动合并同段落的文本行
        width_ths=0.7,          # 水平合并阈值
        ycenter_ths=0.5,        # 垂直合并阈值
        batch_size=4,
        detail=1
    )

    lines = [
        {"bbox": bbox, "text": text, "confidence": round(conf, 4)}
        for bbox, text, conf in results
    ]
    return {"texts": [l["text"] for l in lines], "raw": lines}
```

### 4.4 端到端批量处理示例

```python
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

def batch_ocr(input_dir: str, output_dir: str, engine="paddle", max_workers=4):
    """批量 OCR 任务"""
    os.makedirs(output_dir, exist_ok=True)
    images = list(Path(input_dir).glob("*.jpg")) + list(Path(input_dir).glob("*.png"))

    engine_fn = {"paddle": ocr_paddle, "easyocr": ocr_easy, "tesseract": ocr_tesseract}[engine]

    def process_one(img_path: Path) -> str:
        result = engine_fn(str(img_path))
        out_path = Path(output_dir) / f"{img_path.stem}.txt"
        out_path.write_text("\n".join(result["texts"]), encoding="utf-8")
        return f"{img_path.name} -> {out_path.name} ({len(result['texts'])} lines)"

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(process_one, img): img for img in images}
        for future in as_completed(futures):
            print(future.result())
```

---

## 第五章：代码示例 — Java 版

### 5.1 Tesseract（通过 Tess4J）

**Maven 依赖：**

```xml
<dependency>
    <groupId>net.sourceforge.tess4j</groupId>
    <artifactId>tess4j</artifactId>
    <version>5.4.0</version>
</dependency>
<dependency>
    <groupId>org.bytedeco</groupId>
    <artifactId>opencv-platform</artifactId>
    <version>4.9.0</version>
</dependency>
```

**完整代码：**

```java
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.Word;
import net.sourceforge.tess4j.util.LoadLibs;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.util.*;

public class TesseractOCR {

    private final ITesseract instance;

    public TesseractOCR(String dataPath, String language) {
        this.instance = new Tesseract();
        this.instance.setDatapath(dataPath);           // tessdata 目录路径
        this.instance.setLanguage(language);            // 如 "chi_sim+eng"
        this.instance.setPageSegMode(3);                // PSM_AUTO：全自动版面分析
        this.instance.setOcrEngineMode(3);              // OEM_DEFAULT
    }

    public OcrResult recognize(String imagePath) throws Exception {
        BufferedImage img = ImageIO.read(new File(imagePath));

        // 识别全文本
        String fullText = instance.doOCR(img);

        // 逐词粒度数据
        List<Word> words = instance.getWords(img);
        List<OcrLine> lines = new ArrayList<>();
        for (Word w : words) {
            lines.add(new OcrLine(
                w.getText(),
                (double) w.getConfidence(),
                new int[]{
                    w.getBoundingBox().x, w.getBoundingBox().y,
                    w.getBoundingBox().width, w.getBoundingBox().height
                }
            ));
        }

        return new OcrResult(fullText, lines);
    }

    // 内嵌数据类
    public record OcrResult(String fullText, List<OcrLine> lines) {}
    public record OcrLine(String text, double confidence, int[] bbox) {}
}
```

### 5.2 PaddleOCR（通过 Java 推理接口）

**Maven 依赖：**

```xml
<dependency>
    <groupId>com.baidu.paddle</groupId>
    <artifactId>paddleocr-java</artifactId>
    <version>1.0.0</version>
</dependency>
```

**完整代码：**

```java
import com.baidu.paddle.PaddleOCR;
import com.baidu.paddle.PaddleOCRConfig;
import com.baidu.paddle.OcrResult;
import com.baidu.paddle.OcrResultLine;

import java.nio.file.Paths;
import java.util.List;

public class PaddleOCRDemo {

    private final PaddleOCR ocr;

    public PaddleOCRDemo(String modelDir) {
        PaddleOCRConfig config = new PaddleOCRConfig();
        config.setDetModelDir(Paths.get(modelDir, "det"));
        config.setRecModelDir(Paths.get(modelDir, "rec"));
        config.setClsModelDir(Paths.get(modelDir, "cls"));
        config.setUseGpu(false);
        config.setGpuId(0);
        config.setDetDbThresh(0.3);       // 检测阈值
        config.setDetDbBoxThresh(0.5);    // 框过滤
        config.setRecBatchNum(6);          // 并行批大小
        config.setUseAngleCls(true);       // 方向分类
        this.ocr = new PaddleOCR(config);
    }

    public List<OcrLine> recognize(String imagePath) {
        OcrResult result = ocr.ocr(imagePath);
        return result.getLines().stream()
            .map(line -> new OcrLine(
                line.getText(),
                line.getConfidence(),
                line.getBoundingBox()       // float[8] -> 4 个角点 (x,y)
            ))
            .toList();
    }

    public record OcrLine(String text, double confidence, float[] bbox) {}
}
```

### 5.3 OpenCV 图像预处理 + Tesseract

```java
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import net.sourceforge.tess4j.ITesseract;
import net.sourceforge.tess4j.Tesseract;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import javax.imageio.ImageIO;

public class OcrPipeline {

    static { System.loadLibrary(Core.NATIVE_LIBRARY_NAME); }

    private final ITesseract tesseract;

    public OcrPipeline(String dataPath, String lang) {
        tesseract = new Tesseract();
        tesseract.setDatapath(dataPath);
        tesseract.setLanguage(lang);
    }

    public String recognizeWithPreprocessing(String imagePath) throws Exception {
        // 1. 图像预处理
        Mat img = Imgcodecs.imread(imagePath);
        Mat gray = new Mat();
        Imgproc.cvtColor(img, gray, Imgproc.COLOR_BGR2GRAY);

        // CLAHE
        CLAHE clahe = Imgproc.createCLAHE(2.0, new Size(8, 8));
        Mat enhanced = new Mat();
        clahe.apply(gray, enhanced);

        // OTSU 二值化
        Mat binary = new Mat();
        Imgproc.threshold(enhanced, binary, 0, 255, Imgproc.THRESH_BINARY | Imgproc.THRESH_OTSU);

        // 放大
        Mat scaled = new Mat();
        Imgproc.resize(binary, scaled, new Size(), 2.0, 2.0, Imgproc.INTER_LANCZOS4);

        // 2. Mat -> BufferedImage
        MatOfByte matBytes = new MatOfByte();
        Imgcodecs.imencode(".png", scaled, matBytes);
        BufferedImage bufferedImg = ImageIO.read(new ByteArrayInputStream(matBytes.toArray()));

        // 3. OCR
        return tesseract.doOCR(bufferedImg);
    }
}
```

### 5.4 批量处理 Java 版本

```java
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

public class BatchOcrProcessor {

    private final TesseractOCR ocr;

    public BatchOcrProcessor(TesseractOCR ocr) {
        this.ocr = ocr;
    }

    public void processDirectory(String inputDir, String outputDir, int maxThreads)
            throws IOException, InterruptedException {

        Files.createDirectories(Paths.get(outputDir));

        try (DirectoryStream<Path> stream =
                 Files.newDirectoryStream(Paths.get(inputDir), "*.{jpg,png,jpeg}")) {

            List<Path> files = new ArrayList<>();
            stream.forEach(files::add);

            ExecutorService executor = Executors.newFixedThreadPool(maxThreads);
            List<Future<String>> futures = new ArrayList<>();

            for (Path file : files) {
                futures.add(executor.submit(() -> {
                    try {
                        var result = ocr.recognize(file.toString());
                        Path outPath = Paths.get(outputDir,
                            file.getFileName().toString().replaceAll("\\.\\w+$", ".txt"));
                        Files.writeString(outPath, result.fullText());
                        return file.getFileName() + " -> " + outPath.getFileName()
                            + " (" + result.lines().size() + " words)";
                    } catch (Exception e) {
                        return file.getFileName() + " -> ERROR: " + e.getMessage();
                    }
                }));
            }

            for (Future<String> f : futures) {
                System.out.println(f.get());
            }

            executor.shutdown();
        }
    }
}
```

---

## 第六章：结果评估与指标

### 6.1 核心评估指标

| 指标 | 公式 | 说明 |
|------|------|------|
| **CER**（字符错误率） | $\displaystyle \frac{S + I + D}{N}$ | 字符级，$N$ 为参考序列总字符数 |
| **WER**（词错误率） | $\displaystyle \frac{S_w + I_w + D_w}{N_w}$ | 词级，英文更常用 |
| **Precision** | $\displaystyle \frac{TP}{TP + FP}$ | 检出的文字中有多少是正确的 |
| **Recall** | $\displaystyle \frac{TP}{TP + FN}$ | 所有文字中有多少被正确检出 |
| **F1-score** | $\displaystyle \frac{2 \cdot P \cdot R}{P + R}$ | Precision 和 Recall 的调和平均 |
| **ACC**（准确率） | $\displaystyle 1 - \text{CER}$ | 与 $1 - \text{CER}$ 等价 |

其中 $S$ = 替换数，$I$ = 插入数，$D$ = 删除数，$N$ = 参考字符总数。各符号与编辑距离的关系为 $\text{CER} = \dfrac{\text{Levenshtein}(ref, hyp)}{|ref|}$。

F1-score 的形式化表达：

$$
F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}
$$

### 6.2 评估代码

#### Python

```python
import Levenshtein

def calc_cer(reference: str, hypothesis: str) -> float:
    """计算字符错误率 CER"""
    if len(reference) == 0:
        return 1.0 if len(hypothesis) > 0 else 0.0
    d = Levenshtein.distance(reference, hypothesis)
    return d / len(reference)

def calc_wer(reference: str, hypothesis: str) -> float:
    """计算词错误率 WER（英文按空格分词）"""
    ref_words = reference.strip().split()
    hyp_words = hypothesis.strip().split()
    if len(ref_words) == 0:
        return 1.0 if len(hyp_words) > 0 else 0.0
    d = Levenshtein.distance(" ".join(ref_words), " ".join(hyp_words))
    return d / len(ref_words)

def evaluate_ocr(ground_truths: list[str], predictions: list[str]):
    """批量评估 OCR 结果"""
    cers = [calc_cer(gt, pred) for gt, pred in zip(ground_truths, predictions)]
    wers = [calc_wer(gt, pred) for gt, pred in zip(ground_truths, predictions)]
    return {
        "avg_cer": sum(cers) / len(cers),
        "avg_wer": sum(wers) / len(wers),
        "cer_list": cers,
        "wer_list": wers
    }
```

#### Java

```java
import java.util.List;

public class OcrEvaluator {

    public static double calcCER(String reference, String hypothesis) {
        if (reference.isEmpty()) {
            return hypothesis.isEmpty() ? 0.0 : 1.0;
        }
        int dist = new org.apache.commons.text.similarity.LevenshteinDistance()
            .apply(reference, hypothesis);
        return (double) dist / reference.length();
    }

    public static double calcWER(String reference, String hypothesis) {
        String refJoined = String.join(" ", reference.trim().split("\\s+"));
        String hypJoined = String.join(" ", hypothesis.trim().split("\\s+"));
        String[] refWords = reference.trim().split("\\s+");
        if (refWords.length == 0) {
            return hypothesis.trim().isEmpty() ? 0.0 : 1.0;
        }
        int dist = new org.apache.commons.text.similarity.LevenshteinDistance()
            .apply(refJoined, hypJoined);
        return (double) dist / refWords.length;
    }

    public record OcrEvalResult(double avgCER, double avgWER) {}

    public static OcrEvalResult evaluate(List<String> groundTruths, List<String> predictions) {
        double totalCER = 0, totalWER = 0;
        int n = Math.min(groundTruths.size(), predictions.size());
        for (int i = 0; i < n; i++) {
            totalCER += calcCER(groundTruths.get(i), predictions.get(i));
            totalWER += calcWER(groundTruths.get(i), predictions.get(i));
        }
        return new OcrEvalResult(totalCER / n, totalWER / n);
    }
}
```

---

## 第七章：部署策略与性能调优

### 7.1 部署选型决策树

```
需要处理中文？
  +-- 是 -> PaddleOCR
  |     +-- 需要高并发 API -> 封装为 HTTP 服务 + 进程池
  |     +-- 离线批处理 -> 直接调用推理
  +-- 否 -> 看精度要求
        +-- 极高 -> Surya / TrOCR
        +-- 中等 -> EasyOCR
        +-- 轻量 -> Tesseract + 自定义 LSTM 训练
```

### 7.2 性能优化建议

| 瓶颈 | 优化手段 |
|------|----------|
| **CPU 推理慢** | 启用 GPU（CUDA / MPS）；使用 ONNX Runtime 部署；模型量化（INT8） |
| **检测过慢** | 降低输入分辨率（保持短边 $\ge 640\text{px}$）；调大检测阈值跳过模糊区域 |
| **识别过慢** | 增大 `rec_batch_num` 批量识别；使用更轻量识别模型（如 SVTR-Tiny） |
| **内存占用高** | 使用模型串行加载而非并行；推理后主动释放显存（`torch.cuda.empty_cache()`） |
| **服务化部署** | Triton Inference Server / TorchServe；gRPC 替代 HTTP REST |
| **冷启动慢** | 容器预热 + 初始化脚本；模型预加载到共享内存 |

### 7.3 常见生产架构

```
                 +---------------+
                 |   负载均衡     |
                 +-------+-------+
                         |
           +-------------+-------------+
           v             v             v
     +-----------+ +-----------+ +-----------+
     | Worker 1  | | Worker 2  | | Worker 3  |  每个 Worker 持有独立 OCR 实例
     +-----+-----+ +-----+-----+ +-----+-----+
           |             |             |
           +-------------+-------------+
                         v
                +-------------------+
                |   消息队列         |
                | (Redis/RabbitMQ)  |  异步任务持久化
                +-------------------+
```

---

## 第八章：常见问题与排错

### 8.1 经典问题对照

| 现象 | 可能原因 | 解决方案 |
|------|----------|----------|
| 输出全是乱码 | 语言包未加载 / 编码不一致 | 检查 `lang` 参数；统一输出为 UTF-8 |
| 漏掉部分文字 | 光照不均 / 对比度低 | 加强预处理；调低 `det_db_thresh` |
| 相邻行文字串行 | 行高过小 / 倾斜 | 倾斜校正；设 `psm=6`（统一文本块） |
| 数字和字母混认 | 字体相似（如 O0、l1） | 后处理加上下文模型；训练特定字体 |
| 金属/反光面文字 | 高光干扰 | 多角度拍摄融合；HSV 变换提取 |
| 繁体/特殊字符缺失 | 模型不支持该字形 | 更换语言包或使用更全的模型（如 PaddleOCR 多语言版） |
| 超大图片 OOM | 分辨率过高 | 限制输入长边 $\le 2048\text{px}$；分块处理（sliding window） |
| 识别结果顺序错误 | 多栏/复杂版面 | 启用版面分析组件；手动按 y/x 排序后处理 |

### 8.2 调试最佳实践

```python
def debug_ocr(image_path: str, engine="paddle"):
    """调试 OCR 流程：保存各阶段中间结果"""
    from pathlib import Path
    import cv2

    base = Path("debug_output")
    base.mkdir(exist_ok=True)

    img = cv2.imread(image_path)
    cv2.imwrite(str(base / "01_original.png"), img)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cv2.imwrite(str(base / "02_gray.png"), gray)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    cv2.imwrite(str(base / "03_enhanced.png"), enhanced)

    _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    cv2.imwrite(str(base / "04_binary_otsu.png"), binary)

    # 用不同引擎识别并比对结果
    from paddleocr import PaddleOCR
    ocr = PaddleOCR(use_angle_cls=True, lang="ch")
    result = ocr.ocr(image_path, cls=True)

    with open(str(base / "05_result.txt"), "w", encoding="utf-8") as f:
        for line in result[0]:
            f.write(f"{line[1][1]:.4f}\t{line[1][0]}\n")

    return base
```

---

## 第九章：进阶方向与前沿趋势

| 方向 | 代表技术 | 描述 |
|------|----------|------|
| **版面分析** | LayoutLM / DocTR / PaddleOCR Layout Parser | 理解段落、表格、页眉页脚的层级结构 |
| **表格识别** | TableTransformer / PaddleOCR Table | 结构化和还原表格中的行列关系 |
| **公式识别** | LaTeX-OCR / Pix2Text | 将数学公式图片转为 LaTeX 代码 |
| **文档 VQA** | DocVQA / LayoutLMv3 | 基于文档图像做问答推理 |
| **多模态模型** | GPT-4o / Claude 3.5 / Qwen-VL | 端到端理解 + 推理 + 文本提取 |
| **手写体文字识别** | TrOCR / IAM 微调 | 大幅提升连笔、倾斜手写识别 |
| **少样本 / Zero-shot OCR** | 多模态大模型的零样本能力 | 无需训练数据，直接识别新型文档 |

---

## 第十章：资源汇总

- [Tesseract 文档](https://tesseract-ocr.github.io/)
- [PaddleOCR GitHub](https://github.com/PaddlePaddle/PaddleOCR)
- [EasyOCR GitHub](https://github.com/JaidedAI/EasyOCR)
- [Surya OCR](https://github.com/VikParuchuri/surya)
- [TrOCR (HuggingFace)](https://huggingface.co/docs/transformers/model_doc/trocr)
- [OpenCV OCR 模块文档](https://docs.opencv.org/master/dd/d04/tutorial_py_table_of_contents_ocr.html)
- [AI Studio 在线训练 OCR 模型](https://aistudio.baidu.com/)

---

> **最后一句话：理解管线、做好预处理、选对引擎。** OCR 的工程落地中，20% 的工作在模型选择，80% 的工作在前处理和后处理的调优上。花时间打磨预处理和 post-correction pipeline，回报远高于换一个更贵的模型。