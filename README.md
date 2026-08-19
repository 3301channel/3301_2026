# 3301 channel

个人博客，基于 [Hexo](https://hexo.io/) + [Matery 主题](https://github.com/blinkfox/hexo-theme-matery) 构建，通过 GitHub Pages 发布。

博客地址：<https://abc3301.github.io/>

## 本地开发

```bash
# 安装依赖
npm install

# 本地预览（http://localhost:4000）
npm run server

# 生成静态文件到 public/
npm run build

# 清理并重新生成
npm run clean && npm run build
```

## 目录结构

```
abc3301.github.io/
├── _config.yml          # 站点配置
├── _config.matery.yml   # Matery 主题配置
├── scaffolds/           # 文章模板
├── source/
│   ├── _posts/          # 博客文章（Markdown）
│   ├── about/           # 关于页
│   ├── tags/            # 标签页
│   ├── categories/      # 分类页
│   ├── contact/         # 联系页
│   └── medias/          # 静态资源（banner、封面图、头像等）
└── themes/matery/       # 主题
```

## 写文章

```bash
npx hexo new "文章标题"
```

然后在 `source/_posts/` 下编辑生成的 Markdown 文件即可。

## 部署

推送代码到 `main` 分支后，GitHub Actions 会自动构建并部署到 `gh-pages` 分支。

> 首次使用需在仓库 `Settings → Pages` 中将 Source 设置为 `gh-pages` 分支。
