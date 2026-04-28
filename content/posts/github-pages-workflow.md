---
title: GitHub Pages 的轻量工作流
slug: github-pages-workflow
date: 2026-04-18
updatedAt: 2026-04-18
summary: 不引入复杂框架，也能把个人博客维护得很舒服。目录怎么放、文章怎么写、怎么发，都可以很简单。
description: 一个适合 GitHub Pages 的轻量博客工作流。
category: GitHub / 部署
tags: [GitHub, 部署]
status: draft
note: 这个模板已经适配好 GitHub Pages 的基础场景。
---

如果博客的维护成本太高，它往往会在第三篇文章之后被搁置。相比一开始就引入完整框架，我更偏爱先用最简单的静态结构跑起来。文章能发、样式稳定、目录清楚，这三件事已经足够。

## 最小可用结构

一个首页、一个样式文件、一个脚本文件，再加上独立的文章页面，其实就能组成一套清爽的博客。对 GitHub Pages 来说，这种结构还特别友好，因为不需要额外构建。

```text
github-blog/
├── content/
│   └── posts/
├── data/
├── posts/
└── scripts/
```

## 维护时只做两件事

- 在 `content/posts/` 里新建一篇 Markdown 文章。
- 运行 `node scripts/build-posts.mjs` 自动生成文章页和列表数据。

这样做的好处是，你不会被构建链和配置文件分散注意力。你处理的永远是非常具体的内容：标题写什么、摘要怎么写、正文顺序要不要改。

> 对个人博客来说，最好的工作流往往不是最强大的，而是最不容易中断的。

等你以后真的需要 RSS、标签页、全文检索，再往上加一层工具也不迟。先把写作这件事变轻，通常比一步到位更现实。
