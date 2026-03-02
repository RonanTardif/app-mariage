import { fetchJSON, escapeHTML } from "../ui.js";

const DEFAULT_MAP_BG = "./assets/plan-domaine.jpg";
const PLACES_PATH = "./data/places.json";

const MAP_SPOTS = [
  { id: "gites", label: "Gîtes", points: "318,188 446,172 532,229 477,295 296,274" },
  { id: "chapelle", label: "Chapelle", points: "570,88 640,75 672,126 608,155 558,128" },
  { id: "chateau", label: "Château", points: "662,140 856,140 882,236 656,244" },
  { id: "jardin", label: "Jardin", points: "214,322 368,322 410,505 256,535 166,456" },
  { id: "piscine", label: "Piscine", points: "552,330 712,334 754,406 568,419 518,379" },
  { id: "orangerie", label: "Orangerie", points: "430,540 644,540 666,606 438,622" },
  { id: "vin", label: "Vin d'Honneur", points: "742,538 944,562 908,649 706,622" },
  { id: "saloon", label: "Saloon", points: "62,596 192,554 242,654 126,694" },
  { id: "refresh", label: "Rafraîchissement", points: "744,430 852,426 868,498 742,500" },
  { id: "lac", label: "Lac", points: "26,98 206,84 236,264 72,278" }
];

const planWarmupState = {
  placesPromise: null,
  preloadedBackgrounds: new Set(),
  svgMarkupByBackground: new Map(),
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

function preloadBackground(backgroundSrc) {
  if (!backgroundSrc || planWarmupState.preloadedBackgrounds.has(backgroundSrc)) return;

  planWarmupState.preloadedBackgrounds.add(backgroundSrc);
  const img = new Image();
  img.decoding = "async";
  img.src = backgroundSrc;
}

function renderSVG(backgroundSrc) {
  const cachedMarkup = planWarmupState.svgMarkupByBackground.get(backgroundSrc);
  if (cachedMarkup) return cachedMarkup;

  const markup = `
    <svg viewBox="0 0 1000 720" role="img" aria-labelledby="mapTitle mapDesc">
      <title id="mapTitle">Plan du domaine</title>
      <desc id="mapDesc">Cliquez sur les zones marquées pour ouvrir le détail du lieu.</desc>

      <rect x="0" y="0" width="1000" height="720" fill="#f8f7f6" />
      <image class="map-bg-image" href="${escapeHTML(backgroundSrc)}" x="0" y="0" width="1000" height="720" preserveAspectRatio="xMidYMid slice" />

      ${MAP_SPOTS.map(
        (spot) => `
          <g class="map-hotspot" data-place-id="${spot.id}" tabindex="0" role="button" aria-label="${spot.label}">
            <polygon points="${spot.points}" class="map-zone" />
            <text class="map-zone-label" x="${spot.points.split(" ")[0].split(",")[0]}" y="${Number(spot.points.split(" ")[0].split(",")[1]) - 8}">${spot.label}</text>
          </g>
        `
      ).join("")}
    </svg>
  `;

  planWarmupState.svgMarkupByBackground.set(backgroundSrc, markup);
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

export function warmupPlanAssets() {
  preloadBackground(DEFAULT_MAP_BG);
  renderSVG(DEFAULT_MAP_BG);
  return loadPlacesData();
}

export async function initPlan() {
  const places = await loadPlacesData();
  const byId = new Map(places.map((p) => [p.id, p]));

  const mapContainer = document.getElementById("domainMap");
  const detailContainer = document.getElementById("placeDetail");
  const shortcutsContainer = document.getElementById("placeShortcuts");
  if (!mapContainer || !detailContainer || !shortcutsContainer) return;

  const backgroundSrc = mapContainer.dataset.mapImage || DEFAULT_MAP_BG;
  preloadBackground(backgroundSrc);
  mapContainer.innerHTML = renderSVG(backgroundSrc);

  const bgImage = mapContainer.querySelector(".map-bg-image");
  if (bgImage) {
    bgImage.addEventListener("error", () => mapContainer.classList.add("is-missing-bg"));
    bgImage.addEventListener("load", () => mapContainer.classList.remove("is-missing-bg"));
  }

  const mappedIds = new Set(MAP_SPOTS.map((spot) => spot.id));
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

    mapContainer.querySelectorAll(".map-hotspot").forEach((el) => {
      const isActive = el.getAttribute("data-place-id") === id;
      el.classList.toggle("is-active", isActive);
      el.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    shortcutsContainer.querySelectorAll(".map-shortcut").forEach((el) => {
      const isActive = el.getAttribute("data-place-id") === id;
      el.classList.toggle("is-active", isActive);
    });
  }

  mapContainer.querySelectorAll(".map-hotspot").forEach((hotspot) => {
    const choose = () => setSelected(hotspot.getAttribute("data-place-id") || "");
    hotspot.addEventListener("click", choose);
    hotspot.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  });

  shortcutsContainer.querySelectorAll(".map-shortcut").forEach((shortcut) => {
    shortcut.addEventListener("click", () => {
      setSelected(shortcut.getAttribute("data-place-id") || "");
    });
  });

  setSelected(selectedId);
}
