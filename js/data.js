/* =========================================================
   data.js
   Loads data/tools.json once and exposes small helper
   functions that every other page/module reuses:
     - AICompass.getTools()      -> Promise<Array of tool objects>
     - AICompass.getCategories() -> Promise<Array of {name, count, bearing}>
     - AICompass.renderToolCard(tool) -> HTML string for one card
     - AICompass.pricingBadgeClass(pricing)
   Keeping this in one file means every page renders cards
   the exact same way.
   ========================================================= */

window.AICompass = window.AICompass || {};

(function () {
  let toolsCache = null;
  let categoriesCache = null;

  // Fetch tools.json (only once, then reuse the cached array).
  // Any failure (network error, bad JSON, non-array payload) resolves
  // to an empty array instead of throwing, so pages can render an
  // empty state rather than crash.
  function getTools() {
    if (toolsCache) return Promise.resolve(toolsCache);
    return fetch("data/tools.json")
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load tools.json (HTTP ${res.status})`);
        return res.json();
      })
      .then((tools) => {
        if (!Array.isArray(tools)) throw new Error("tools.json did not contain an array");
        toolsCache = tools;
        return tools;
      })
      .catch((err) => {
        showDataError(err);
        return [];
      });
  }

  function showDataError(err) {
    if (window.AICompass.toast) {
      window.AICompass.toast("Couldn't load the tools database. Please refresh the page.", "error");
    }
  }

  // Build category summary list (name, how many tools, bearing degree).
  // Categories are derived entirely from the data set — add a new
  // category to a tool in tools.json and it appears here automatically,
  // evenly spaced around the 360° compass rose.
  function getCategories() {
    if (categoriesCache) return Promise.resolve(categoriesCache);
    return getTools().then((tools) => {
      const counts = {};
      tools.forEach((t) => (counts[t.category] = (counts[t.category] || 0) + 1));
      const names = Object.keys(counts).sort();
      const step = names.length ? 360 / names.length : 0;
      categoriesCache = names.map((name, i) => ({
        name,
        count: counts[name],
        bearing: Math.round(i * step),
      }));
      return categoriesCache;
    });
  }

  function bearingFor(category) {
    if (!categoriesCache) return 0;
    const match = categoriesCache.find((c) => c.name === category);
    return match ? match.bearing : 0;
  }

  function pricingBadgeClass(pricing) {
    if (pricing === "Free") return "badge-free";
    if (pricing === "Paid") return "badge-paid";
    return "badge-free"; // Freemium reads as "free to start"
  }

  // Turn a tool's badges array into small <span> pills
  // Renders a tool's logo: the real image from assets/logos/ when tool.logo
  // is set, otherwise the colored-initials badge (unchanged fallback).
  // If the image fails to load at runtime, it swaps back to the initials
  // badge automatically instead of showing a broken-image icon.
  // boxSize/radius/fontSize let callers match their existing CSS classes
  // (tool-card's 48px box vs the details page's 76px box) via inline
  // styles, so no CSS files need to change.
function renderLogo(tool, className, boxSize, radius, fontSize) {
    const fallback = `<div class="${className}" style="width:${boxSize}px;height:${boxSize}px;border-radius:${radius}px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:${fontSize}px;color:#fff;flex-shrink:0;background:hsl(${tool.logoHue} 65% 45%)">${tool.logoInitials}</div>`;
    if (!tool.logo) return fallback;
    
    // We compute the inner size by subtracting the padding from both sides
    const paddingAmount = Math.round(boxSize * 0.14);
    const innerSize = boxSize - (paddingAmount * 2);

    return `
      <div class="${className}" style="width:${boxSize}px;height:${boxSize}px;border-radius:${radius}px;flex-shrink:0;position:relative;background:#fff;border:1px solid var(--line);overflow:hidden;box-sizing:border-box;">
        <img src="${tool.logo}" alt="${tool.name} logo" loading="lazy"
             style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:${innerSize}px;max-height:${innerSize}px;width:auto;height:auto;object-fit:contain;margin:0;padding:0;"
             onerror="this.parentElement.outerHTML='${fallback.replace(/'/g, "\\'")}
      </div>`;
}



  function renderBadges(tool) {
    return (tool.badges || [])
      .map((b) => `<span class="badge badge-${b}">${b}</span>`)
      .join("");
  }

  function starString(rating) {
    const full = Math.round(rating);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  // Build the HTML markup for one tool card. Used on Home, Tools,
  // Bookmarks, and search suggestion pages.
  function renderToolCard(tool) {
    const isBookmarked = window.AICompass.Bookmarks
      ? window.AICompass.Bookmarks.has(tool.id)
      : false;
    const isComparing = window.AICompass.Compare
      ? window.AICompass.Compare.has(tool.id)
      : false;

    return `
      <article class="tool-card" data-id="${tool.id}" data-category="${tool.category}">
        <div class="tool-card-top">
          ${renderLogo(tool, "tool-logo", 48, 14, 16)}
          <div class="card-badges">
            ${renderBadges(tool)}
            <span class="badge ${pricingBadgeClass(tool.pricing)}">${tool.pricing}</span>
          </div>
        </div>
        <div>
          <h3><a href="details.html?id=${tool.id}">${tool.name}</a></h3>
          <div class="tool-dev">by ${tool.developer}</div>
        </div>
        <div class="tool-meta-row">
          <span class="rating" title="${tool.rating} / 5">★ ${tool.rating.toFixed(1)}</span>
          <span>·</span>
          <span>${tool.category}</span>
        </div>
        <p class="tool-desc">${tool.description}</p>
        <div class="tool-tags">
          ${tool.tags.slice(0, 3).map((t) => `<span>#${t}</span>`).join("")}
        </div>
        <div class="tool-card-actions">
          <a class="btn btn-primary" href="details.html?id=${tool.id}">View Details</a>
          <a class="btn btn-outline" href="${tool.website}" target="_blank" rel="noopener">Visit</a>
        </div>
        <div class="tool-card-actions">
          <button class="btn btn-ghost bookmark-btn ${isBookmarked ? "active" : ""}" data-action="bookmark" data-id="${tool.id}">
            ${isBookmarked ? "★ Saved" : "☆ Bookmark"}
          </button>
          <button class="btn btn-ghost compare-btn ${isComparing ? "active" : ""}" data-action="compare" data-id="${tool.id}">
            ${isComparing ? "✓ Comparing" : "⇄ Compare"}
          </button>
        </div>
      </article>
    `;
  }

  function renderSkeletonCards(count) {
    return Array(count).fill('<div class="tool-card skeleton skeleton-card"></div>').join("");
  }

  window.AICompass.getTools = getTools;
  window.AICompass.getCategories = getCategories;
  window.AICompass.bearingFor = bearingFor;
  window.AICompass.renderToolCard = renderToolCard;
  window.AICompass.renderSkeletonCards = renderSkeletonCards;
  window.AICompass.renderLogo = renderLogo;
  window.AICompass.starString = starString;
})();
