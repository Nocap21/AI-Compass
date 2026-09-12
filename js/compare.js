/* =========================================================
   compare.js
   Two responsibilities:
   1) A tiny shared "selection" store so a Compare button on any
      card can queue a tool for comparison (max 2 at a time).
   2) The actual Compare page logic: two dropdowns + a table that
      lines up every spec side by side.
   ========================================================= */

window.AICompass = window.AICompass || {};

(function () {
  const STORAGE_KEY = "aicompass_compare_selection";

  function getSelection() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveSelection(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      if (window.AICompass.toast) window.AICompass.toast("Couldn't save — storage may be full or disabled", "error");
    }
  }

  function has(id) {
    return getSelection().includes(Number(id));
  }

  function add(id) {
    id = Number(id);
    let list = getSelection();
    if (list.includes(id)) {
      list = list.filter((x) => x !== id);
    } else {
      list.push(id);
      if (list.length > 2) list.shift(); // keep only the 2 most recent picks
    }
    saveSelection(list);
    return list;
  }

  window.AICompass.Compare = { getSelection, saveSelection, has, add };

  // Delegate clicks on any "Compare" button, on any page, so cards can
  // queue tools before the user ever visits the Compare page.
  document.addEventListener("click", function (e) {
    const btn = e.target.closest('[data-action="compare"]');
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const list = add(id);
    const isIn = list.includes(Number(id));
    btn.classList.toggle("active", isIn);
    btn.textContent = isIn ? "✓ Comparing" : "⇄ Compare";
    if (window.AICompass.toast) {
      if (list.length === 2) {
        window.AICompass.toast("2 tools queued — open Compare to view", "success");
      } else {
        window.AICompass.toast(isIn ? "Added to comparison" : "Removed from comparison", isIn ? "success" : "error");
      }
    }
  });

  // ---- Compare PAGE logic (only runs if #compare-root exists) ----

  const root = document.getElementById("compare-root");
  if (!root) return;

  const selectA = document.getElementById("compare-select-a");
  const selectB = document.getElementById("compare-select-b");
  const tableWrap = document.getElementById("compare-table-wrap");

  const params = new URLSearchParams(window.location.search);
  const queued = getSelection();

  window.AICompass.getTools().then((tools) => {
    [selectA, selectB].forEach((sel) => {
      sel.innerHTML =
        '<option value="">Choose a tool…</option>' +
        tools.map((t) => `<option value="${t.id}">${t.name}</option>`).join("");
    });

    // Prefill from URL params (?a=ID&b=ID) or from the queued selection.
    const initialA = params.get("a") || queued[0] || "";
    const initialB = params.get("b") || queued[1] || "";
    if (initialA) selectA.value = initialA;
    if (initialB) selectB.value = initialB;

    renderComparison(tools);

    selectA.addEventListener("change", () => renderComparison(tools));
    selectB.addEventListener("change", () => renderComparison(tools));
  });

  function renderComparison(tools) {
    const a = tools.find((t) => t.id === Number(selectA.value));
    const b = tools.find((t) => t.id === Number(selectB.value));

    if (!a || !b) {
      tableWrap.innerHTML = `
        <div class="compare-empty">
          <p class="bearing">AWAITING BEARING</p>
          <p>Pick two tools above to see how they line up.</p>
        </div>`;
      return;
    }

    const rows = [
      ["Rating", `★ ${a.rating.toFixed(1)}`, `★ ${b.rating.toFixed(1)}`, a.rating >= b.rating],
      ["Category", a.category, b.category, null],
      ["Developer", a.developer, b.developer, null],
      ["Price", a.pricing, b.pricing, a.pricing === "Free" && b.pricing !== "Free"],
      // Platforms and Features are lists to read, not scores to win —
      // a longer list isn't objectively "better", so no winner highlight.
      ["Platforms", a.platforms.join(", "), b.platforms.join(", "), null],
      ["Features", "<ul>" + a.features.map((f) => `<li>${f}</li>`).join("") + "</ul>",
        "<ul>" + b.features.map((f) => `<li>${f}</li>`).join("") + "</ul>", null],
      ["Best For", a.industry, b.industry, null],
      ["Pros", "<ul>" + a.pros.map((f) => `<li>${f}</li>`).join("") + "</ul>",
        "<ul>" + b.pros.map((f) => `<li>${f}</li>`).join("") + "</ul>", null],
      ["Cons", "<ul>" + a.cons.map((f) => `<li>${f}</li>`).join("") + "</ul>",
        "<ul>" + b.cons.map((f) => `<li>${f}</li>`).join("") + "</ul>", null],
    ];

    tableWrap.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>Spec</th>
            <th><div class="compare-col-head"><div class="tool-logo" style="width:32px;height:32px;font-size:12px;background:hsl(${a.logoHue} 65% 45%)">${a.logoInitials}</div>${a.name}</div></th>
            <th><div class="compare-col-head"><div class="tool-logo" style="width:32px;height:32px;font-size:12px;background:hsl(${b.logoHue} 65% 45%)">${b.logoInitials}</div>${b.name}</div></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              <th>${r[0]}</th>
              <td class="${r[3] === true ? "compare-winner" : ""}">${r[1]}</td>
              <td class="${r[3] === false ? "compare-winner" : ""}">${r[2]}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }
})();
