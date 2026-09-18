// Applies the saved theme as early as possible

window.AICompass = window.AICompass || {};

(function () {
  const STORAGE_KEY = "aicompass_theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll('[data-action="theme-toggle"]').forEach((btn) => {
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  // Apply immediately (before DOMContentLoaded) to avoid a light-mode flash.
  applyTheme(getTheme());

  document.addEventListener("click", function (e) {
    const btn = e.target.closest('[data-action="theme-toggle"]');
    if (!btn) return;
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });

  window.AICompass.applyTheme = applyTheme;
})();
