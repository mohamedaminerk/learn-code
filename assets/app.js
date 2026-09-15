/* ==========================================================
   Shared behaviour: nav toggle + rendering helpers used across
   pages, plus the code runner (uses the free public Piston API
   at emkc.org to actually compile/run C, Java and Python in
   the browser — no backend of your own required).
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
      <a class="lang-card" data-lang="${key}" href="language.html?lang=${key}">
        <p class="lang-name">${l.name}</p>
        <p class="lang-desc">${l.desc}</p>
        <div class="lang-stats">
          <div><b>${countByLang(key)}</b>exercises</div>
          <div><b>${COURSES.find(c => c.lang === key).modules.length}</b>modules</div>
        </div>
        <span class="lang-btn">View ${l.name} exercises</span>
      </a>`;
  }).join("");
}

/* ---------- language page ---------- */
function renderLanguagePage() {
  const params = new URLSearchParams(location.search);
  const lang = params.get("lang") || "c";
  const info = LANGUAGES[lang] || LANGUAGES.c;

  document.getElementById("langTag").textContent = info.name;
  document.getElementById("langTitle").textContent = info.name + " exercises";
  document.getElementById("langDesc").textContent = info.desc;
  document.title = info.name + " exercises — learn.code";

  const filterBar = document.getElementById("filterBar");
  filterBar.innerHTML = Object.keys(LANGUAGES).map(key => {
    const l = LANGUAGES[key];
    const active = key === lang ? "active" : "";
    return `<a class="filter-pill ${active}" href="language.html?lang=${key}">${l.name}</a>`;
  }).join("");

  const list = document.getElementById("exerciseList");
  const items = EXERCISES.filter(e => e.lang === lang);
  list.innerHTML = items.map(ex => `
    <a class="exercise-row" href="exercise.html?id=${ex.id}">
      <div class="ex-left">
        <span class="ex-title">${ex.title}</span>
        <span class="badge badge-lang">${info.name}</span>
        ${difficultyBadge(ex.difficulty)}
      </div>
      <span class="ex-arrow">open →</span>
    </a>
  `).join("");

  const courseLink = document.getElementById("courseLink");
  if (courseLink) courseLink.href = "courses.html#" + lang;
}

/* ---------- courses page ---------- */
function renderCourses(container) {
  container.innerHTML = COURSES.map(c => `
    <div class="course-card" id="${c.lang}">
      <span class="course-lang">${LANGUAGES[c.lang].name}</span>
      <p class="course-title">${c.title}</p>
      <ul class="module-list">
        ${c.modules.map((m, i) => `<li><span class="module-num">${String(i+1).padStart(2,"0")}</span>${m}</li>`).join("")}
      </ul>
    </div>
  `).join("");
}

/* ---------- work page ---------- */
function renderWork(container) {
  container.innerHTML = WORK.map(w => `
    <div class="work-card">
      <div class="work-top">
        <p class="work-title">${w.title}</p>
        <div class="work-tags">${w.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
      <p class="work-desc">${w.desc}</p>
      <a href="${w.url}" class="work-link">View source</a>
    </div>
  `).join("");
}

/* ==========================================================
   Code runner — talks to the public Piston API.
   Docs: https://github.com/engineer-man/piston
   This is a free shared service: it's great for a learning
   site like this, but it is rate-limited and can be slow or
   briefly unavailable. For heavier traffic, self-host Piston
   or swap in another execution API — everything below is
   isolated to this one function.
   ========================================================== */
const PISTON_BASE = "https://emkc.org/api/v2/piston";
const PISTON_LANG = { c: "c", java: "java", python: "python3", linux: "bash" };
let _runtimesCache = null;

async function getRuntimeVersion(lang) {
  if (!_runtimesCache) {
    const res = await fetch(`${PISTON_BASE}/runtimes`);
    if (!res.ok) throw new Error("Could not reach the code runner service.");
    _runtimesCache = await res.json();
  }
  const key = PISTON_LANG[lang];
  const match = _runtimesCache.find(r => r.language === key || (r.aliases || []).includes(key));
  if (!match) throw new Error(`No runtime available for ${lang}.`);
  return match.version;
}

function mainFileName(lang) {
  if (lang === "c") return "main.c";
  if (lang === "java") return "Main.java";
  if (lang === "linux") return "main.sh";
  return "main.py";
}

/**
 * Runs `source` for the given language via Piston and returns
 * { stdout, stderr, combined, ok }.
 * extraFiles: [{name, content}] written alongside the main file.
 */
async function runCode(lang, source, extraFiles = []) {
  const version = await getRuntimeVersion(lang);
  const files = [{ name: mainFileName(lang), content: source }, ...extraFiles];

  const res = await fetch(`${PISTON_BASE}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: PISTON_LANG[lang],
      version,
      files
    })
  });

  if (!res.ok) throw new Error("The code runner service returned an error.");
  const data = await res.json();

  const compileErr = data.compile && data.compile.stderr ? data.compile.stderr : "";
  const stdout = (data.run && data.run.stdout) || "";
  const stderr = compileErr || (data.run && data.run.stderr) || "";
  const ok = !stderr && data.run && data.run.code === 0;

  return { stdout, stderr, ok };
}
