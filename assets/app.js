/* ==========================================================
   Shared behaviour: nav toggle + rendering helpers used across
   pages, plus the code runner (uses the free public Judge0 CE
   API to actually compile/run C, Java, Python and Bash in the
   browser — no backend of your own required).
   ========================================================== */

function initNav(current) {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
  }
  if (current) {
    document.querySelectorAll("nav.links a[data-nav]").forEach(a => {
      if (a.dataset.nav === current) a.classList.add("current");
    });
  }
}

function difficultyBadge(d) {
  return `<span class="badge badge-${d}">${d}</span>`;
}

function countByLang(lang) {
  return EXERCISES.filter(e => e.lang === lang).length;
}

/* ---------- home page ---------- */
function renderLanguageCards(container) {
  container.innerHTML = Object.keys(LANGUAGES).map(key => {
    const l = LANGUAGES[key];
    return `
      <a class="lang-card"
