# 青苔手记

一个可直接部署到 GitHub Pages 的极简博客模板，主色调为低饱和绿色。
现在已经升级成第一阶段的文章管理方案：

- 文章写在 `content/posts/*.md`
- 构建脚本自动生成 `posts/*.html`
- 首页和内容台都从 `data/posts.js` 读取文章数据

## 目录结构

```text
github-blog/
├── admin/
│   ├── admin.js
│   └── index.html
├── content/
│   └── posts/
│       ├── _template.md
│       └── *.md
├── data/
│   ├── posts.js
│   └── posts.json
├── index.html
├── package.json
├── scripts/
│   └── build-posts.mjs
├── styles.css
├── script.js
└── posts/
    └── *.html
```

## 如何部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 把 `github-blog` 目录下的所有文件上传到仓库根目录。
3. 在 GitHub 仓库的 `Settings -> Pages` 中，把发布源设置为当前分支的根目录。
4. 稍等几分钟，GitHub Pages 就会生成你的博客地址。

如果你想把它放到现有仓库，也可以把这些文件放进 `docs/` 目录，再把 Pages 的发布源切到 `docs`。

## 现在怎么管理文章

1. 复制 `content/posts/_template.md`
2. 改文件名，例如 `my-first-post.md`
3. 填写头部信息：

```md
---
title: 我的第一篇文章
slug: my-first-post
date: 2026-04-23
updatedAt: 2026-04-23
summary: 这里是首页摘要
description: 这里是页面描述
category: 写作 / 随笔
tags: [写作, 随笔]
status: published
note: 这里可以写文章页底部提示
---
```

4. 在正文部分用 Markdown 写内容
5. 运行：

```bash
node scripts/build-posts.mjs
```

或者：

```bash
npm run build:posts
```

6. 提交并 push 到 GitHub，Pages 会自动更新

## 内容台入口

- 本地打开：`admin/index.html`
- 部署后打开：`https://你的域名/admin/`

内容台会显示：
- 已发布 / 草稿状态
- 标签与筛选
- 源文件路径
- 公开文章页路径

当前阶段里，`draft` 文章不会出现在首页，也不会生成公开文章页。

## 小提示

- 首页仍然可以直接双击 `index.html` 本地预览。
- 每次改完 Markdown 后，记得重新运行一次构建脚本。
- 已经附带 `.nojekyll`，更适合纯静态托管。
