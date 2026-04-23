const adminPosts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getAdminTags(posts) {
  return ["all", ...new Set(posts.flatMap((post) => post.tags || []))];
}

function renderTagOptions(select, activeTag) {
  const options = getAdminTags(adminPosts)
    .map((tag) => {
      const label = tag === "all" ? "全部标签" : tag;
      const selected = tag === activeTag ? " selected" : "";
      return `<option value="${escapeHtml(tag)}"${selected}>${escapeHtml(label)}</option>`;
    })
    .join("");

  select.innerHTML = options;
}

function renderAdminSummary(posts) {
  const totalNode = document.querySelector("#admin-total-count");
  const publishedNode = document.querySelector("#admin-published-count");
  const draftNode = document.querySelector("#admin-draft-count");

  if (totalNode) {
    totalNode.textContent = String(posts.length).padStart(2, "0");
  }

  if (publishedNode) {
    publishedNode.textContent = String(posts.filter((post) => post.status === "published").length).padStart(2, "0");
  }

  if (draftNode) {
    draftNode.textContent = String(posts.filter((post) => post.status === "draft").length).padStart(2, "0");
  }
}

function getFilteredPosts(posts, state) {
  return posts.filter((post) => {
    const matchesStatus = state.status === "all" || post.status === state.status;
    const matchesTag = state.tag === "all" || (post.tags || []).includes(state.tag);
    const keyword = state.search.trim().toLowerCase();
    const haystack = `${post.title} ${post.summary} ${(post.tags || []).join(" ")}`.toLowerCase();
    const matchesSearch = !keyword || haystack.includes(keyword);
    return matchesStatus && matchesTag && matchesSearch;
  });
}

function renderAdminPosts(posts) {
  const listNode = document.querySelector("#admin-post-list");
  const visibleCountNode = document.querySelector("#admin-visible-count");

  if (!listNode) {
    return;
  }

  if (visibleCountNode) {
    visibleCountNode.textContent = `${posts.length} 篇可见`;
  }

  if (!posts.length) {
    listNode.innerHTML = '<div class="empty-state">当前筛选条件下没有文章。</div>';
    return;
  }

  listNode.innerHTML = posts
    .map((post) => {
      const previewLink = post.href
        ? `<a class="button button-primary" href="../${post.href}">预览文章</a>`
        : '<span class="status-note">草稿不会生成公开页面</span>';
      const tags = (post.tags || []).map((tag) => `<span class="post-tag">${escapeHtml(tag)}</span>`).join("");
      const statusClass = post.status === "published" ? "status-pill is-published" : "status-pill is-draft";
      const statusLabel = post.status === "published" ? "已发布" : "草稿";

      return `
        <article class="admin-post-card">
          <div class="admin-post-top">
            <div class="admin-post-copy">
              <p class="eyebrow">${escapeHtml(post.category)}</p>
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.summary)}</p>
            </div>
            <span class="${statusClass}">${statusLabel}</span>
          </div>

          <div class="admin-meta-grid">
            <span>${escapeHtml(post.date)}</span>
            <span>${escapeHtml(post.readTime)}</span>
            <span class="meta-code">${escapeHtml(post.sourcePath)}</span>
            <span class="meta-code">${escapeHtml(post.generatedPath || "未生成页面")}</span>
          </div>

          <div class="post-tags">${tags}</div>

          <div class="admin-actions">
            ${previewLink}
            <a class="button button-secondary" href="../${post.sourceHref}">查看源文件</a>
          </div>
        </article>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const searchNode = document.querySelector("#admin-search");
  const statusNode = document.querySelector("#admin-status");
  const tagNode = document.querySelector("#admin-tag");

  if (!searchNode || !statusNode || !tagNode) {
    return;
  }

  renderAdminSummary(adminPosts);

  const state = {
    search: "",
    status: "all",
    tag: "all"
  };

  const update = () => {
    renderTagOptions(tagNode, state.tag);
    renderAdminPosts(getFilteredPosts(adminPosts, state));
  };

  searchNode.addEventListener("input", (event) => {
    state.search = event.target.value;
    update();
  });

  statusNode.addEventListener("change", (event) => {
    state.status = event.target.value;
    update();
  });

  tagNode.addEventListener("change", (event) => {
    state.tag = event.target.value;
    update();
  });

  update();
});
