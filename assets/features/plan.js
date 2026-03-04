import { fetchJSON, escapeHTML } from "../ui.js";

const DEFAULT_MAP_SVG = "./assets/plan-domaine.svg";
const PLACES_PATH = "./data/places.json";

const SVG_ZONE_TO_PLACE_ID = {
  jardin_francais: "jardin",
  vin_honneur: "vin",
  eglise: "chapelle",
};

const SVG_ZONE_LABELS = {
  gites: "Gîtes",
  chateau: "Château",
  jardin_francais: "Jardin français",
  vin_honneur: "Vin d'honneur",
  eglise: "Église",
  piscine: "Piscine",
};

const planWarmupState = {
  placesPromise: null,
  mapSvgPromiseByPath: new Map(),
  svgMarkupByPath: new Map(),
};

function loadPlacesData() {
  if (!planWarmupState.placesPromise) {
    planWarmupState.placesPromise = fetchJSON(PLACES_PATH).catch((error) => {
      planWarmupState.placesPromise = null;
      throw error;
    });
  }

  return planWarmupState.placesPromise;
}

function loadMapSVG(svgPath) {
  const existingPromise = planWarmupState.mapSvgPromiseByPath.get(svgPath);
  if (existingPromise) return existingPromise;

  const svgPromise = fetch(svgPath)
    .then((response) => {
      if (!response.ok) throw new Error(`Échec du chargement du plan SVG (${response.status})`);
      return response.text();
    })
    .catch((error) => {
      planWarmupState.mapSvgPromiseByPath.delete(svgPath);
      throw error;
    });
  planWarmupState.mapSvgPromiseByPath.set(svgPath, svgPromise);

  return svgPromise;
}

function renderSVG(svgPath, svgMarkup) {
  const cacheKey = `${svgPath}::${svgMarkup.length}`;
  const cachedMarkup = planWarmupState.svgMarkupByPath.get(cacheKey);
  if (cachedMarkup) return cachedMarkup;

  const markup = `
    <div class="map-svg-root" role="img" aria-label="Plan interactif du domaine">
      ${svgMarkup}
    </div>
  `;

  planWarmupState.svgMarkupByPath.set(cacheKey, markup);
  return markup;
}

function renderDetail(place) {
  if (!place) return "";

  const links = place.links?.length
    ? `<div class="map-links">${place.links
        .map((l) => `<a class="badge" href="${escapeHTML(l.href)}">${escapeHTML(l.label)}</a>`)
        .join("")}</div>`
    : "";

  return `
    <p class="list-title">${escapeHTML(place.title)}</p>
    <p class="list-text">${escapeHTML(place.description)}</p>
    ${links}
  `;
}

function getPlaceIdFromZoneId(zoneId, byId) {
  if (!zoneId) return "";
  if (byId.has(zoneId)) return zoneId;
  return SVG_ZONE_TO_PLACE_ID[zoneId] || "";
}

export function warmupPlanAssets() {
  loadMapSVG(DEFAULT_MAP_SVG).catch(() => null);
  return loadPlacesData();
}

export async function initPlan() {
  const places = await loadPlacesData();
  const byId = new Map(places.map((p) => [p.id, p]));

  const mapContainer = document.getElementById("domainMap");
  const detailContainer = document.getElementById("placeDetail");
  const shortcutsContainer = document.getElementById("placeShortcuts");
  if (!mapContainer || !detailContainer || !shortcutsContainer) return;

  const mapSvgPath = mapContainer.dataset.mapSvg || DEFAULT_MAP_SVG;

  let svgMarkup = "";
  try {
    svgMarkup = await loadMapSVG(mapSvgPath);
  } catch (error) {
    mapContainer.classList.add("is-missing-bg");
    mapContainer.innerHTML = `<p class="small">Impossible de charger <code>${escapeHTML(mapSvgPath)}</code>.</p>`;
    return;
  }

  mapContainer.classList.remove("is-missing-bg");
  mapContainer.innerHTML = renderSVG(mapSvgPath, svgMarkup);

  const knownZoneIds = Object.keys(SVG_ZONE_TO_PLACE_ID);
  byId.forEach((_value, placeId) => knownZoneIds.push(placeId));

  const zoneNodes = [];
  knownZoneIds.forEach((zoneId) => {
    const node = mapContainer.querySelector(`#${zoneId}`);
    if (!node) return;
    const placeId = getPlaceIdFromZoneId(zoneId, byId);
    if (!placeId || !byId.has(placeId)) return;

    node.classList.add("map-hotspot-zone");
    node.setAttribute("data-zone-id", zoneId);
    node.setAttribute("data-place-id", placeId);
    node.setAttribute("tabindex", "0");
    node.setAttribute("role", "button");
    node.setAttribute("aria-label", SVG_ZONE_LABELS[zoneId] || byId.get(placeId)?.title || placeId);
    zoneNodes.push(node);
  });

  const mappedIds = new Set(zoneNodes.map((node) => node.getAttribute("data-place-id")));
  const shortcuts = places.filter((p) => !mappedIds.has(p.id) && p.id === "foret");
  shortcutsContainer.innerHTML = shortcuts
    .map(
      (place) =>
        `<button class="badge map-shortcut" data-place-id="${escapeHTML(place.id)}" type="button">${escapeHTML(
          place.title
        )}</button>`
    )
    .join("");

  let selectedId = "chateau";

  function setSelected(id) {
    const place = byId.get(id);
    if (!place) return;
    selectedId = id;
    detailContainer.innerHTML = renderDetail(place);

    zoneNodes.forEach((el) => {
      const isActive = el.getAttribute("data-place-id") === id;
      el.classList.toggle("is-active", isActive);
      el.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    shortcutsContainer.querySelectorAll(".map-shortcut").forEach((el) => {
      const isActive = el.getAttribute("data-place-id") === id;
      el.classList.toggle("is-active", isActive);
    });
  }

  mapContainer.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-place-id]") : null;
    if (!target) return;
    setSelected(target.getAttribute("data-place-id") || "");
  });

  mapContainer.addEventListener("keydown", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-place-id]") : null;
    if (!target) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(target.getAttribute("data-place-id") || "");
    }
  });

  shortcutsContainer.querySelectorAll(".map-shortcut").forEach((shortcut) => {
    shortcut.addEventListener("click", () => {
      setSelected(shortcut.getAttribute("data-place-id") || "");
    });
  });

  if (!byId.has(selectedId) && places[0]?.id) {
    selectedId = places[0].id;
  }
  setSelected(selectedId);
}
