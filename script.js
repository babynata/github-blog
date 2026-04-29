const allPosts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];
const posts = allPosts.filter((post) => post.status === "published");
const fragments = Array.isArray(window.BLOG_FRAGMENTS) ? window.BLOG_FRAGMENTS : [];
const knowledgePoints = Array.isArray(window.BLOG_KNOWLEDGE_POINTS) ? window.BLOG_KNOWLEDGE_POINTS : [];
const VISITOR_API_BASE = "https://api.counterapi.dev/v1";
const VISITOR_NAMESPACE = "babynata-github-blog";
const VISITOR_COUNTER_NAME = "site-visits";
const VISITOR_STORAGE_KEY = "qingtai-visitor:last-counted-at";
const VISITOR_COUNT_WINDOW = 12 * 60 * 60 * 1000;
const COMMENTS_REPO = "babynata/github-blog";
const COMMENTS_REPO_ID = "R_kgDOSJrlCA";
const COMMENTS_CATEGORY = "General";
const COMMENTS_CATEGORY_ID = "DIC_kwDOSJrlCM4C78E8";
const COMMENTS_THEME = "light";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTags() {
  return ["全部", ...new Set(posts.flatMap((post) => post.tags))];
}

function updateSiteStats() {
  document.querySelectorAll("[data-post-count]").forEach((node) => {
    node.textContent = String(posts.length).padStart(2, "0");
  });

  document.querySelectorAll("[data-tag-count]").forEach((node) => {
    node.textContent = String(new Set(posts.flatMap((post) => post.tags)).size).padStart(2, "0");
  });
}

function setVisitorCountLabel(value) {
  document.querySelectorAll("[data-visitor-count]").forEach((node) => {
    node.textContent = value;
  });
}

function shouldIncrementVisitorCount() {
  try {
    const lastCountedAt = Number(window.localStorage.getItem(VISITOR_STORAGE_KEY) || 0);

    if (!lastCountedAt) {
      return true;
    }

    return Date.now() - lastCountedAt >= VISITOR_COUNT_WINDOW;
  } catch {
    return true;
  }
}

function markVisitorCounted() {
  try {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors and keep the counter functional.
  }
}

async function requestVisitorCount(shouldIncrement) {
  const actionSuffix = shouldIncrement ? "/up" : "";
  const url = `${VISITOR_API_BASE}/${VISITOR_NAMESPACE}/${VISITOR_COUNTER_NAME}${actionSuffix}`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Visitor counter request failed: ${response.status}`);
  }

  return response.json();
}

async function hydrateVisitorCount() {
  const counterNodes = document.querySelectorAll("[data-visitor-count]");

  if (!counterNodes.length) {
    return;
  }

  const shouldIncrement = shouldIncrementVisitorCount();

  try {
    let result;

    if (shouldIncrement) {
      result = await requestVisitorCount(true);
      markVisitorCounted();
    } else {
      try {
        result = await requestVisitorCount(false);
      } catch {
        result = await requestVisitorCount(true);
        markVisitorCounted();
      }
    }

    const formatted = typeof result.value === "number"
      ? result.value.toLocaleString("zh-CN")
      : "—";

    setVisitorCountLabel(formatted);
  } catch {
    setVisitorCountLabel("未连接");
  }
}

function mountGiscus(container) {
  if (!container || container.dataset.commentsMounted === "true") {
    return;
  }

  const term = container.dataset.commentsTerm;

  if (!term) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://giscus.app/client.js";
  script.async = true;
  script.crossOrigin = "anonymous";
  script.setAttribute("data-repo", COMMENTS_REPO);
  script.setAttribute("data-repo-id", COMMENTS_REPO_ID);
  script.setAttribute("data-category", COMMENTS_CATEGORY);
  script.setAttribute("data-category-id", COMMENTS_CATEGORY_ID);
  script.setAttribute("data-mapping", "specific");
  script.setAttribute("data-term", term);
  script.setAttribute("data-strict", "1");
  script.setAttribute("data-reactions-enabled", "1");
  script.setAttribute("data-emit-metadata", "0");
  script.setAttribute("data-input-position", "top");
  script.setAttribute("data-theme", COMMENTS_THEME);
  script.setAttribute("data-lang", "zh-CN");
  script.setAttribute("data-loading", "lazy");

  container.innerHTML = `
    <p class="comments-note">
      使用 GitHub 账号留言。如果评论框没有出现，请确认仓库已经安装
      <a href="https://github.com/apps/giscus" target="_blank" rel="noreferrer">giscus GitHub App</a>。
    </p>
    <div class="giscus"></div>
  `;

  container.dataset.commentsMounted = "true";
  container.appendChild(script);
}

function mountComments() {
  document.querySelectorAll("[data-comments-term]").forEach((container) => {
    mountGiscus(container);
  });
}

function renderFragmentBody(fragment) {
  if (Array.isArray(fragment.orderedItems) && fragment.orderedItems.length) {
    const items = fragment.orderedItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    return `<ol class="fragment-list">${items}</ol>`;
  }

  if (Array.isArray(fragment.paragraphs) && fragment.paragraphs.length) {
    return fragment.paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  if (fragment.quote) {
    return `<blockquote>${escapeHtml(fragment.quote)}</blockquote>`;
  }

  return `<p>${escapeHtml(fragment.body || "")}</p>`;
}

function renderKnowledgeBody(point) {
  if (Array.isArray(point.orderedItems) && point.orderedItems.length) {
    const items = point.orderedItems
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");

    return `<ol class="knowledge-list">${items}</ol>`;
  }

  if (Array.isArray(point.paragraphs) && point.paragraphs.length) {
    return point.paragraphs
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  return `<p>${escapeHtml(point.body || "")}</p>`;
}

function renderFragments(container) {
  if (!container) {
    return;
  }

  if (!fragments.length) {
    container.innerHTML = '<div class="empty-state">这里还没有公开的思考碎片。</div>';
    return;
  }

  const gridStateClass = fragments.length === 1 ? "has-single" : "has-multiple";
  container.classList.remove("has-single", "has-multiple");
  container.classList.add(gridStateClass);

  container.innerHTML = fragments
    .map((fragment, index) => {
      const kind = fragment.kind || "short";
      const angleClass = `fragment-angle-${(index % 3) + 1}`;
      const kindClass = `fragment-card fragment-card-${kind} ${angleClass}`;
      const title = fragment.title ? `<h3>${escapeHtml(fragment.title)}</h3>` : "";
      const label = fragment.label ? `<span class="fragment-type">${escapeHtml(fragment.label)}</span>` : "";
      const meta = fragment.date ? `<span class="fragment-date">${escapeHtml(fragment.date)}</span>` : "";

      return `
        <article class="${kindClass}">
          <div class="fragment-meta">
            ${label}
            ${meta}
          </div>
          ${title}
          ${renderFragmentBody(fragment)}
        </article>
      `;
    })
    .join("");
}

function renderKnowledgePoints(container, totalNode) {
  if (!container) {
    return;
  }

  if (totalNode) {
    totalNode.textContent = `${knowledgePoints.length} 条知识点`;
  }

  if (!knowledgePoints.length) {
    container.innerHTML = '<div class="empty-state">这里还没有公开的产品知识点。</div>';
    return;
  }

  const gridStateClass = knowledgePoints.length === 1 ? "has-single" : "has-multiple";
  container.classList.remove("has-single", "has-multiple");
  container.classList.add(gridStateClass);

  container.innerHTML = knowledgePoints
    .map((point) => {
      const label = point.label ? `<span class="knowledge-label">${escapeHtml(point.label)}</span>` : "";
      const date = point.date ? `<span class="knowledge-date">${escapeHtml(point.date)}</span>` : "";
      const title = point.title ? `<h3>${escapeHtml(point.title)}</h3>` : "";
      const tags = Array.isArray(point.tags) && point.tags.length
        ? `
          <div class="knowledge-tags">
            ${point.tags.map((tag) => `<span class="knowledge-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        `
        : "";

      return `
        <article class="knowledge-card">
          <div class="knowledge-meta">
            ${label}
            ${date}
          </div>
          ${title}
          <div class="knowledge-copy">
            ${renderKnowledgeBody(point)}
          </div>
          ${tags}
        </article>
      `;
    })
    .join("");
}

