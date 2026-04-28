const allPosts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];
const posts = allPosts.filter((post) => post.status === "published");
const fragments = Array.isArray(window.BLOG_FRAGMENTS) ? window.BLOG_FRAGMENTS : [];

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

  const filterContainer = document.querySelector("#tag-filters");
  const postContainer = document.querySelector("#post-list");
  const totalNode = document.querySelector("#post-total");
  const fragmentContainer = document.querySelector("#fragment-list");

  renderFragments(fragmentContainer);

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
});
