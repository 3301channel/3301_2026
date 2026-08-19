---
title: "ECC 亚像素精对齐集成指南"
date: 2026-08-19 11:00:00
author: ZhangSki
img: /medias/featureimages/2.jpg
top: false
cover: false
coverImg: /medias/featureimages/2.jpg
toc: true
mathjax: false
categories:
  - 图像处理
tags:
  - ECC
  - 图像对齐
---

# ECC 亚像素精对齐集成指南

## 一、设计背景

**痛点**：现有 SURF/RANSAC 配准后残留 1-2px 平移误差，导致 XOR 假阳性。误报分析中，`document2` 的 inlier_ratio 从 0.99 退化到 0.80，原始 XOR 区域暴增 28 倍。

**目标**：在 SURF 粗对齐之后、二值化之前，插入 ECC（Enhanced Correlation Coefficient）亚像素精对齐，将平移残余压到 < 0.5px。

**约束**：

- **只能用 `MOTION_TRANSLATION`（2 自由度纯平移），不用 `MOTION_AFFINE`（6 自由度）**，因为 SURF 已处理旋转/缩放/透视，避免 AFFINE 过拟合 + 与 line_centroid 反馈干扰
- 金字塔降采样加速，平移分量回乘到原分辨率
- Lanczos4 插值，最小化笔画边缘模糊
- 默认关闭，通过 config flag 控制
- 空白页/低纹理页 ECC 不收敛时降级返回原图，不影响下游

---

## 二、集成位置

**文件**：`src/pixel_diff/engine.py`，方法 `PixelDiffEngine.compare()`

当前对齐链（第 102-118 行）：

```python
# 2a. 颜色过滤
filtered_scan = remove_colored_marks_bgr(scan_bgr, self.config)

# 2b. SURF/RANSAC 全局配准
alignment = align_scan_to_template_bgr(filtered_scan, template_bgr, self.config)

# 2c. 文本行质心 Y 轴补偿
line_alignment = align_text_lines_by_centroid_bgr(
    alignment.aligned_bgr, template_bgr, self.config)

# 2d. 约束局部密集流 warp（试验性）
local_warp = apply_constrained_local_warp_bgr(
    line_alignment.aligned_bgr, template_bgr, self.config)

aligned_bgr = local_warp.aligned_bgr   # ← 最终对齐结果
```

**插入位置**：在第 2d 步之后、`aligned_bgr =` 赋值之前，新增 2e 步：

```python
# 2e. ECC 亚像素精对齐（可选，默认关闭）
ecc = align_ecc_subpixel_bgr(local_warp.aligned_bgr, template_bgr, self.config)
aligned_bgr = ecc.aligned_bgr
```

即管道变为：

```
SURF → line_centroid → local_warp → ECC → aligned_bgr → 二值化 → XOR
```

ECC 是精对齐的最后一步，它接收之前所有对齐步骤的结果，只做微小的平移补偿。

---

## 三、新增数据模型

**文件**：`src/pixel_diff/alignment.py`

在 `AlignmentResult` 之后新增：

```python
@dataclass(frozen=True)
class EccAlignmentResult:
    """ECC 亚像素精对齐结果。"""

    aligned_bgr: np.ndarray
    """ECC 校准后的扫描件 BGR 图像，尺寸与模板一致。"""

    applied: bool
    """ECC 是否实际执行（配置开启 + 计算收敛）。"""

    converged: bool
    """findTransformECC 是否收敛。"""

    tx: float
    """最终应用的 X 方向平移量（原始分辨率像素）。"""

    ty: float
    """最终应用的 Y 方向平移量（原始分辨率像素）。"""

    elapsed_ms: float
    """ECC 计算耗时（毫秒）。"""
```

---

## 四、核心函数实现

**文件**：`src/pixel_diff/alignment.py` 新增函数

### 4.1 主入口

