export function setActiveNav(routePath) {
  document.querySelectorAll(".nav-item").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === routePath);
  });
}

export function setClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  el.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Cannot fetch ${path} (${res.status})`);
  return await res.json();
}

export function escapeHTML(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderNotFound(message) {
  return `
    <div class="card" style="box-shadow:none;">
      <div class="card-inner">
        <h2 class="card-title">Oups</h2>
        <p class="card-subtitle">${escapeHTML(message)}</p>
      </div>
    </div>
  `;
}
