/* =========================================================
   details.js
   Reads ?id= from the URL, finds that tool in tools.json, and
   fills in every part of the Details page template. Also records
   the visit in Recently Viewed and wires the Share / Copy Link
   buttons.
   ========================================================= */

(function () {
  const root = document.getElementById("details-root");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));

  window.AICompass.getTools().then((tools) => {
    const tool = tools.find((t) => t.id === id);
    if (!tool) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="deg-mark">404 · OFF COURSE</div>
          <h2>We couldn't find that tool</h2>
          <p>It may have been removed, or the link is out of date.</p>
          <a class="btn btn-primary" href="tools.html">Browse all tools</a>
        </div>`;
      return;
    }

    document.title = `${tool.name} · AI Compass`;
    window.AICompass.RecentlyViewed.record(tool.id);
    render(tool, tools);
  });

  function render(tool, allTools) {
    const isBookmarked = window.AICompass.Bookmarks.has(tool.id);
    const isComparing = window.AICompass.Compare.has(tool.id);
    const bearing = window.AICompass.bearingFor(tool.category);

    root.innerHTML = `
      <section class="details-hero">
        <div class="container">
          <div class="bearing">BEARING ${String(bearing).padStart(3, "0")}° · ${tool.category}</div>
          <div class="details-hero-top">
            ${window.AICompass.renderLogo(tool, "details-logo", 76, 20, 26)}
            <div class="details-title-block">
              <h1>${tool.name}</h1>
              <div class="tool-dev">by ${tool.developer}</div>
              <div class="tool-meta-row" style="margin-top:8px;">
                <span class="rating">★ ${tool.rating.toFixed(1)}</span>
                <span>·</span>
                <span class="badge ${window.AICompass.bearingFor ? "" : ""} badge-${tool.pricing === "Free" ? "free" : tool.pricing === "Paid" ? "paid" : "free"}">${tool.pricing}</span>
                ${tool.badges.map((b) => `<span class="badge badge-${b}">${b}</span>`).join("")}
              </div>
              <div class="details-actions">
                <a class="btn btn-primary" href="${tool.website}" target="_blank" rel="noopener">Visit Website</a>
                <a class="btn btn-outline" href="${tool.youtube}" target="_blank" rel="noopener">▶ Watch Tutorial</a>
                <button class="btn btn-ghost bookmark-btn ${isBookmarked ? "active" : ""}" data-action="bookmark" data-id="${tool.id}">${isBookmarked ? "★ Saved" : "☆ Bookmark"}</button>
                <button class="btn btn-ghost compare-btn ${isComparing ? "active" : ""}" data-action="compare" data-id="${tool.id}">${isComparing ? "✓ Comparing" : "⇄ Compare"}</button>
                <button class="btn btn-icon" data-action="share" title="Share tool">⇪</button>
                <button class="btn btn-icon" data-action="copy-link" title="Copy website link">⎘</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="container details-grid">
        <div class="details-main">
          <div class="details-section">
            <h2>Overview</h2>
            <p>${tool.longDescription}</p>
          </div>

          <div class="details-section">
            <h2>Features</h2>
            <ul class="feature-list">${tool.features.map((f) => `<li>${f}</li>`).join("")}</ul>
          </div>

          <div class="details-section">
            <h2>Pros &amp; Cons</h2>
            <div class="pros-cons">
              <div class="col pros"><h3>Pros</h3><ul>${tool.pros.map((p) => `<li>${p}</li>`).join("")}</ul></div>
              <div class="col cons"><h3>Cons</h3><ul>${tool.cons.map((c) => `<li>${c}</li>`).join("")}</ul></div>
            </div>
          </div>

          <div class="details-section">
            <h2>Video Tutorial</h2>
            <div class="video-embed">
              <iframe src="https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(tool.name + " tutorial")}" title="${tool.name} tutorial" allowfullscreen loading="lazy"></iframe>
            </div>
          </div>

          <div class="details-section">
            <h2>Tags</h2>
            <div class="tool-tags">${tool.tags.map((t) => `<span>#${t}</span>`).join("")}</div>
          </div>
        </div>

        <aside class="details-sidebar">
          <div class="side-card">
            <h3>Quick Specs</h3>
            <div class="spec-row"><span>Best For</span><span>${tool.industry}</span></div>
            <div class="spec-row"><span>Skill Level</span><span>${tool.skillLevel}</span></div>
            <div class="spec-row"><span>Pricing</span><span>${tool.pricing}</span></div>
            <div class="spec-row"><span>Added</span><span>${tool.dateAdded}</span></div>
          </div>
          <div class="side-card">
            <h3>Supported Platforms</h3>
            <div class="platform-chip-row">${tool.platforms.map((p) => `<span class="tag-chip">${p}</span>`).join("")}</div>
          </div>
          <div class="side-card">
            <h3>Alternatives</h3>
            ${
              tool.alternatives.length
                ? tool.alternatives
                    .map((altName) => {
                      const alt = allTools.find((t) => t.name === altName);
                      return alt
                        ? `<a class="alt-item" href="details.html?id=${alt.id}"><span>${alt.name}</span><span>★ ${alt.rating.toFixed(1)}</span></a>`
                        : `<div class="alt-item"><span>${altName}</span></div>`;
                    })
                    .join("")
                : `<p style="font-size:13.5px;">No listed alternatives yet.</p>`
            }
          </div>
        </aside>
      </div>
    `;

    wireShareButtons(tool);
  }

  function wireShareButtons(tool) {
    const shareBtn = root.querySelector('[data-action="share"]');
    const copyBtn = root.querySelector('[data-action="copy-link"]');

    if (shareBtn) {
      shareBtn.addEventListener("click", () => {
        const url = window.location.href;
        if (navigator.share) {
          navigator.share({ title: tool.name, text: tool.description, url }).catch(() => {});
        } else {
          navigator.clipboard.writeText(url).then(() => window.AICompass.toast("Page link copied to clipboard", "success"));
        }
      });
    }
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(tool.website).then(() => window.AICompass.toast("Website link copied", "success"));
      });
    }
  }
})();
