---
title: "Nuitka 打包笔记（ARM64 / 飞腾机器）"
date: 2026-08-19 12:00:00
author: ZhangSki
img: /medias/featureimages/3.jpg
top: false
cover: false
coverImg: /medias/featureimages/3.jpg
toc: true
mathjax: false
categories:
  - 部署运维
tags:
  - Nuitka
  - 打包
  - ARM
---

这个机器ARM64 架构

1. 激活虚拟环境`source xinchuang_env/bin/activate `

2. 针对飞腾 CPU（ARMv8-A）的 GCC 编译优化参数
   `export CFLAGS="-march=armv8-a+crc+crypto -O3"export CXXFLAGS="-march=armv8-a+crc+crypto -O3"`

3. 启动 Nuitka 编译（使用 --jobs=8 启用8核并行编译）
   ``python3 -m nuitka \ --standalone \ --lto=yes \ --remove-output \ --enable-plugin=anti-bloat \ --jobs=8 \ scripts/run_api.py``

4. 对kysec
   `sudo mkdir -p /opt/huilang_app `
   编译出来的 main.dist 内容拷贝 
   `sudo cp -r main.dist/* /opt/huilang_app/ `

5. 赋予执行权限，并限制修改 
   `sudo chmod -R 755 /opt/huilang_appsudo chmod +x /opt/huilang_app/main.bin`

6. 最一开始
   `sudo apt update`
    核心编译工具链
   `sudo apt install build-essential python3-dev patchelf scons -y`
    C 语言底层开发库
   `sudo apt install libssl-dev libffi-dev zlib1g-dev libjpeg-dev libpng-dev -y`