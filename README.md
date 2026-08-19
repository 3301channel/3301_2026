# 3301 channel

个人博客，基于 [Hexo](https://hexo.io/) + [Matery 主题](https://github.com/blinkfox/hexo-theme-matery) 构建，通过 GitHub Pages 发布。

博客地址：<https://3301channel.github.io/3301_2026/>

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
3301_2026/
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

手动部署步骤：

```bash
npx hexo generate          # 生成静态文件到 public/
cd public
git init && git add -A && git commit -m "deploy"
git push -f https://github.com/3301channel/3301_2026.git HEAD:gh-pages
```

> Pages 已配置为从 `gh-pages` 分支发布，推送后稍等片刻即可在 <https://3301channel.github.io/3301_2026/> 访问。
