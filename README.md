# 青苔手记

一个可直接部署到 GitHub Pages 的极简博客模板，主色调为低饱和绿色。

## 目录结构

```text
github-blog/
├── index.html
├── styles.css
├── script.js
└── posts/
    ├── build-small-tools.html
    ├── github-pages-workflow.html
    └── on-quiet-interfaces.html
```

## 如何部署到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 把 `github-blog` 目录下的所有文件上传到仓库根目录。
3. 在 GitHub 仓库的 `Settings -> Pages` 中，把发布源设置为当前分支的根目录。
4. 稍等几分钟，GitHub Pages 就会生成你的博客地址。

如果你想把它放到现有仓库，也可以把这些文件放进 `docs/` 目录，再把 Pages 的发布源切到 `docs`。

## 如何改成你自己的博客

1. 修改 `index.html` 里的站点名称、首页文案和导航。
2. 在 `script.js` 里新增或调整文章卡片信息。
3. 在 `posts/` 目录里复制一篇文章模板，改成你的正文内容。
4. 按需替换颜色变量，入口在 `styles.css` 顶部的 `:root`。

## 小提示

- 这个模板不需要构建工具，双击 `index.html` 就能本地预览。
- 已经附带 `.nojekyll`，更适合纯静态托管。
