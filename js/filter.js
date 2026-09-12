/* =========================================================
   filter.js
   Drives the All Tools page: builds the filter checkboxes from
   the dataset, applies search + filters + sort, and re-renders
   the grid. Only runs if #tools-grid exists on the page.
   ========================================================= */

(function () {
  const grid = document.getElementById("tools-grid");
  if (!grid) return;

  const state = {
    query: "",
    category: [],
    developer: [],
    pricing: [],
    platform: [],
    skillLevel: [],
    industry: [],
    minRating: 0,
    sort: "relevance",
  };

  const filterGroups = [
    { key: "category", label: "Category", field: "category" },
    { key: "developer", label: "Developer", field: "developer" },
    { key: "pricing", label: "Pricing", field: "pricing" },
    { key: "platform", label: "Platform", field: "platforms", multi: true },
    { key: "skillLevel", label: "Skill Level", field: "skillLevel" },
    { key: "industry", label: "Industry", field: "industry" },
  ];

  let currentTools = [];

  window.AICompass.getTools().then((tools) => {
    currentTools = tools;
    // Read query params so links like tools.html?q=... or ?category=... work
    const params = new URLSearchParams(window.location.search);
    if (params.get("q")) state.query = params.get("q");
    if (params.get("category")) state.category = [params.get("category")];
    syncSearchInputs(state.query);

    buildFilterPanel(tools);
    wireSortSelect();
    wireMobileFilterToggle();
    applyAndRender(tools);
  });

  function syncSearchInputs(q) {
    document.querySelectorAll("[data-search-input]").forEach((input) => (input.value = q));
  }

  function buildFilterPanel(tools) {
    const panel = document.getElementById("filters-panel");
    // Category and Pricing start open (most-used); the longer lists
    // start collapsed so the panel doesn't tower over the page.
    const openByDefault = new Set(["category", "pricing"]);
    panel.innerHTML =
      filterGroups
        .map((group) => {
          let values;
          if (group.multi) {
            values = [...new Set(tools.flatMap((t) => t[group.field]))].sort();
          } else {
            values = [...new Set(tools.map((t) => t[group.field]))].sort();
          }
          const isOpen = openByDefault.has(group.key);
          return `
          <div class="filter-group${isOpen ? " open" : ""}" data-group="${group.key}">
            <button type="button" class="filter-group-toggle" aria-expanded="${isOpen}">
              <h4>${group.label}</h4>
              <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="filter-group-body">
              ${values
                .map(
                  (v) => `
                <label class="filter-option">
                  <input type="checkbox" value="${v}" data-group="${group.key}"> ${v}
                </label>`
                )
                .join("")}
            </div>
          </div>`;
        })
        .join("") +
      `
      <div class="filter-group open" data-group="rating">
        <button type="button" class="filter-group-toggle" aria-expanded="true">
          <h4>Minimum Rating</h4>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="filter-group-body">
          <label class="filter-option"><input type="radio" name="rating" value="0" checked> Any rating</label>
          <label class="filter-option"><input type="radio" name="rating" value="4.5"> 4.5+ stars</label>
          <label class="filter-option"><input type="radio" name="rating" value="4.0"> 4.0+ stars</label>
        </div>
      </div>
      <button class="filter-reset" id="filter-reset">Reset all filters</button>`;

    // Restore category from URL param as checked
    if (state.category.length) {
      const box = panel.querySelector(`input[data-group="category"][value="${state.category[0]}"]`);
      if (box) box.checked = true;
    }

    panel.querySelectorAll(".filter-group-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const group = toggle.closest(".filter-group");
        const nowOpen = !group.classList.contains("open");
        group.classList.toggle("open", nowOpen);
        toggle.setAttribute("aria-expanded", String(nowOpen));
      });
    });

    panel.addEventListener("change", (e) => {
      if (e.target.name === "rating") {
        state.minRating = Number(e.target.value);
      } else if (e.target.dataset.group) {
        const key = e.target.dataset.group;
        state[key] = [...panel.querySelectorAll(`input[data-group="${key}"]:checked`)].map((i) => i.value);
      }
      applyAndRender(tools);
    });

    document.getElementById("filter-reset").addEventListener("click", () => {
      panel.querySelectorAll("input[type=checkbox]").forEach((i) => (i.checked = false));
      panel.querySelector('input[name="rating"][value="0"]').checked = true;
      filterGroups.forEach((g) => (state[g.key] = []));
      state.minRating = 0;
      applyAndRender(tools);
    });
  }

  function wireSortSelect() {
    const select = document.getElementById("sort-select");
    select.addEventListener("change", () => {
      state.sort = select.value;
      window.AICompass.getTools().then(applyAndRender);
    });
  }

  function wireMobileFilterToggle() {
    const toggle = document.getElementById("mobile-filter-toggle");
    const panel = document.getElementById("filters-panel");
    const overlay = document.getElementById("filters-overlay");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      panel.classList.add("open");
      overlay.classList.add("open");
    });
    overlay.addEventListener("click", () => {
      panel.classList.remove("open");
      overlay.classList.remove("open");
    });
  }

  function applyAndRender(tools) {
    let results = tools.filter((t) => matchesAll(t));
    results = sortResults(results, state.sort);

    document.getElementById("results-count").textContent =
      `${results.length} tool${results.length === 1 ? "" : "s"} found`;

    renderActiveChips();

    if (results.length === 0) {
      grid.innerHTML = "";
      const emptyState = document.getElementById("empty-state");
      emptyState.classList.remove("hidden");
      emptyState.innerHTML = `
        <div class="tools-empty-state">
          <div class="glyph">🧭</div>
          <h3>No AI tools found.</h3>
          <p>Try changing your filters or search terms.</p>
          <button class="btn btn-outline" id="empty-state-reset">Clear all filters</button>
        </div>`;
      const resetBtn = document.getElementById("empty-state-reset");
      if (resetBtn) resetBtn.addEventListener("click", () => resetAllFilters(tools));
    } else {
      document.getElementById("empty-state").classList.add("hidden");
      grid.innerHTML = results.map(window.AICompass.renderToolCard).join("");
    }
  }

  // Renders one removable chip per active filter/search term above the
  // grid, plus a single "Clear all" action once more than one is active.
  function renderActiveChips() {
    const bar = document.getElementById("active-filters");
    if (!bar) return;

    const chips = [];
    if (state.query) chips.push({ label: `"${state.query}"`, clear: () => (state.query = "") });
    filterGroups.forEach((g) => {
      state[g.key].forEach((v) => {
        chips.push({
          label: v,
          clear: () => {
            state[g.key] = state[g.key].filter((x) => x !== v);
            const box = document.querySelector(`input[data-group="${g.key}"][value="${v}"]`);
            if (box) box.checked = false;
          },
        });
      });
    });
    if (state.minRating > 0) {
      chips.push({
        label: `${state.minRating}+ stars`,
        clear: () => {
          state.minRating = 0;
          const radio = document.querySelector('input[name="rating"][value="0"]');
          if (radio) radio.checked = true;
        },
      });
    }

    if (chips.length === 0) {
      bar.innerHTML = "";
      return;
    }

    bar.innerHTML =
      chips
        .map(
          (c, i) => `<span class="filter-chip" data-chip="${i}">${c.label} <button type="button" aria-label="Remove filter">&times;</button></span>`
        )
        .join("") + `<button type="button" class="filter-chip-clear" id="clear-all-chips">Clear all</button>`;

    bar.querySelectorAll(".filter-chip button").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        chips[i].clear();
        if (state.query) syncSearchInputs("");
        applyAndRender(currentTools);
      });
    });
    const clearAll = document.getElementById("clear-all-chips");
    if (clearAll) clearAll.addEventListener("click", () => resetAllFilters(currentTools));
  }

  function resetAllFilters(tools) {
    const panel = document.getElementById("filters-panel");
    panel.querySelectorAll("input[type=checkbox]").forEach((i) => (i.checked = false));
    const anyRating = panel.querySelector('input[name="rating"][value="0"]');
    if (anyRating) anyRating.checked = true;
    filterGroups.forEach((g) => (state[g.key] = []));
    state.minRating = 0;
    state.query = "";
    syncSearchInputs("");
    applyAndRender(tools);
  }

  function matchesAll(t) {
    if (state.query) {
      const q = state.query.toLowerCase();
      const inText =
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.developer.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.industry || "").toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        t.features.some((f) => f.toLowerCase().includes(q));
      if (!inText) return false;
    }
    if (state.category.length && !state.category.includes(t.category)) return false;
    if (state.developer.length && !state.developer.includes(t.developer)) return false;
    if (state.pricing.length && !state.pricing.includes(t.pricing)) return false;
    if (state.platform.length && !state.platform.some((p) => t.platforms.includes(p))) return false;
    if (state.skillLevel.length && !state.skillLevel.includes(t.skillLevel)) return false;
    if (state.industry.length && !state.industry.includes(t.industry)) return false;
    if (t.rating < state.minRating) return false;
    return true;
  }

  function sortResults(list, sort) {
    const copy = [...list];
    switch (sort) {
      case "az": return copy.sort((a, b) => a.name.localeCompare(b.name));
      case "za": return copy.sort((a, b) => b.name.localeCompare(a.name));
      case "rating-high": return copy.sort((a, b) => b.rating - a.rating);
      case "rating-low": return copy.sort((a, b) => a.rating - b.rating);
      case "free-first": return copy.sort((a, b) => (a.pricing === "Free" ? -1 : 1) - (b.pricing === "Free" ? -1 : 1));
      case "paid-first": return copy.sort((a, b) => (a.pricing === "Paid" ? -1 : 1) - (b.pricing === "Paid" ? -1 : 1));
      case "recent": return copy.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      default: return copy;
    }
  }
})();
