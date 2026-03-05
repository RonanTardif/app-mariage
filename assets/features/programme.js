const WEDDING_EVENTS = [
  {
    id: "samedi-messe",
    startsAt: "2026-06-13T14:30:00+02:00",
    timeLabel: "14h30 → 15h30",
    title: "Messe à la Cathédrale de Luçon",
    baseText: "Le week-end commence bientôt. Prépare ta tenue, ton sourire et ton énergie 💛",
    specialText: "Ouverture officielle de cette belle journée 💒",
  },
  {
    id: "samedi-arrivee",
    startsAt: "2026-06-13T16:00:00+02:00",
    timeLabel: "16h00",
    title: "Arrivée au domaine & accueil des invités",
    baseText: "Le prochain moment du programme s'affichera ici dès qu'il sera détecté.",
    specialText: "Bienvenue au domaine ! Rafraîchissements et retrouvailles au rendez-vous.",
  },
  {
    id: "samedi-photos",
    startsAt: "2026-06-13T16:30:00+02:00",
    timeLabel: "16h30",
    title: "Début des photos invités",
    baseText: "Reste à l'affût : le programme s'actualise automatiquement.",
    specialText: "Direction le lac pour immortaliser les premiers moments ensemble 📸",
    ctaText: "Regarde ton créneau photo sur la page Photos.",
  },
  {
    id: "samedi-vin-honneur",
    startsAt: "2026-06-13T17:00:00+02:00",
    timeLabel: "17h00",
    title: "Début du vin d’honneur",
    baseText: "Consulte cette carte pour connaître le prochain temps fort.",
    specialText: "Le vin d'honneur commence devant le Château 🥂",
  },
  {
    id: "samedi-reception",
    startsAt: "2026-06-13T20:00:00+02:00",
    timeLabel: "20h00",
    title: "Début de la réception",
    baseText: "Le moment principal change automatiquement selon l'agenda.",
    specialText: "Cap sur l'Orangerie pour le repas et la soirée 🍽️",
  },
  {
    id: "samedi-dancefloor",
    startsAt: "2026-06-13T23:00:00+02:00",
    timeLabel: "23h00 → 4h00",
    title: "Fin du repas & dancefloor",
    baseText: "Le programme se mettra à jour tout seul pendant le week-end.",
    specialText: "Place à la piste de danse jusqu'au bout de la nuit 🎶",
  },
  {
    id: "samedi-after",
    startsAt: "2026-06-14T04:00:00+02:00",
    timeLabel: "Dès 4h00",
    title: "After au Saloon",
    baseText: "Ce bloc met en avant le prochain moment à venir.",
    specialText: "Pour les plus motivés : l'after continue au Saloon 🤠",
  },
  {
    id: "dimanche-piscine",
    startsAt: "2026-06-14T10:00:00+02:00",
    timeLabel: "10h00",
    title: "Ouverture de la piscine",
    baseText: "La journée de dimanche est aussi suivie automatiquement.",
    specialText: "La piscine est officiellement ouverte pour démarrer la journée 🏊",
  },
  {
    id: "dimanche-brunch",
    startsAt: "2026-06-14T11:00:00+02:00",
    timeLabel: "Dès 11h00",
    title: "Brunch",
    baseText: "Quand un événement approche, ce message devient le contenu spécial.",
    specialText: "Brunch servi au Saloon à partir de 11h ☕",
  },
  {
    id: "dimanche-pool-party",
    startsAt: "2026-06-14T14:00:00+02:00",
    timeLabel: "14h00",
    title: "Pool Party",
    baseText: "L'app suit l'ordre des événements sans recharger la page.",
    specialText: "La fête continue autour de la piscine 🎉",
  },
  {
    id: "dimanche-fin",
    startsAt: "2026-06-14T16:30:00+02:00",
    timeLabel: "16h30",
    title: "Fin du mariage",
    baseText: "Après le dernier moment, ce bloc passe en mode clôture.",
    specialText: "Clôture du week-end et derniers au revoir 💛",
  },
];

const PROTOTYPE_ROTATION_MS = 15000;
const PROTOTYPE_MODE = true;

function renderHero(event, { isSpecial, note }) {
  const timeEl = document.querySelector("[data-programme-hero-time]");
  const titleEl = document.querySelector("[data-programme-hero-title]");
  const textEl = document.querySelector("[data-programme-hero-text]");
  const noteEl = document.querySelector("[data-programme-hero-note]");
  const linkWrapEl = document.querySelector("[data-programme-hero-link-wrap]");
  const linkEl = document.querySelector("[data-programme-hero-link]");

  if (!timeEl || !titleEl || !textEl || !noteEl || !linkWrapEl || !linkEl || !event) return;

  timeEl.textContent = event.timeLabel;
  titleEl.textContent = event.title;
  textEl.textContent = isSpecial ? event.specialText : event.baseText;

  if (note) {
    noteEl.hidden = false;
    noteEl.textContent = note;
  } else {
    noteEl.hidden = true;
    noteEl.textContent = "";
  }

  if (event.ctaText) {
    linkWrapEl.hidden = false;
    linkEl.textContent = event.ctaText;
  } else {
    linkWrapEl.hidden = true;
    linkEl.textContent = "";
  }
}

function highlightCurrentMoment(currentId) {
  const items = document.querySelectorAll("[data-programme-item]");
  items.forEach((item) => item.classList.remove("timeline-item-featured"));

  if (!currentId) return;

  const currentItem = document.querySelector(`[data-programme-item="${currentId}"]`);
  if (currentItem) {
    currentItem.classList.add("timeline-item-featured");
  }
}

function getCurrentAndNextByDate(events, now) {
  const timestamps = events.map((event) => ({
    ...event,
    at: new Date(event.startsAt).getTime(),
  }));
  const nowTime = now.getTime();

  const nextIndex = timestamps.findIndex((event) => event.at > nowTime);

  if (nextIndex === 0) {
    return { current: null, next: timestamps[0], isSpecial: false };
  }

  if (nextIndex === -1) {
    return {
      current: timestamps[timestamps.length - 1],
      next: timestamps[timestamps.length - 1],
      isSpecial: false,
    };
  }

  return {
    current: timestamps[nextIndex - 1],
    next: timestamps[nextIndex],
    isSpecial: true,
  };
}

function startPrototypeRotation(events) {
  let nextIndex = 0;

  const render = () => {
    const next = events[nextIndex % events.length];
    const current = events[(nextIndex - 1 + events.length) % events.length];

    renderHero(next, {
      isSpecial: true,
      note: "Mode prototype activé : rotation automatique toutes les 15 secondes.",
    });
    highlightCurrentMoment(current.id);
    nextIndex += 1;
  };

  render();
  return window.setInterval(render, PROTOTYPE_ROTATION_MS);
}

export function initProgramme() {
  const events = [...WEDDING_EVENTS];

  if (PROTOTYPE_MODE) {
    const intervalId = startPrototypeRotation(events);
    return () => window.clearInterval(intervalId);
  }

  const state = getCurrentAndNextByDate(events, new Date());
  renderHero(state.next, {
    isSpecial: state.isSpecial,
    note: state.isSpecial
      ? "Moment à venir détecté automatiquement."
      : "Mode pré/post-mariage : contenu d'information générale.",
  });
  highlightCurrentMoment(state.current?.id || null);

  return () => {};
}
