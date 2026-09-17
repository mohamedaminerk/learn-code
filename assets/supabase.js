/* ==========================================================
   Accounts + saved progress, backed by Supabase.
   Supabase gives us a real Postgres database, user accounts,
   and login — all callable straight from this static site,
   with no server of our own to run.

   SETUP (one-time):
   1. Create a free project at https://supabase.com
   2. Project Settings -> API: copy the "Project URL" and the
      "anon public" key, and paste them below.
   3. In the Supabase SQL Editor, run the SQL from
      assets/schema.sql (in this same folder) once.
   That's it — everything below then works.
   ========================================================== */

const SUPABASE_URL = "https://hjngzdjzjraadqkdlldq.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhqbmd6ZGp6anJhYWRxa2RsbGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzA1MzQsImV4cCI6MjEwNTIwNjUzNH0.1sDj880DGjCAux_imW1RT9ZEYB7IKXtTv6R59THLxLo
";

const supabaseReady = SUPABASE_URL.startsWith("http");
const supabase = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

if (!supabaseReady) {
  console.warn("Supabase isn't configured yet — accounts and saved progress are disabled until assets/supabase.js has real project credentials.");
}

/* ---------- auth ---------- */

async function getCurrentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data ? data.user : null;
}

async function signUp(email, password) {
  if (!supabase) throw new Error("Accounts aren't set up yet.");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  if (!supabase) throw new Error("Accounts aren't set up yet.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  location.reload();
}

/* ---------- progress ---------- */

/** Marks one exercise as completed for the signed-in user. Silently
 *  no-ops if nobody is signed in or Supabase isn't configured. */
async function markCompleted(exerciseId) {
  if (!supabase) return;
  const user = await getCurrentUser();
  if (!user) return;
  await supabase.from("progress").upsert({
    user_id: user.id,
    exercise_id: exerciseId,
    completed: true,
    completed_at: new Date().toISOString()
  });
}

/** Returns a Set of exercise ids the signed-in user has completed.
 *  Returns an empty Set if nobody is signed in. */
async function getCompletedSet() {
  if (!supabase) return new Set();
  const user = await getCurrentUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from("progress")
    .select("exercise_id")
    .eq("user_id", user.id);
  if (error || !data) return new Set();
  return new Set(data.map(row => row.exercise_id));
}

/* ---------- shared nav auth widget ----------
   Call this on every page after initNav(). It replaces the
   "Log in" placeholder link (id="authLink") with either a
   Log in link (signed out) or the user's email + Log out
   (signed in). */
async function initAuthNav() {
  const slot = document.getElementById("authLink");
  if (!slot) return;

  if (!supabaseReady) {
    slot.textContent = "Accounts coming soon";
    slot.style.opacity = "0.5";
    return;
  }

  const user = await getCurrentUser();
  if (user) {
    slot.innerHTML = "";
    const label = document.createElement("span");
    label.textContent = user.email;
    label.style.marginRight = "12px";
    const btn = document.createElement("button");
    btn.textContent = "Log out";
    btn.className = "filter-pill";
    btn.style.padding = "4px 12px";
    btn.addEventListener("click", signOut);
    slot.appendChild(label);
    slot.appendChild(btn);
  } else {
    slot.textContent = "Log in";
    slot.setAttribute("href", "login.html");
  }
}
