import { fetchJSON, escapeHTML } from "../ui.js";

const DEFAULT_MAP_BG = "./assets/plan-domaine.jpg";
const PLACES_PATH = "./data/places.json";

const MAP_SPOTS_OLD = [
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

const MAP_SPOTS = [
  // from <title>gites</title>
  {
    id: "gites",
    label: "Gîtes",
    points:
      "475.708,340.164 478.763,273.558 527.648,244.228 511.761,241.172 358.385,228.951 272.226,280.891 275.893,284.557 277.726,318.165 281.2,316.546 286.526,317.927 292.247,314.573 297.968,315.56 299.94,317.73 307.831,316.743 312.566,318.322 316.906,318.124 320.851,314.968 324.797,318.716 331.306,319.111 338.803,319.505 344.918,321.872 351.231,321.675 358.924,322.07 365.04,323.253 367.012,324.437 370.958,321.083 374.312,325.029 380.23,326.607 383.386,324.24 389.699,327.001 388.712,330.355 393.052,327.791 397.787,329.961 405.875,323.648 408.834,319.308 408.055,297.792 409.425,295.053 413.534,292.998 410.794,288.204 427.916,287.862 439.216,290.944 432.367,296.765 433.052,300.531 436.476,300.874 435.792,337.171",
  },

  // from <title>chapelle</title>
  {
    id: "chapelle",
    label: "Chapelle",
    points:
      "560.421,214.435 610.022,223.225 658.995,211.61 656.798,169.857 659.937,169.857 635.451,143.173 610.022,147.254 609.708,135.01 611.592,132.499 605.627,121.825 602.488,112.407 599.662,101.42 598.721,88.862 603.116,87.038 605.627,83.27 598.721,81.073 598.721,75.108 595.267,83.584 591.186,81.701 591.814,87.038 596.209,89.863 592.128,109.327 588.047,125.965 584.908,133.186 586.477,136.325 585.535,147.626 558.537,173.055 562.932,175.566",
  },

  // from <title>chateau</title>
  {
    id: "chateau",
    label: "Château",
    points:
      "722.022,367.732 722.708,296.361 730.257,281.606 737.463,260.675 748.1,279.548 766.972,251.068 764.913,246.607 770.06,243.519 776.58,248.323 779.325,256.558 785.158,254.842 810.893,253.813 810.549,241.803 808.147,240.088 818.784,240.431 818.098,252.44 860.646,246.95 856.529,233.911 863.048,233.568 864.764,245.921 869.911,245.235 881.234,217.098 895.989,252.097 900.106,249.009 911.086,258.273 921.38,230.137 934.419,265.479 947.801,280.92 946.086,354.693 896.332,360.869 778.638,381.8",
  },

  // from <title>jardin</title>
  {
    id: "jardin",
    label: "Jardin",
    points:
      "384.603,586.269 393.487,577.808 397.294,569.347 447.637,430.586 445.522,420.855 438.753,414.087 421.831,412.818 356.681,403.933 299.569,397.588 287.724,399.28 281.801,400.972 269.109,400.972 239.496,400.972 227.65,400.549 208.613,403.933 201.421,406.049 196.345,411.548 184.499,425.086 180.269,436.085 173.923,445.392 123.58,540.579 126.118,544.387 128.233,549.04 135.848,548.617 267.84,573.577 335.529,582.038 371.065,587.961",
  },

  // from <title>piscine</title>
  {
    id: "piscine",
    label: "Piscine",
    points:
      "474.388,519.991 658.064,553.219 701.906,515.838 700.983,532.452 722.212,535.682 724.981,523.222 725.443,514.453 723.597,508.915 712.521,508.454 726.827,507.069 752.671,513.069 757.748,502.916 759.594,487.686 736.98,484.456 728.673,502.916 710.213,505.223 702.368,502.916 705.137,499.224 721.289,497.378 726.366,492.301 730.981,479.841 721.751,479.841 718.982,478.456 747.133,471.072 761.901,465.073 723.135,441.998 682.523,464.611 694.522,471.995 700.06,477.072 683.908,494.609 700.522,498.762 695.907,503.839 670.986,498.762 675.601,490.917 684.831,476.149 668.217,472.457 673.293,467.842 673.755,460.458 685.292,454.458 654.833,436.922 623.913,454.458 632.682,460.919 638.219,463.227 621.144,482.61 648.834,488.148 669.601,491.84 662.679,497.378 598.992,486.302 603.607,479.841 619.76,465.534 607.299,460.458 611.453,453.997 625.759,444.767 594.377,428.615 562.995,446.613 578.686,454.92 576.84,461.842 576.379,476.61 599.915,479.379 592.531,486.763 558.38,480.764 568.533,468.765 553.304,462.765 562.534,455.381 542.228,447.536 564.38,435.537 527.921,419.385 494.693,438.768 512.692,446.151 522.383,447.536 503,463.227 503.923,473.38 532.536,478.456 555.15,476.149 553.304,480.764 536.228,477.072",
  },

  // from <title>orangerie</title>
{ 
  id: "orangerie",
  label: "Orangerie",
  points: "396.349,697.521 608.53,742.948 663.833,718.118 665.244,711.629 658.754,707.396 657.908,685.953 663.833,679.745 631.103,665.637 442.34,632.061 396.349,657.173"
},

  // from <title>vin_honneur</title> (kept as id "vin" to match your code)
  {
    id: "vin",
    label: "Vin d'Honneur",
    points:
      "633.941,356.186 609.071,371.49 580.854,380.577 564.594,385.838 648.288,396.36 683.201,402.099 726.243,414.533 763.069,425.055 819.025,437.011 868.285,435.576 908.458,433.663 955.357,429.359 1002.226,422.185 1025.182,418.838 1023.269,354.273 946.27,355.23 780.316,384.403 730.1,380.577 700.926,375.316 687.535,373.403 678.926,367.186 667.448,367.186 659.318,372.447 640.666,366.708",
  },

  // from <title>saloon</title>
  {
    id: "saloon",
    label: "Saloon",
    points:
      "476.478,340.568 515.705,343.892 539.972,329.265 541.302,336.911 548.948,337.908 546.621,349.211 551.94,338.906 558.256,340.235 559.585,352.203 563.907,350.208 564.239,340.9 572.218,339.238 573.215,348.879 576.872,345.222 576.872,333.254 585.182,334.917 596.818,329.93 598.729,320.29 598.729,314.306 594.407,311.979 604.38,312.976 606.375,321.952 622.664,315.303 621.667,307.99 623.994,304.333 618.01,299.347 607.372,297.02 597.067,299.014 588.091,303.003 588.091,292.366 595.072,288.376 571.802,274.082 580.778,267.433 539.224,236.85 479.719,273.75",
  },

  // from <title>lac</title>
  {
    id: "lac",
    label: "Lac",
    points:
      "1022.562,462.444 984.372,465.428 946.182,476.169 913.959,485.716 881.139,498.247 891.098,503.252 895.886,505.406 898.52,508.758 906.421,505.646 914.083,504.928 918.393,513.068 923.9,517.378 926.294,517.139 929.167,513.068 938.984,526.716 943.772,528.631 944.251,531.026 948.8,537.011 959.35,536.433 967.279,538.911 973.225,532.469 981.154,531.974 985.614,539.902 992.056,536.929 994.534,546.344 1006.427,544.362 1012.373,552.291 1025.753,556.255",
  },
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

  const W = 1024;
  const H = 1024;

  const markup = `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="mapTitle mapDesc" preserveAspectRatio="xMidYMid meet">
      <title id="mapTitle">Plan du domaine</title>
      <desc id="mapDesc">Cliquez sur les zones marquées pour ouvrir le détail du lieu.</desc>

      <rect x="0" y="0" width="${W}" height="${H}" fill="#f8f7f6" />
      <image class="map-bg-image"
        href="${escapeHTML(backgroundSrc)}"
        x="0" y="0" width="${W}" height="${H}"
        preserveAspectRatio="xMidYMid meet"
      />

      ${MAP_SPOTS.map(
        (spot) => `
          <g class="map-hotspot" data-place-id="${spot.id}" tabindex="0" role="button" aria-label="${spot.label}">
            <polygon points="${spot.points}" class="map-zone" />
          </g>
        `
      ).join("")}
    </svg>
  `;

  planWarmupState.svgMarkupByBackground.set(backgroundSrc, markup);
  return markup;
}

function renderSVG_old(backgroundSrc) {
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
  const prevButton = document.getElementById("placePrev");
  const nextButton = document.getElementById("placeNext");
  if (!mapContainer || !detailContainer || !prevButton || !nextButton) return;

  const backgroundSrc = mapContainer.dataset.mapImage || DEFAULT_MAP_BG;
  preloadBackground(backgroundSrc);
  mapContainer.innerHTML = renderSVG(backgroundSrc);

  const bgImage = mapContainer.querySelector(".map-bg-image");
  if (bgImage) {
    bgImage.addEventListener("error", () => mapContainer.classList.add("is-missing-bg"));
    bgImage.addEventListener("load", () => mapContainer.classList.remove("is-missing-bg"));
  }

  const mappedIds = new Set(MAP_SPOTS.map((spot) => spot.id));
  const carouselPlaces = [...places];
  const placeIndexById = new Map(carouselPlaces.map((place, index) => [place.id, index]));

  let selectedId = placeIndexById.has("chateau") ? "chateau" : carouselPlaces[0]?.id || "";

  function setSelected(id) {
    if (!id || id === selectedId) return;

    const place = byId.get(id);
    if (!place) return;

    selectedId = id;
    detailContainer.innerHTML = renderDetail(place);

    mapContainer.querySelectorAll(".map-hotspot").forEach((el) => {
      const isActive = el.getAttribute("data-place-id") === id;
      el.classList.toggle("is-active", isActive);
      el.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  }


  function shiftSelection(offset) {
    if (!carouselPlaces.length || !selectedId) return;
    const currentIndex = placeIndexById.get(selectedId);
    if (typeof currentIndex !== "number") return;

    const nextIndex = (currentIndex + offset + carouselPlaces.length) % carouselPlaces.length;
    setSelected(carouselPlaces[nextIndex].id);
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

  prevButton.addEventListener("click", () => shiftSelection(-1));
  nextButton.addEventListener("click", () => shiftSelection(1));

  if (selectedId) {
    const initialId = selectedId;
    selectedId = "";
    setSelected(initialId);
  }
}
