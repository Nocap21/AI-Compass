  // 1) Sitewide UI wiring that every page needs: mobile nav
  //     drawer, scroll-to-top button, active nav link highlight,
  //     newsletter form.
  //  2) Home page only: trending / featured / categories /
  //     popular searches / recently added rails

document.addEventListener("DOMContentLoaded", function () {
  wireMobileDrawer();
  wireScrollTop();
  highlightActiveNavLink();
  wireNewsletterForm();

  // Home-page-only sections (these elements only exist on index.html)
  if (document.getElementById("trending-tools")) initHomePage();
});

/* ---------- Sitewide: mobile nav drawer ---------- */
function wireMobileDrawer() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const drawer = document.getElementById("mobile-drawer");
  if (!toggle || !drawer) return;
  const closeBtn = drawer.querySelector("[data-drawer-close]");
  toggle.addEventListener("click", () => drawer.classList.add("open"));
  if (closeBtn) closeBtn.addEventListener("click", () => drawer.classList.remove("open"));
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) drawer.classList.remove("open");
  });
}

/* ---------- Sitewide: scroll-to-top button ---------- */
function wireScrollTop() {
  const btn = document.getElementById("scroll-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("show", window.scrollY > 500);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ---------- Sitewide: highlight the current page's nav link ---------- */
function highlightActiveNavLink() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a, .mobile-drawer-panel a").forEach((link) => {
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
}

/* ---------- Sitewide: newsletter signup ---------- */
function wireNewsletterForm() {
  const form = document.getElementById("newsletter-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input[type='email']");
    if (input && input.value.includes("@")) {
      window.AICompass.toast("Subscribed! Watch your inbox for new tools.", "success");
      form.reset();
    } else {
      window.AICompass.toast("Enter a valid email address", "error");
    }
  });
}

/* ============================================================
   HOME PAGE LOGIC
   ============================================================ */
function initHomePage() {
  window.AICompass.getTools().then((tools) => {
    renderTrending(tools);
    renderFeatured(tools);
    renderRecentlyAdded(tools);
    renderPopularSearches(tools);
  });
  window.AICompass.getCategories().then(renderCategories);
  renderRecentlyViewedOrFallback();
}

function renderTrending(tools) {
  const el = document.getElementById("trending-tools");
  const trending = tools.filter((t) => t.badges.includes("trending")).slice(0, 4);
  el.innerHTML = trending.map(window.AICompass.renderToolCard).join("");
}

function renderFeatured(tools) {
  const el = document.getElementById("featured-tools");
  // "Featured" = highest rated tools overall
  const featured = [...tools].sort((a, b) => b.rating - a.rating).slice(0, 8);
  el.innerHTML = featured.map(window.AICompass.renderToolCard).join("");
}

function renderRecentlyAdded(tools) {
  const el = document.getElementById("recent-tools");
  const recent = [...tools].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 4);
  el.innerHTML = recent.map(window.AICompass.renderToolCard).join("");
}

function renderCategories(categories) {
  const el = document.getElementById("category-grid");
  el.innerHTML = categories
    .map(
      (c) => `
      <a class="category-card" href="tools.html?category=${encodeURIComponent(c.name)}">
        <div class="deg">${String(c.bearing).padStart(3, "0")}°</div>
        <h3>${c.name}</h3>
        <div class="count">${c.count} tool${c.count === 1 ? "" : "s"}</div>
      </a>`
    )
    .join("");
}

function renderPopularSearches(tools) {
  const el = document.getElementById("popular-searches");
  if (!el) return;
  const popular = ["ChatGPT", "Image Generation", "Coding", "Voice Cloning", "Free", "Video Generation"];
  el.innerHTML = popular.map((p) => `<button class="tag-chip" data-search-tag="${p}">${p}</button>`).join("");
}

function renderRecentlyViewedOrFallback() {
  const section = document.getElementById("recently-viewed-section");
  if (!section) return;
  const ids = window.AICompass.RecentlyViewed.getAll();
  if (ids.length === 0) {
    section.classList.add("hidden");
    return;
  }
  window.AICompass.getTools().then((tools) => {
    const list = ids.map((id) => tools.find((t) => t.id === id)).filter(Boolean);
    if (list.length === 0) {
      section.classList.add("hidden");
      return;
    }
    document.getElementById("recently-viewed-tools").innerHTML = list.map(window.AICompass.renderToolCard).join("");
  });
}
