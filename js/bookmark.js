//  Handles saving/removing "bookmarked" tools using Local Storage,
//    and  for clicks on any button anywhere in the document.


window.AICompass = window.AICompass || {};

(function () {
  const STORAGE_KEY = "aicompass_bookmarks";

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      if (window.AICompass.toast) window.AICompass.toast("Couldn't save — storage may be full or disabled", "error");
    }
  }

  function has(id) {
    return getAll().includes(Number(id));
  }

  function toggle(id) {
    id = Number(id);
    let list = getAll();
    let added;
    if (list.includes(id)) {
      list = list.filter((x) => x !== id);
      added = false;
    } else {
      list.push(id);
      added = true;
    }
    save(list);
    return added;
  }

  function remove(id) {
    save(getAll().filter((x) => x !== Number(id)));
  }

  function clearAll() {
    save([]);
  }

  // Delegate clicks so this works for cards rendered after page load too.
  document.addEventListener("click", function (e) {
    const btn = e.target.closest('[data-action="bookmark"]');
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const added = toggle(id);
    btn.classList.toggle("active", added);
    btn.textContent = added ? "★ Saved" : "☆ Bookmark";
    if (window.AICompass.toast) {
      window.AICompass.toast(added ? "Added to bookmarks" : "Removed from bookmarks", added ? "success" : "error");
    }
    // If we're on the Bookmarks page itself, re-render the list live.
    if (window.AICompass.refreshBookmarksPage) {
      window.AICompass.refreshBookmarksPage();
    }
  });

  window.AICompass.Bookmarks = { getAll, has, toggle, remove, clearAll };

  // ---- Bookmarks PAGE rendering (only runs if #bookmarks-grid exists) ----
  const grid = document.getElementById("bookmarks-grid");
  if (!grid) return;

  function refreshBookmarksPage() {
    const ids = getAll();
    const emptyState = document.getElementById("bookmarks-empty");
    const countEl = document.getElementById("bookmarks-count");

    if (ids.length === 0) {
      grid.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      if (countEl) countEl.textContent = "0 saved tools";
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    window.AICompass.getTools().then((tools) => {
      const saved = ids.map((id) => tools.find((t) => t.id === id)).filter(Boolean);
      if (countEl) countEl.textContent = `${saved.length} saved tool${saved.length === 1 ? "" : "s"}`;
      grid.innerHTML = saved.map(window.AICompass.renderToolCard).join("");
    });
  }

  window.AICompass.refreshBookmarksPage = refreshBookmarksPage;

  document.addEventListener("DOMContentLoaded", refreshBookmarksPage);

  const clearBtn = document.getElementById("clear-bookmarks");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearAll();
      refreshBookmarksPage();
      if (window.AICompass.toast) window.AICompass.toast("All bookmarks cleared", "error");
    });
  }
})();
