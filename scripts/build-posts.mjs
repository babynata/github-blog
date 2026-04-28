import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const contentDir = path.join(rootDir, "content", "posts");
const postsDir = path.join(rootDir, "posts");
const dataDir = path.join(rootDir, "data");
const siteName = "青苔手记";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
}

function parseArrayValue(value) {
  return value
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^["']|["']$/g, ""));
}

function parseValue(rawValue) {
  const value = rawValue.trim();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return parseArrayValue(value);
  }

  return value.replace(/^["']|["']$/g, "");
}

function parseFrontMatter(rawContent, fileName) {
  const normalized = String(rawContent).replace(/\r\n/g, "\n").trim();
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`Missing front matter in ${fileName}`);
  }

  const [, frontMatter, body] = match;
  const data = {};

  for (const line of frontMatter.split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid front matter line in ${fileName}: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    data[key] = parseValue(value);
  }

  return {
    data,
    body: body.trim()
  };
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getReadingTime(markdown) {
  const cjkCount = (markdown.match(/[\u3400-\u9fff]/g) || []).length;
  const latinWords = (markdown.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
  const units = cjkCount + latinWords;
  const minutes = Math.max(1, Math.ceil(units / 320));
  return `${minutes} min`;
}

function renderInline(markdown) {
  let html = escapeHtml(markdown);

  html = html.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    return `<a href="${href}">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return html;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = [];
  let quote = [];
  let codeFence = null;

  function flushParagraph() {
    if (!paragraph.length) {
      return;
    }

    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) {
      return;
    }

    html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  function flushQuote() {
    if (!quote.length) {
      return;
    }

    html.push(`<blockquote>${quote.map((item) => renderInline(item)).join("<br>")}</blockquote>`);
    quote = [];
  }

  function flushCodeFence() {
    if (!codeFence) {
      return;
    }

    const languageClass = codeFence.language ? ` class="language-${escapeHtml(codeFence.language)}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeFence.lines.join("\n"))}</code></pre>`);
    codeFence = null;
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (const line of lines) {
    if (codeFence) {
      if (line.startsWith("```")) {
        flushCodeFence();
      } else {
        codeFence.lines.push(line);
      }
      continue;
    }

    if (line.startsWith("```")) {
      flushAll();
      codeFence = {
        language: line.slice(3).trim(),
        lines: []
      };
      continue;
    }

    if (!line.trim()) {
      flushAll();
      continue;
    }

    if (line.startsWith("### ")) {
      flushAll();
      html.push(`<h3>${renderInline(line.slice(4).trim())}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      html.push(`<h2>${renderInline(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      flushAll();
      html.push(`<h2>${renderInline(line.slice(2).trim())}</h2>`);
      continue;
    }

    if (/^[-*] /.test(line)) {
      flushParagraph();
      flushQuote();
      list.push(line.replace(/^[-*] /, "").trim());
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(line.replace(/^>\s?/, "").trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushAll();
  flushCodeFence();

  return html.join("\n");
}

function getExcerpt(body) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith(">") && !line.startsWith("```")) || "";
}

function buildPostPage(post) {
  const metaItems = [post.displayDate, post.readTime, ...post.tags].map((item) => `<span>${escapeHtml(item)}</span>`).join("");
  const footerNote = post.note || `最后更新于 ${post.updatedDisplay}`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(post.description)}">
  <meta name="theme-color" content="#dce6da">
  <title>${escapeHtml(post.title)} | ${siteName}</title>
  <link rel="stylesheet" href="../styles.css">
  <script src="../script.js" defer></script>
</head>
<body class="article-page">
  <div class="page-shell">
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-mark" aria-hidden="true"></span>
        <span class="brand-copy">
          <strong>${siteName}</strong>
          <span>minimal notes for calm building</span>
        </span>
      </a>
      <nav class="site-nav" aria-label="文章导航">
        <a href="../index.html#posts">文章</a>
        <a href="../index.html#about">关于</a>
      </nav>
    </header>

    <main>
      <article class="article-shell reveal">
        <p class="eyebrow">${escapeHtml(post.category)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <div class="article-meta">
          ${metaItems}
        </div>

        <div class="article-content">
          ${post.html}
        </div>

        <div class="article-end">
          <a class="back-link" href="../index.html#posts">返回文章列表</a>
          <span>${escapeHtml(footerNote)}</span>
        </div>
      </article>
    </main>

    <footer class="site-footer">
      <span>© <span data-year></span> ${siteName}</span>
      <span>个人写作，持续更新</span>
    </footer>
  </div>
</body>
</html>
`;
}

function sortPosts(posts) {
  return posts.sort((left, right) => {
    const leftDate = Date.parse(left.rawDate);
    const rightDate = Date.parse(right.rawDate);
    return rightDate - leftDate;
  });
}

async function main() {
  await mkdir(postsDir, { recursive: true });
  await mkdir(dataDir, { recursive: true });

  const files = (await readdir(contentDir))
    .filter((file) => file.endsWith(".md"))
    .filter((file) => !file.startsWith("_"));

  const posts = [];
  const generatedPostFiles = new Set();

  for (const file of files) {
    const sourcePath = path.join(contentDir, file);
    const rawContent = await readFile(sourcePath, "utf8");
    const { data, body } = parseFrontMatter(rawContent, file);

    if (!data.title || !data.date) {
      throw new Error(`Post ${file} must include title and date`);
    }

    const slug = data.slug || slugify(data.title);
    const status = data.status || "published";
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const readTime = data.readTime || getReadingTime(body);
    const displayDate = formatDate(data.date);
    const updatedAt = data.updatedAt || data.date;
    const updatedDisplay = formatDate(updatedAt);
    const summary = data.summary || getExcerpt(body);
    const description = data.description || summary || data.title;
    const category = data.category || tags.slice(0, 2).join(" / ") || "文章";
    const html = renderMarkdown(body);
    const href = status === "published" ? `posts/${slug}.html` : null;
    const generatedPath = href;

    const post = {
      title: data.title,
      slug,
      summary,
      description,
      category,
      tags,
      status,
      note: data.note || "",
      readTime,
      rawDate: data.date,
      date: displayDate,
      displayDate,
      updatedAt,
      updatedDisplay,
      href,
      generatedPath,
      sourcePath: `content/posts/${file}`,
      sourceHref: `content/posts/${file}`,
      html
    };

    posts.push(post);

    if (status === "published") {
      generatedPostFiles.add(`${slug}.html`);
      await writeFile(path.join(rootDir, href), buildPostPage(post), "utf8");
    }
  }

  const existingGeneratedFiles = (await readdir(postsDir)).filter((file) => file.endsWith(".html"));

  for (const file of existingGeneratedFiles) {
    if (!generatedPostFiles.has(file)) {
      await unlink(path.join(postsDir, file));
    }
  }

  const sortedPosts = sortPosts(posts).map((post) => ({
    title: post.title,
    slug: post.slug,
    date: post.displayDate,
    rawDate: post.rawDate,
    updatedAt: post.updatedDisplay,
    readTime: post.readTime,
    tags: post.tags,
    status: post.status,
    category: post.category,
    summary: post.summary,
    description: post.description,
    href: post.href,
    generatedPath: post.generatedPath,
    sourcePath: post.sourcePath,
    sourceHref: post.sourceHref,
    note: post.note
  }));

  await writeFile(path.join(dataDir, "posts.json"), `${JSON.stringify(sortedPosts, null, 2)}\n`, "utf8");
  await writeFile(path.join(dataDir, "posts.js"), `window.BLOG_POSTS = ${JSON.stringify(sortedPosts, null, 2)};\n`, "utf8");

  console.log(`Built ${sortedPosts.filter((post) => post.status === "published").length} published posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
