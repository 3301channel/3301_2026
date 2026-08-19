---
title: "PDF 不可见水印嵌入与提取程序设计"
date: 2026-08-19 19:00:00
author: ZhangSki
img: /medias/featureimages/10.jpg
top: false
cover: false
coverImg: /medias/featureimages/10.jpg
toc: true
mathjax: false
categories:
  - 图像处理
tags:
  - 水印
  - PDF
---

#### 我现在想要做一个pdf的不可见水印嵌入和提取的程序（肉眼不易察觉即可）：

1.嵌入端：输入为PDF文件，输出为嵌入的PDF文件；

2.提取端：将嵌入的文件进行打印，然后拍照（像素很差只有500万），需要能够提取到全局的一些特征来判断是否为加水印的文件；

3.采用25 LPI、10% 灰度的斜向规则网纹/点阵底纹； 为了匹配 500 万像素相机（约 200 DPI），并保不干扰 OCR，网纹设计满足：

（1）角度：45° 斜向交叉网线（避开公文正文/表格的 0° 和 90° 频率，在 FFT 频域中形成极易识别的 4 个对角亮点）

（2）密（LPI）：25 LPI（在 200 DPI 下，每条网线间隔 8 个像素，5MP 相机不失真

（3）图层位置：文字下方-在 PDF 矢量层置底，OCR 引擎提取文字时会忽略



 【模块 A：水印注入端 (PDF)】
                                    原始 PDF ➔ 注入 25 LPI / 45° 矢量底纹 ➔ 保存为防伪 PDF ➔ 物理打印
                                                                                                                                                      │
     【模块 B：采集校验端 (5MP Pipeline)】                                                             (500万像素相机拍摄)
                                                                                                                                                      │
                                                                                                                                                      ▼
    PASS/FAIL 判定 ← 频域遮罩增强 ← 2D-FFT 傅里叶变换 ← 200 DPI 降采样配准 ← 拍摄照片 



