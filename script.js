const posts = [
  {
    title: "在低噪声界面里写作",
    date: "2026.04.22",
    readTime: "4 min",
    tags: ["设计", "写作"],
    href: "posts/on-quiet-interfaces.html",
    summary: "界面越克制，内容越容易被真正读进去。聊聊为什么我会把色彩、留白和信息密度同时压下来。"
  },
  {
    title: "GitHub Pages 的轻量工作流",
    date: "2026.04.18",
    readTime: "5 min",
    tags: ["GitHub", "部署"],
    href: "posts/github-pages-workflow.html",
    summary: "不引入复杂框架，也能把个人博客维护得很舒服。目录怎么放、文章怎么写、怎么发，都可以很简单。"
  },
  {
    title: "为什么我偏爱小工具而不是大系统",
    date: "2026.04.10",
    readTime: "4 min",
    tags: ["产品", "代码"],
    href: "posts/build-small-tools.html",
    summary: "真正能长期留下来的，往往不是最大的工程，而是那些你愿意反复打开、反复改进的小东西。"
  }
];

function getTags() {
  return ["全部", ...new Set(posts.flatMap((post) => post.tags))];
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
    .map((post) => {
      const tags = post.tags
        .map((tag) => `<span class="post-tag">${tag}</span>`)
        .join("");

      return `
        <a class="post-card" href="${post.href}">
          <div class="post-top">
            <span>${post.date}</span>
            <span>${post.readTime}</span>
          </div>
          <div>
            <h3>${post.title}</h3>
          </div>
          <p>${post.summary}</p>
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

  const filterContainer = document.querySelector("#tag-filters");
  const postContainer = document.querySelector("#post-list");
  const totalNode = document.querySelector("#post-total");

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