```python
def align_ecc_subpixel_bgr(
    scan_bgr: np.ndarray,
    template_bgr: np.ndarray,
    config: PixelDiffConfig,
) -> EccAlignmentResult:
    """使用 ECC 在灰度图上做亚像素平移精对齐，然后对 BGR 原图 warp。

    ECC 在降采样后的灰度图上计算平移向量，将平移量乘回原始分辨率，
    再对 BGR 原图用 Lanczos4 插值做 warpAffine。

    若未启用或 ECC 不收敛，返回原图。
    """
    t0 = time.perf_counter()

    if not config.ecc_enabled:
        return EccAlignmentResult(
            aligned_bgr=scan_bgr,
            applied=False, converged=False,
            tx=0.0, ty=0.0, elapsed_ms=0.0,
        )

    h, w = template_bgr.shape[:2]
    ds = config.ecc_downscale
    h_low, w_low = h // ds, w // ds

    # 1. 降采样灰度图
    scan_low = cv2.resize(scan_bgr, (w_low, h_low), interpolation=cv2.INTER_AREA)
    template_low = cv2.resize(template_bgr, (w_low, h_low), interpolation=cv2.INTER_AREA)
    gray_scan = cv2.cvtColor(scan_low, cv2.COLOR_BGR2GRAY)
    gray_template = cv2.cvtColor(template_low, cv2.COLOR_BGR2GRAY)

    # 2. 选择运动模型
    motion_type = _resolve_ecc_motion(config.ecc_motion_type)

    # 3. 运行 ECC
    warp_matrix = np.eye(2, 3, dtype=np.float32)
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT,
                config.ecc_max_iterations, config.ecc_epsilon)

    converged = True
    try:
        _, warp_matrix = cv2.findTransformECC(
            gray_template, gray_scan, warp_matrix,
            motion_type, criteria, None, 1,
        )
    except cv2.error:
        converged = False

    if not converged:
        elapsed = (time.perf_counter() - t0) * 1000
        return EccAlignmentResult(
            aligned_bgr=scan_bgr, applied=True, converged=False,
            tx=0.0, ty=0.0, elapsed_ms=elapsed,
        )

    # 4. 平移分量乘回原始分辨率（旋转/缩放分量保持不变，无量纲）
    warp_matrix[0, 2] *= ds
    warp_matrix[1, 2] *= ds

    tx = float(warp_matrix[0, 2])
    ty = float(warp_matrix[1, 2])

    # 5. 对 BGR 原图做高保真 warp
    aligned = cv2.warpAffine(
        scan_bgr, warp_matrix, (w, h),
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_REPLICATE,
    )

    elapsed = (time.perf_counter() - t0) * 1000
    return EccAlignmentResult(
        aligned_bgr=aligned, applied=True, converged=True,
        tx=tx, ty=ty, elapsed_ms=elapsed,
    )
```

### 4.2 辅助函数

```python
def _resolve_ecc_motion(motion_type: str) -> int:
    """将配置中的字符串运动类型映射到 cv2 常量。"""
    if motion_type == "translation":
        return cv2.MOTION_TRANSLATION
    if motion_type == "euclidean":
        return cv2.MOTION_EUCLIDEAN
    if motion_type == "affine":
        return cv2.MOTION_AFFINE
    raise ConfigurationError(
        "ecc_motion_type must be 'translation', 'euclidean', or 'affine'"
    )
```

---

## 五、配置参数新增

**文件**：`src/pixel_diff/models.py`

在 `PixelDiffConfig` 中，`ransac_reprojection_threshold` 之后新增：

```python
# ─── ECC 亚像素精对齐 ───
ecc_enabled: bool = False
"""是否启用 ECC 亚像素精对齐。默认关闭，便于 A/B 测试。"""

ecc_downscale: int = 4
"""ECC 降采样因子。值越大越快，但精度略降。建议 2-4。"""

ecc_motion_type: str = "translation"
"""ECC 运动模型："translation"（2DOF，推荐）、"euclidean"（3DOF）、"affine"（6DOF）。
必须使用 "translation"，因为 SURF 已处理旋转/缩放/透视。"""

ecc_max_iterations: int = 50
"""ECC 最大迭代次数。"""

ecc_epsilon: float = 1e-4
"""ECC 相关系数收敛阈值。"""
```

**在 `validate()` 方法中新增校验**：

```python
if self.ecc_enabled:
    if self.ecc_motion_type not in {"translation", "euclidean", "affine"}:
        raise ConfigurationError(
            "configuration: ecc_motion_type must be "
            "'translation', 'euclidean', or 'affine'"
        )
    if self.ecc_downscale <= 0:
        raise ConfigurationError(
            "configuration: ecc_downscale must be positive"
        )
    if self.ecc_max_iterations <= 0:
        raise ConfigurationError(
            "configuration: ecc_max_iterations must be positive"
        )
    if self.ecc_epsilon <= 0:
        raise ConfigurationError(
            "configuration: ecc_epsilon must be positive"
        )
```

