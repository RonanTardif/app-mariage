import { fetchJSON, escapeHTML } from "../ui.js";

export async function initPlan() {
  const places = await fetchJSON("./data/places.json");
  const container = document.getElementById("placesList");
  if (!container) return;

  container.innerHTML = places
    .map((p) => {
      const extra = p.links?.length
        ? `<div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            ${p.links
              .map((l) => `<a class="badge" href="${escapeHTML(l.href)}">${escapeHTML(l.label)}</a>`)
              .join("")}
          </div>`
        : "";

      return `
        <div class="list-item">
          <p class="list-title">${escapeHTML(p.title)}</p>
          <p class="list-text">${escapeHTML(p.description)}</p>
          ${extra}
        </div>
      `;
    })
    .join("");
}
