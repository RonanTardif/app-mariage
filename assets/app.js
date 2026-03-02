import { routes, getRouteFromHash } from "./router.js";
import { setActiveNav, setClock } from "./ui.js";

async function loadPage(routePath) {
  const view = document.getElementById("view");
  const route = routes[routePath];
  document.title = `Mariage — ${route.title}`;

  setActiveNav(routePath);

  const html = await fetch(route.file, { cache: "no-store" }).then((r) => r.text());
  view.innerHTML = html;

  // Initialiser la page si elle expose window.__initPage
  if (typeof window.__initPage === "function") {
    await window.__initPage();
  }
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
    view.innerHTML = `
      <div class="card"><div class="card-inner">
        <h2 class="card-title">Erreur</h2>
        <p class="card-subtitle">Impossible de charger la page. Recharge ou reviens à l’accueil.</p>
      </div></div>
    `;
  });
}

window.addEventListener("hashchange", onRouteChange);

tickClock();
onRouteChange();
