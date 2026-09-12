/* =========================================================
   loader.js
   Fades out the full-page "page-loader" overlay once the DOM is
   ready (gives every page a consistent, on-brand loading moment
   instead of a blank flash). Also exposes a tiny toast() helper
   used by bookmark.js / compare.js / contact.js.
   ========================================================= */

window.AICompass = window.AICompass || {};

(function () {
  window.addEventListener("load", function () {
    const loader = document.getElementById("page-loader");
    if (!loader) return;
    loader.classList.add("hide");
  });

  function toast(message, type) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    const el = document.createElement("div");
    el.className = `toast ${type || "success"}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s ease";
      setTimeout(() => el.remove(), 300);
    }, 2600);
  }

  window.AICompass.toast = toast;
})();
