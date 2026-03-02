import { routes, getRouteFromHash } from "./router.js";
import { setActiveNav, setClock } from "./ui.js";

function runInlineScripts(container) {
  // Important: les <script> dans innerHTML ne s'exécutent pas.
  // On les recrée pour forcer l'exécution.
  const scripts = Array.from(container.querySelectorAll("script"));
  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script");

    // copie des attributs
    for (const { name, value } of Array.from(oldScript.attributes)) {
      newScript.setAttribute(name, value);
    }

    // copie du contenu
    newScript.textContent = oldScript.textContent;

    // remplace l'ancien par le nouveau (ce qui exécute)
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

async function loadPage(routePath) {
  const view = document.getElementById("view");
  const route = routes[routePath];
  document.title = `Mariage — ${route.title}`;

  setActiveNav(routePath);

  // 1) injecter le HTML
  const html = await fetch(route.file, { cache: "no-store" }).then((r) => r.text());
  view.innerHTML = html;

  // 2) exécuter les scripts présents dans la page injectée
  runInlineScripts(view);

  // 3) laisser le temps au script de définir __initPage, puis init
  await Promise.resolve();
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
