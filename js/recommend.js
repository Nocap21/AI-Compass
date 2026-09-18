// Find the right AI tool for me" — a 4-question wizard that
// scores every tool in data/tools.json against the user's
// answers and shows the top 5 matches with a match percentage.

(function () {
  const root = document.getElementById("recommend-root");
  if (!root) return;

  // Maps each "need" tile to the tools.json categories it should match.
  const NEED_TO_CATEGORIES = {
    writing: ["Writing", "Marketing"],
    coding: ["Coding", "Data Science"],
    design: ["Design", "Image Generation"],
    "video-audio": ["Video Generation", "Audio"],
    research: ["Research", "Education"],
    business: ["Business", "Finance", "Productivity"],
    chat: ["AI Chatbots"],
  };

  const steps = [...root.querySelectorAll(".recommend-step")];
  const progressSteps = [...document.querySelectorAll("#recommend-progress .step")];
  const backBtn = document.getElementById("recommend-back");
  const nextBtn = document.getElementById("recommend-next");
  const resultsWrap = document.getElementById("recommend-results");
  const matchList = document.getElementById("match-list");
  const restartBtn = document.getElementById("recommend-restart");

  const answers = { need: null, skillLevel: null, industry: null, pricing: null };
  let current = 0;

  // Step 2's options are built from the real, current industry values in
  // the dataset instead of a hardcoded list, so it never drifts out of
  // sync with tools.json.
  window.AICompass.getTools().then((tools) => {
    const industries = [...new Set(tools.map((t) => t.industry))].sort();
    const el = document.getElementById("industry-options");
    el.innerHTML = industries
      .map((i) => `<button type="button" class="option-tile" data-value="${i}">${i}</button>`)
      .join("");
    wireOptionTiles(el);
  });

  function wireOptionTiles(scope) {
    scope.querySelectorAll(".option-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        const group = tile.closest("[data-question]");
        const question = group.dataset.question;
        group.querySelectorAll(".option-tile").forEach((t) => t.classList.remove("selected"));
        tile.classList.add("selected");
        answers[question] = tile.dataset.value;
        updateNextState();
      });
    });
  }

  wireOptionTiles(root);

  function updateNextState() {
    const questionKey = steps[current].querySelector("[data-question]").dataset.question;
    nextBtn.disabled = !answers[questionKey];
  }

  function goToStep(i) {
    steps[current].classList.remove("active");
    progressSteps[current].classList.remove("active");
    current = i;
    steps[current].classList.add("active");
    progressSteps[current].classList.add("active");
    for (let s = 0; s < current; s++) progressSteps[s].classList.add("done");
    backBtn.disabled = current === 0;
    nextBtn.textContent = current === steps.length - 1 ? "See my matches" : "Next";
    updateNextState();
  }

  backBtn.addEventListener("click", () => {
    if (current > 0) goToStep(current - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (current < steps.length - 1) {
      goToStep(current + 1);
    } else {
      showResults();
    }
  });

  restartBtn.addEventListener("click", () => {
    Object.keys(answers).forEach((k) => (answers[k] = null));
    root.querySelectorAll(".option-tile").forEach((t) => t.classList.remove("selected"));
    progressSteps.forEach((s) => s.classList.remove("done", "active"));
    resultsWrap.classList.add("hidden");
    root.classList.remove("hidden");
    goToStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function scoreTool(tool) {
    let score = 0;

    // Need → category, 40 pts for a direct match.
    const wantedCategories = NEED_TO_CATEGORIES[answers.need] || [];
    if (wantedCategories.includes(tool.category)) score += 40;

    // Skill level, 20 pts exact, 8 pts adjacent (Beginner↔Intermediate,
    // Intermediate↔Advanced), 0 for the opposite extreme.
    const levels = ["Beginner", "Intermediate", "Advanced"];
    const dist = Math.abs(levels.indexOf(tool.skillLevel) - levels.indexOf(answers.skillLevel));
    if (dist === 0) score += 20;
    else if (dist === 1) score += 8;

    // Industry, 20 pts exact match, 12 pts if either side is "Everyone".
    if (tool.industry === answers.industry) score += 20;
    else if (tool.industry === "Everyone" || answers.industry === "Everyone") score += 12;

    // Budget, 20 pts exact, "no preference" always counts as a full match.
    if (answers.pricing === "any" || tool.pricing === answers.pricing) score += 20;
    else if (answers.pricing === "Free" && tool.pricing === "Freemium") score += 10;

    // Small tie-breaker so, among equally relevant tools, the better-rated
    // one edges ahead (max +10 of the 100-point scale below).
    score += tool.rating * 2;

    return score;
  }

  function showResults() {
    window.AICompass.getTools().then((tools) => {
      const MAX_SCORE = 110; // 40 + 20 + 20 + 20 + (5 * 2 rating ceiling)
      const scored = tools
        .map((t) => ({ tool: t, score: scoreTool(t) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      matchList.innerHTML = scored
        .map(({ tool, score }, i) => {
          const pct = Math.min(100, Math.round((score / MAX_SCORE) * 100));
          return `
          <article class="match-card">
            <div class="match-rank">#${i + 1}</div>
            <div class="tool-logo" style="background:hsl(${tool.logoHue} 65% 45%)">${tool.logoInitials}</div>
            <div class="match-info">
              <h3><a href="details.html?id=${tool.id}">${tool.name}</a></h3>
              <div class="tool-dev">by ${tool.developer}</div>
              <p class="tool-desc">${tool.description}</p>
              <div class="tool-meta-row">
                <span class="rating">★ ${tool.rating.toFixed(1)}</span>
                <span>·</span>
                <span>${tool.category}</span>
                <span>·</span>
                <span>${tool.pricing}</span>
              </div>
            </div>
            <div class="match-score">
              <div class="match-score-ring" style="--pct:${pct}">${pct}%</div>
              <span>match</span>
            </div>
          </article>`;
        })
        .join("");

      root.classList.add("hidden");
      resultsWrap.classList.remove("hidden");
      window.scrollTo({ top: resultsWrap.offsetTop - 100, behavior: "smooth" });
    });
  }

  goToStep(0);
})();
