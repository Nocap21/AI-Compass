/* =========================================================
   recentlyViewed.js
   Every time a Details page loads, the tool's id gets pushed to
   the front of a small "recently viewed" list in Local Storage.
   The Home page reads this list to render its "Recently Added"*
   -style rail of tools the user has actually looked at.
   ========================================================= */

window.AICompass = window.AICompass || {};

(function () {
  const STORAGE_KEY = "aicompass_recently_viewed";
  const MAX_ITEMS = 8;

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function record(id) {
    id = Number(id);
    let list = getAll().filter((x) => x !== id);
    list.unshift(id);
    list = list.slice(0, MAX_ITEMS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* storage full or disabled — recently-viewed is a nice-to-have, fail silently */
    }
  }

  window.AICompass.RecentlyViewed = { getAll, record };
})();