---

## 六、管道集成修改

**文件**：`src/pixel_diff/engine.py`

### 6.1 import 补充（第 18 行附近）

```python
from pixel_diff.alignment import (
    align_scan_to_template_bgr,
    align_ecc_subpixel_bgr,  # 新增
)
```

### 6.2 阶段 2 修改（原第 117-118 行附近）

```python
local_warp = apply_constrained_local_warp_bgr(
    line_alignment.aligned_bgr,
    template_bgr,
    self.config,
)
# 2e. ECC 亚像素精对齐（可选，默认关闭）
ecc = align_ecc_subpixel_bgr(local_warp.aligned_bgr, template_bgr, self.config)
aligned_bgr = ecc.aligned_bgr
```

### 6.3 metrics 中追加 ECC 诊断信息

在 metrics 字典末尾（`**risk_metrics` 之前）追加：

```python
# ECC 诊断
"ecc_enabled": int(self.config.ecc_enabled),
"ecc_applied": int(ecc.applied),
"ecc_converged": int(ecc.converged),
"ecc_tx": ecc.tx,
"ecc_ty": ecc.ty,
"ecc_elapsed_ms": int(round(ecc.elapsed_ms)),
```

---

## 七、默认配置更新

**文件**：`configs/default.yaml`

在 `ransac_reprojection_threshold` 之后追加：

```yaml
# ECC 亚像素精对齐
ecc_enabled: false
ecc_downscale: 4
ecc_motion_type: "translation"
ecc_max_iterations: 50
ecc_epsilon: 1.0e-4
```

---

## 八、关键设计决策

| 决策 | 理由 |
|------|------|
| `MOTION_TRANSLATION`（不是 AFFINE） | SURF 已处理旋转/缩放/透视，ECC 只补平移。AFFINE 会过拟合 + 与 line_centroid 产生反馈干扰 |
| 降采样 4x 而非逐级金字塔 | 平移向量对降采样线性可乘，旋转/缩放分量不变。单层 4x 已足够快（A4@300dpi 约 50ms），不需要多级 |
| `INTER_LANCZOS4`（不是 LINEAR） | ECC 后已有 3 次重采样（SURF warpPerspective LINEAR → line_centroid remap LINEAR → ECC），最后一次用 Lanczos4 可以减少累计模糊 |
| `BORDER_REPLICATE`（不是 BORDER_CONSTANT） | ECC 平移量极小（< 3px），REPLICATE 不会引入明显伪影；CONSTANT 填白可能在后续自适应二值化中产生假边界 |
| 默认关闭（`ecc_enabled: false`） | 便于 A/B 对比，确认有效后再默认开启 |
| 降级在异常时返回原图 | 空白页/纯图页 ECC 不收敛时不应中断管道，跳过 ECC 继续后续流程 |

---

## 九、改动文件清单

| 文件 | 改动类型 | 改动量 |
|------|:---:|:---:|
| `src/pixel_diff/models.py` | 新增 5 个字段 + validate 校验 | +20 行 |
| `src/pixel_diff/alignment.py` | 新增 EccAlignmentResult + 2 个函数 | +80 行 |
| `src/pixel_diff/engine.py` | import + 1 步插入 + metrics 追加 | +12 行 |
| `configs/default.yaml` | 新增 5 行 YAML | +5 行 |
| **总计** | | **~117 行** |

---

## 十、验证方法

```bash
# 1. 关闭 ECC（基线）
python scripts/compare.py --config configs/default.yaml \
    test_docx/doc_v1.docx test_docx/doc_v2.docx

# 2. 开启 ECC（对比）
python scripts/compare.py --config configs/default.yaml -O ecc_enabled=true \
    test_docx/doc_v1.docx test_docx/doc_v2.docx
```

**预期效果**：

- 开启 ECC 后 `inlier_ratio` 不直接提升（ECC 在 SURF 之后运行），但最终 XOR 区域数应**减少 15-30%**
- 关键看 `ecc_tx` / `ecc_ty`：对正常文档应在 ±2px 范围内；若输出 0.0 且 `ecc_converged=0`，说明页面纹理不足以驱动 ECC
- `ecc_elapsed_ms` 对 A4@300dpi 应 < 200ms