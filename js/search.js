  // Live search + auto-suggestions. Matches on name, category,
  //  developer, tags, description, features, and industry. Works
  //  on any input marked with the [data-search-input] attribute,
  //  and shows a dropdown panel in the nearest [data-search-panel]
  //  element.
  //  Pressing Enter (or clicking "See all results") sends the
  //  query to tools.html?q=... where filter.js takes over.

(function () {
  function matchesQuery(tool, q) {
    q = q.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.developer.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      (tool.industry || "").toLowerCase().includes(q) ||
      tool.tags.some((t) => t.toLowerCase().includes(q)) ||
      tool.features.some((f) => f.toLowerCase().includes(q))
    );
  }

  function wireSearchBox(input) {
    const panel = input.parentElement.querySelector("[data-search-panel]");

    function goToResults() {
      const q = input.value.trim();
      window.location.href = "tools.html" + (q ? `?q=${encodeURIComponent(q)}` : "");
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") goToResults();
      if (e.key === "Escape" && panel) panel.classList.remove("open");
    });

    if (!panel) return;

    input.addEventListener("input", () => {
      const q = input.value.trim();
      if (q.length < 2) {
        panel.classList.remove("open");
        panel.innerHTML = "";
        return;
      }
      window.AICompass.getTools().then((tools) => {
        const matches = tools.filter((t) => matchesQuery(t, q)).slice(0, 6);
        if (matches.length === 0) {
          panel.innerHTML = `<div class="suggestion-empty">No tools found for "${q}"</div>`;
        } else {
          panel.innerHTML = matches
            .map(
              (t) => `
              <a class="suggestion-item" href="details.html?id=${t.id}">
                <div class="tool-logo" style="width:30px;height:30px;font-size:11px;background:hsl(${t.logoHue} 65% 45%)">${t.logoInitials}</div>
                <div>
                  <div style="font-size:13.5px;font-weight:600;">${t.name}</div>
                  <div style="font-size:11.5px;color:var(--ink-soft);">${t.category} · ${t.developer}</div>
                </div>
              </a>`
            )
            .join("");
        }
        panel.classList.add("open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!input.parentElement.contains(e.target)) panel.classList.remove("open");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-search-input]").forEach(wireSearchBox);

    // Hero search button (if present) also routes to tools.html
    const heroBtn = document.querySelector("[data-hero-search-btn]");
    if (heroBtn) {
      heroBtn.addEventListener("click", () => {
        const input = heroBtn.parentElement.querySelector("input");
        window.location.href = "tools.html" + (input && input.value.trim() ? `?q=${encodeURIComponent(input.value.trim())}` : "");
      });
    }

    // Popular search tag chips
    document.querySelectorAll("[data-search-tag]").forEach((chip) => {
      chip.addEventListener("click", () => {
        window.location.href = `tools.html?q=${encodeURIComponent(chip.getAttribute("data-search-tag"))}`;
      });
    });
  });
})();
