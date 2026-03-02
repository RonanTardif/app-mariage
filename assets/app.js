import { routes, getRouteFromHash } from "./router.js";
import { setActiveNav, setClock } from "./ui.js";
import { initPage } from "./inits.js";

async function loadPage(routePath) {
  const view = document.getElementById("view");
  const route = routes[routePath];
  document.title = `Mariage — ${route.title}`;

  setActiveNav(routePath);

  const html = await fetch(route.file, { cache: "no-store" }).then((r) => r.text());
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
    view.innerHTML = `
      <div class="card"><div class="card-inner">
        <h2 class="card-title">Erreur</h2>
        <p class="card-subtitle">Impossible de charger la page. Ouvre la console (F12) → Console.</p>
      </div></div>
    `;
  });
}

window.addEventListener("hashchange", onRouteChange);

tickClock();
onRouteChange();