function renderFilters(container, activeTag, onSelect) {
  const filters = getTags()
    .map((tag) => {
      const activeClass = tag === activeTag ? "tag-filter is-active" : "tag-filter";
      const pressed = tag === activeTag ? "true" : "false";

      return `
        <button class="${activeClass}" type="button" data-tag="${tag}" aria-pressed="${pressed}">
          ${tag}
        </button>
      `;
    })
    .join("");

  container.innerHTML = filters;

  container.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => onSelect(button.dataset.tag));
  });
}

function renderPosts(container, totalNode, activeTag) {
  const filteredPosts = activeTag === "全部"
    ? posts
    : posts.filter((post) => post.tags.includes(activeTag));

  if (totalNode) {
    totalNode.textContent = `${filteredPosts.length} 篇文章`;
  }

  if (filteredPosts.length === 0) {
    container.innerHTML = '<div class="empty-state">这个标签下暂时还没有文章。</div>';
    return;
  }

  container.innerHTML = filteredPosts
    .map((post, index) => {
      const featuredClass = index === 0 ? "post-card is-featured" : "post-card";
      const tags = post.tags
        .map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`)
        .join("");

      return `
        <a class="${featuredClass}" href="${post.href}">
          <div class="post-top">
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readTime)}</span>
          </div>
          <div>
            <h3>${escapeHtml(post.title)}</h3>
          </div>
          <p>${escapeHtml(post.summary)}</p>
          <div class="post-tags">${tags}</div>
          <div class="post-footer">
            <span>阅读全文</span>
            <span>→</span>
          </div>
        </a>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    container.querySelectorAll(".post-card").forEach((card, index) => {
      card.style.setProperty("--card-delay", `${index * 80}ms`);
      card.classList.add("is-visible");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  updateSiteStats();
  hydrateVisitorCount();

  const filterContainer = document.querySelector("#tag-filters");
  const postContainer = document.querySelector("#post-list");
  const totalNode = document.querySelector("#post-total");
  const fragmentContainer = document.querySelector("#fragment-list");
  const knowledgeContainer = document.querySelector("#knowledge-list");
  const knowledgeTotalNode = document.querySelector("#knowledge-total");

  renderFragments(fragmentContainer);
  renderKnowledgePoints(knowledgeContainer, knowledgeTotalNode);

  if (!filterContainer || !postContainer) {
    return;
  }

  const state = {
    activeTag: "全部"
  };

  const update = (nextTag = state.activeTag) => {
    state.activeTag = nextTag;
    renderFilters(filterContainer, state.activeTag, update);
    renderPosts(postContainer, totalNode, state.activeTag);
  };

  update();
  mountComments();
});
