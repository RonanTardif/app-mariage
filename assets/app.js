import { routes, getRouteFromHash } from "./router.js";
import { setActiveNav, setClock } from "./ui.js";
import { initPage } from "./inits.js";
import { warmupAppCaches } from "./data-cache.js";

async function loadPage(routePath) {
  const view = document.getElementById("view");
  const route = routes[routePath];
  document.title = `Mariage — ${route.title}`;

  setActiveNav(routePath);

  const htmlRes = await fetch(route.file, { cache: "no-store" });
  if (!htmlRes.ok) {
    throw new Error(`FETCH_FAIL: ${route.file} (HTTP ${htmlRes.status})`);
  }
  const html = await htmlRes.text();
  view.innerHTML = html;

  await initPage(routePath);
}

function tickClock() {
  setClock();
  setInterval(setClock, 1000 * 10);
}

function onRouteChange() {
  const routePath = getRouteFromHash();
  loadPage(routePath).catch((e) => {
    console.error(e);
    const view = document.getElementById("view");
    const msg = String(e?.message || e);
    view.innerHTML = `
      <div class="card"><div class="card-inner">
        <h2 class="card-title">Erreur</h2>
        <p class="card-subtitle">Détail : <b>${msg.replaceAll("<","&lt;")}</b></p>
        <p class="small" style="margin-top:10px;">
          Astuce: vérifie que le fichier existe bien dans le repo (même orthographe / même MAJ/min).
        </p>
      </div></div>
    `;
  });
}

window.addEventListener("hashchange", onRouteChange);

tickClock();
onRouteChange();
warmupAppCaches();
