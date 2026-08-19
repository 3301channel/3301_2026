# -*- coding: utf-8 -*-
"""把 study 目录的学习文档批量整理为博客文章（含敏感信息脱敏）"""
import os
import re

STUDY_DIR = r'C:\Users\Jason\Desktop\study'
OUT_DIR = r'E:\Code\text\abc3301.github.io\source\_posts'

# (文件名, 标题, 分类, 标签列表, 封面图编号)
META = [
    ('Git.md', 'Git 核心常用命令超详细文档（通俗易懂版）', '后端开发', ['Git'], '0'),
    ('HTTP接口快速入门学习文档.md', 'HTTP 接口快速入门学习文档', '后端开发', ['HTTP', '接口'], '1'),
    ('ECC_INTEGRATION_GUIDE.md', 'ECC 亚像素精对齐集成指南', '图像处理', ['ECC', '图像对齐'], '2'),
    ('kulin打包.md', 'Nuitka 打包笔记（ARM64 / 飞腾机器）', '部署运维', ['Nuitka', '打包', 'ARM'], '3'),
    ('NLP.md', '自然语言处理（NLP）核心技术及应用', 'AI', ['NLP'], '4'),
    ('NLP_Code_Expanded.md', 'NLP 基础技术实战（代码详解版）', 'AI', ['NLP', 'Transformer'], '5'),
    ('OCR快速学习指南.md', 'OCR 光学字符识别 — 深度技术指南', 'AI', ['OCR'], '6'),
    ('Pixel_Diff接口文档.md', 'Pixel Diff 文档对比服务接口文档', '接口文档', ['PixelDiff', '接口'], '7'),
    ('Redis&Tomcat 快速入门学习文档.md', 'Redis & Tomcat 快速入门学习文档', '后端开发', ['Redis', 'Tomcat'], '8'),
    ('springboot.md', 'Spring Boot 基础学习文档', '后端开发', ['SpringBoot'], '9'),
    ('watermark.md', 'PDF 不可见水印嵌入与提取程序设计', '图像处理', ['水印', 'PDF'], '10'),
    ('后端开发学习文档.md', '后端开发全方位入门与进阶学习文档（2026）', '后端开发', ['后端', '综合'], '11'),
    ('水印接口文档.md', 'PDF 水印接口文档', '接口文档', ['水印', '接口'], '12'),
]


def sanitize(text):
    """敏感信息脱敏"""
    # 数据库明文用户名/密码 -> 环境变量占位符
    text = re.sub(r'username:\s*\S+', 'username: ${DB_USERNAME}', text)
    text = re.sub(r'password:\s*\S+', 'password: ${DB_PASSWORD}', text)
    # JWT / Bearer Token 示例 -> 占位符
    text = re.sub(r'Bearer\s+eyJ[A-Za-z0-9._-]{10,}', 'Bearer <JWT_TOKEN>', text)
    text = re.sub(r'eyJ[A-Za-z0-9._-]{10,}\.xxxxsign', '<JWT_TOKEN>', text)
    # 常见明文密钥赋值 -> 脱敏
    text = re.sub(r'(["\']?(api[_-]?key|secret|token|passwd|pwd)["\']?\s*[:=]\s*["\'])[^"\']+(["\'])',
                  r'\1********\3', text, flags=re.IGNORECASE)
    return text


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for hour, (fname, title, cat, tags, img) in enumerate(META, start=9):
        src = os.path.join(STUDY_DIR, fname)
        with open(src, encoding='utf-8-sig') as f:
            content = f.read().strip()
        content = sanitize(content)

        # 生成 front-matter
        date = f'2026-08-19 {hour:02d}:00:00'
        tag_lines = '\n'.join(f'  - {t}' for t in tags)
        fm = (
            '---\n'
            f'title: "{title}"\n'
            f'date: {date}\n'
            'author: ZhangSki\n'
            f'img: /medias/featureimages/{img}.jpg\n'
            'top: false\n'
            'cover: false\n'
            f'coverImg: /medias/featureimages/{img}.jpg\n'
            'toc: true\n'
            'mathjax: false\n'
            f'categories:\n  - {cat}\n'
            f'tags:\n{tag_lines}\n'
            '---\n\n'
        )

        out_name = fname.replace(' ', '-').replace('&', 'and')
        out_path = os.path.join(OUT_DIR, out_name)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(fm + content)
        print(f'OK: {out_name} ({len(content)} chars)')

    print('\n全部完成，共', len(META), '篇')


if __name__ == '__main__':
    main()
