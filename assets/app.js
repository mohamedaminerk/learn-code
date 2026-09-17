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
async function renderLanguagePage() {
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

  const completed = await getCompletedSet();

  const list = document.getElementById("exerciseList");
  const items = EXERCISES.filter(e => e.lang === lang);
  list.innerHTML = items.map(ex => `
    <a class="exercise-row" href="exercise.html?id=${ex.id}">
      <div class="ex-left">
        ${completed.has(ex.id) ? '<span class="badge" style="background:rgba(93,169,122,0.18);color:#2f6b47;">&#10003; done</span>' : ""}
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
   Code runner — talks to the free public Judge0 CE API.
   Docs: https://ce.judge0.com
   (Previously used Piston, but its public API was shut down
   on Feb 15, 2026 — Judge0 CE is its free, no-signup-required
   replacement.) This is a shared service: great for a learning
   site like this, but it is rate-limited and can be slow or
   briefly unavailable. For heavier traffic, self-host Judge0
   or swap in another execution API — everything below is
   isolated to this one section.
   ========================================================== */
const JUDGE0_BASE = "https://ce.judge0.com";
let _languagesCache = null;

/* Matches a Judge0 language name to our internal language keys.
   Judge0 lists many versions of each language (e.g. several
   "Python (3.x.x)" entries) — these patterns pick a sane one
   while avoiding false matches like "JavaScript" matching "java". */
const LANGUAGE_MATCHERS = {
  c: n => /^c \(/i.test(n),
  java: n => /^java \(/i.test(n),
  python: n => /^python \(3/i.test(n),
  linux: n => /^bash \(/i.test(n)
};

async function getLanguageId(lang) {
  if (!_languagesCache) {
    const res = await fetch(`${JUDGE0_BASE}/languages/`);
    if (!res.ok) throw new Error("Could not reach the code runner service.");
    _languagesCache = await res.json();
  }
  const match = _languagesCache.find(l => LANGUAGE_MATCHERS[lang] && LANGUAGE_MATCHERS[lang](l.name));
  if (!match) throw new Error(`No runtime available for ${lang}.`);
  return match.id;
}

/* Judge0 submissions run a single source file, so extra files
   (like notes.txt or log.txt used by a couple of exercises) are
   written to disk by a short preamble prepended to the source,
   rather than sent as separate files. */
function withExtraFiles(lang, source, extraFiles) {
  if (!extraFiles || !extraFiles.length) return source;

  if (lang === "python") {
    const preamble = extraFiles
      .map(f => `with open(${JSON.stringify(f.name)}, "w") as _f:\n    _f.write(${JSON.stringify(f.content)})\n`)
      .join("\n");
    return preamble + "\n" + source;
  }

  if (lang === "linux") {
    const preamble = extraFiles
      .map(f => `cat > ${f.name} << 'FILEEOF'\n${f.content}\nFILEEOF\n`)
      .join("\n");
    return preamble + "\n" + source;
  }

  return source;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Runs `source` for the given language via Judge0 CE and returns
 * { stdout, stderr, ok }.
 * extraFiles: [{name, content}] made available to the program.
 *
 * Note: the official ce.judge0.com instance does not support the
 * `wait=true` instant-result option, so this submits the code and
 * then polls for the result instead.
 */
async function runCode(lang, source, extraFiles = []) {
  const languageId = await getLanguageId(lang);
  const fullSource = withExtraFiles(lang, source, extraFiles);

  const submitRes = await fetch(`${JUDGE0_BASE}/submissions/?base64_encoded=false`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language_id: languageId,
      source_code: fullSource,
      stdin: ""
    })
  });

  if (!submitRes.ok) throw new Error("The code runner service returned an error.");
  const { token } = await submitRes.json();
  if (!token) throw new Error("The code runner service didn't return a submission token.");

  let data = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    await sleep(600);
    const getRes = await fetch(`${JUDGE0_BASE}/submissions/${token}?base64_encoded=false`);
    if (!getRes.ok) throw new Error("The code runner service returned an error while checking results.");
    data = await getRes.json();
    // status.id 1 = In Queue, 2 = Processing — keep polling until it's past those.
    if (data.status && data.status.id > 2) break;
  }

  if (!data || !data.status || data.status.id <= 2) {
    throw new Error("The code runner is taking longer than expected. Try again in a moment.");
  }

  const stdout = data.stdout || "";
  const stderr = data.compile_output || data.stderr ||
    (data.status.id !== 3 ? (data.message || data.status.description) : "") || "";
  const ok = data.status.id === 3; // 3 = "Accepted"

  return { stdout, stderr, ok };
}