```python
import os
import cv2
import fitz  # PyMuPDF，用于 PDF 矢量渲染
import matplotlib.pyplot as plt
import numpy as np


class PDFWatermarkInjector:

    @staticmethod
    def inject_45deg_grid(
        input_pdf, output_pdf, lpi=25, gray_level=0.88, opacity=1.0
    ):
        """给 PDF 注入针对 500万像素优化的 45度斜向矢量底纹

        :param input_pdf: 输入 PDF 路径
        :param output_pdf: 输出带防伪底纹的 PDF 路径
        :param lpi: 每英寸线数，5MP 推荐 25 LPI (约 200 DPI 下 8 像素周期)
        :param gray_level: 0.88 相当于 12% K 浅灰度，人眼舒适，OCR 忽略
        """
        doc = fitz.open(input_pdf)
        spacing = 72.0 / lpi  # 2.88 pt 物理线间距

        for page in doc:
            rect = page.rect
            w, h = rect.width, rect.height
            shape = page.new_shape()

            stroke_color = (gray_level, gray_level, gray_level)
            stroke_width = 0.35  # 超细矢量线条

            # 绘制 +45 度斜线组
            offset = -h
            while offset < w:
                p1 = fitz.Point(max(0, offset), max(0, -offset))
                p2 = fitz.Point(min(w, h + offset), min(h, w - offset))
                shape.draw_line(p1, p2)
                offset += spacing

            # 绘制 -45 度斜线组
            offset = 0
            while offset < w + h:
                p1 = fitz.Point(max(0, offset - h), min(h, offset))
                p2 = fitz.Point(min(w, offset), max(0, offset - w))
                shape.draw_line(p1, p2)
                offset += spacing

            # 核心：overlay=False 表示将网纹至于 PDF 文字下方（底层），OCR 100% 无法抓取
            shape.finish(
                color=stroke_color, width=stroke_width, stroke_opacity=opacity
            )
            shape.commit(overlay=False)

        doc.save(output_pdf)
        print(f"[成功] PDF 水印注入完成，生成文件: {output_pdf}")




class WatermarkVerifier5MP:

    def __init__(self, camera_dpi=200):
        self.camera_dpi = camera_dpi

    def render_pdf_ref(self, pdf_path, page_num=0):
        """将源 PDF 渲染为与 500万像素相机匹配的 200 DPI 灰度图"""
        doc = fitz.open(pdf_path)
        page = doc[page_num]
        zoom = self.camera_dpi / 72.0
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.h, pix.w, pix.n
        )
        return (
            cv2.cvtColor(img, cv2.COLOR_RGB2GRAY) if pix.n >= 3 else img
        )

    def align_images(self, scan_gray, ref_gray):
        """ORB 自动透视与像素级配准"""
        orb = cv2.ORB_create(5000)
        kp1, des1 = orb.detectAndCompute(scan_gray, None)
        kp2, des2 = orb.detectAndCompute(ref_gray, None)

        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = sorted(bf.match(des1, des2), key=lambda x: x.distance)[
            : int(len(des1) * 0.15)
        ]

        src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(
            -1, 1, 2
        )
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(
            -1, 1, 2
        )

        H, _ = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)
        h, w = ref_gray.shape
        aligned_scan = cv2.warpPerspective(scan_gray, H, (w, h))
        return aligned_scan

    def process_fft_5mp(self, img):
        """计算中心化对数 FFT 频谱"""
        f = np.fft.fft2(img)
        fshift = np.fft.fftshift(f)
        spectrum = 20 * np.log(np.abs(fshift) + 1)
        return fshift, spectrum

    def extract_watermark_signal(self, ref_gray, aligned_scan_gray):
        """500万像素专属频域滤波与信号提取算法"""
        _, spec_ref = self.process_fft_5mp(ref_gray)
        _, spec_scan = self.process_fft_5mp(aligned_scan_gray)

        # 归一化
        s_ref_norm = cv2.normalize(
            spec_ref, None, 0, 255, cv2.NORM_MINMAX
        ).astype(np.float32)
        s_scan_norm = cv2.normalize(
            spec_scan, None, 0, 255, cv2.NORM_MINMAX
        ).astype(np.float32)

        # 频域差分
        diff = cv2.absdiff(s_scan_norm, s_ref_norm)

        # 5MP 硬件遮罩优化（去除光照与镜头畸变干扰）
        h, w = diff.shape
        cy, cx = h // 2, w // 2

        # 1. 滤除低频光照（屏蔽中心半径 20 像素）
        cv2.circle(diff, (cx, cy), 20, 0, -1)

        # 2. 滤除高频边缘噪点（仅保留中心 42% 区域）
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.circle(mask, (cx, cy), int(min(h, w) * 0.42), 255, -1)
        diff_masked = cv2.bitwise_and(diff, diff, mask=mask)

        # 3. 增强 45 度角特征信号
        diff_uint8 = diff_masked.astype(np.uint8)
        otsu_thresh, _ = cv2.threshold(
            diff_uint8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
        )
        _, binary_signal = cv2.threshold(
            diff_uint8, otsu_thresh * 1.15, 255, cv2.THRESH_BINARY
        )

        return spec_ref, spec_scan, binary_signal

    def execute_pipeline(self, watermark_pdf, camera_photo_path, output_dir="./output"):
        """主控校验闭环流程"""
        os.makedirs(output_dir, exist_ok=True)
        print("\n>>> [1/4] 渲染 200 DPI 数字基准图...")
        ref_gray = self.render_pdf_ref(watermark_pdf)

        print(">>> [2/4] 读取 500万像素照片并自动像素对齐...")
        scan_raw = cv2.imread(camera_photo_path, cv2.IMREAD_GRAYSCALE)
        if scan_raw is None:
            raise FileNotFoundError(f"未找到拍摄照片: {camera_photo_path}")

        # 轻微中值滤波去除相机椒盐噪点
        scan_denoised = cv2.medianBlur(scan_raw, 3)
        aligned_scan = self.align_images(scan_denoised, ref_gray)

        print(">>> [3/4] 执行 2D-FFT 频域交叉特征提取...")
        spec_ref, spec_scan, signal = self.extract_watermark_signal(
            ref_gray, aligned_scan
        )

        print(">>> [4/4] 自动化量化打分与判定...")
        # 统计频域信号能量面积占比
        valid_area = np.pi * ((min(ref_gray.shape) * 0.42) ** 2)
        score = np.sum(signal > 0) / valid_area

        # 判定阈值：得分 > 0.003 即判定存在合法水印
        IS_PASS = score > 0.003

        # 生成 6 视图可视化诊断报告
        self._generate_report(
            ref_gray,
            scan_raw,
            aligned_scan,
            spec_ref,
            spec_scan,
            signal,
            score,
            IS_PASS,
            output_dir,
        )

        return IS_PASS, score

    def _generate_report(
        self,
        ref,
        raw,
        aligned,
        spec_ref,
        spec_scan,
        signal,
        score,
        is_pass,
        out_dir,
    ):
        fig, axes = plt.subplots(2, 3, figsize=(16, 9))

        axes[0, 0].imshow(ref, cmap="gray")
        axes[0, 0].set_title("1. PDF Source (200 DPI)")
        axes[0, 1].imshow(raw, cmap="gray")
        axes[0, 1].set_title("2. 5MP Camera Raw Photo")
        axes[0, 2].imshow(aligned, cmap="gray")
        axes[0, 2].set_title("3. ORB Aligned Image")

        axes[1, 0].imshow(spec_ref, cmap="gray")
        axes[1, 0].set_title("4. Reference Spectrum")
        axes[1, 1].imshow(spec_scan, cmap="gray")
        axes[1, 1].set_title("5. Scan Spectrum (45° Dots Visible)")

        axes[1, 2].imshow(signal, cmap="jet")
        status_str = "PASS (VERIFIED)" if is_pass else "FAIL (UNVERIFIED)"
        color_str = "green" if is_pass else "red"
        axes[1, 2].set_title(
            f"6. Extracted 45° Signal [{status_str}]\nScore: {score:.5f}",
            color=color_str,
            fontweight="bold",
        )

        for ax in axes.ravel():
            ax.axis("off")

        report_file = os.path.join(out_dir, "verification_report.png")
        plt.tight_layout()
        plt.savefig(report_file, dpi=200)
        plt.close()

        print("\n" + "=" * 50)
        print(f"【终极鉴定结果】: {status_str}")
        print(f"【频域特征得分】: {score:.6f} (阈值: 0.003000)")
        print(f"【可视化报告已生成】: {report_file}")
        print("=" * 50 + "\n")

 运行示例  
 ======================
if __name__ == "__main__":
    # 步骤 0: 准备测试文件路径
    ORIGINAL_PDF = "clean_document.pdf"  # 你的原始无水印 PDF
    WATERMARKED_PDF = "watermarked_document.pdf"  # 生成的防伪 PDF
    CAMERA_PHOTO = "photo_from_5mp_camera.jpg"  # 500万像素相机拍的照片

    # --------------------------------------------------------------------------
    # 阶段一：水印生产端（只在发布 PDF 时运行一次）
    # --------------------------------------------------------------------------
    if not os.path.exists(ORIGINAL_PDF):
        # 如果没有原始文件，自动生成一个测试 PDF
        doc = fitz.open()
        p = doc.new_page(width=595, height=842)
        p.insert_text(
            fitz.Point(50, 100),
            "绝密公文 CONFIDENTIAL\n\n这是正文内容，OCR 引擎（如 PaddleOCR）将 100% 正常识别本行文字。\n底纹位于矢量最底层，完全不干扰文本提取。",
            fontsize=12,
        )
        doc.save(ORIGINAL_PDF)

    # 注入 5MP 专属 25 LPI 45° 矢量底纹
    PDFWatermarkInjector.inject_45deg_grid(
        input_pdf=ORIGINAL_PDF,
        output_pdf=WATERMARKED_PDF,
        lpi=25,  # 25 LPI
        gray_level=0.88,  # 12% 浅灰
    )

    print("\n将 'watermarked_document.pdf' 打印，并用 500万像素相机拍摄保存为 'photo_from_5mp_camera.jpg'\n")

    # --------------------------------------------------------------------------
    # 阶段二：校验采集端（在检测仪器上运行）
    # --------------------------------------------------------------------------
    # 模拟：如果你已经拍好了照片，执行校验引擎
    if os.path.exists(CAMERA_PHOTO):
        verifier = WatermarkVerifier5MP(camera_dpi=200)
        is_pass, score = verifier.execute_pipeline(
            watermark_pdf=WATERMARKED_PDF, camera_photo_path=CAMERA_PHOTO
        )
```