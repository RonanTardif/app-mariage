const WEDDING_EVENTS = [
  {
    id: "samedi-messe",
    date: "2026-06-13",
    timeLabel: "14h30 → 15h30",
    title: "Messe à la Cathédrale de Luçon",
    baseText: "Le week-end commence bientôt. Prépare ta tenue, ton sourire et ton énergie 💛",
    specialText: "Ouverture officielle de cette belle journée 💒",
  },
  {
    id: "samedi-arrivee",
    date: "2026-06-13",
    timeLabel: "16h00",
    title: "Arrivée au domaine & accueil des invités",
    baseText: "Le prochain moment du programme s'affichera ici dès qu'il sera détecté.",
    specialText: "Bienvenue au domaine ! Rafraîchissements et retrouvailles au rendez-vous.",
  },
  {
    id: "samedi-photos",
    date: "2026-06-13",
    timeLabel: "16h30",
    title: "Début des photos invités",
    baseText: "Reste à l'affût : le programme s'actualise automatiquement.",
    specialText: "Direction le lac pour immortaliser les premiers moments ensemble 📸",
  },
  {
    id: "samedi-vin-honneur",
    date: "2026-06-13",
    timeLabel: "17h00",
    title: "Début du vin d’honneur",
    baseText: "Consulte cette carte pour connaître le prochain temps fort.",
    specialText: "Le vin d'honneur commence devant le Château 🥂",
  },
  {
    id: "samedi-reception",
    date: "2026-06-13",
    timeLabel: "20h00",
    title: "Début de la réception",
    baseText: "Le moment principal change automatiquement selon l'agenda.",
    specialText: "Cap sur l'Orangerie pour le repas et la soirée 🍽️",
  },
  {
    id: "samedi-dancefloor",
    date: "2026-06-13",
    timeLabel: "23h00 → 4h00",
    title: "Fin du repas & dancefloor",
    baseText: "Le programme se mettra à jour tout seul pendant le week-end.",
    specialText: "Place à la piste de danse jusqu'au bout de la nuit 🎶",
  },
  {
    id: "samedi-after",
    date: "2026-06-13",
    timeLabel: "Dès 4h00",
    title: "After au Saloon",
    baseText: "Ce bloc met en avant le prochain moment à venir.",
    specialText: "Pour les plus motivés : l'after continue au Saloon 🤠",
  },
  {
    id: "dimanche-piscine",
    date: "2026-06-14",
    timeLabel: "10h00",
    title: "Ouverture de la piscine",
    baseText: "La journée de dimanche est aussi suivie automatiquement.",
    specialText: "La piscine est officiellement ouverte pour démarrer la journée 🏊",
  },
  {
    id: "dimanche-brunch",
    date: "2026-06-14",
    timeLabel: "Dès 11h00",
    title: "Brunch",
    baseText: "Quand un événement approche, ce message devient le contenu spécial.",
    specialText: "Brunch servi au Saloon à partir de 11h ☕",
  },
  {
    id: "dimanche-pool-party",
    date: "2026-06-14",
    timeLabel: "14h00",
    title: "Pool Party",
    baseText: "L'app suit l'ordre des événements sans recharger la page.",
    specialText: "La fête continue autour de la piscine 🎉",
  },
  {
    id: "dimanche-fin",
    date: "2026-06-14",
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

  if (!timeEl || !titleEl || !textEl || !noteEl) return;

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
}

function getNextEventByDate(events, now) {
  const weddingStart = new Date("2026-06-13T00:00:00+02:00");
  if (now < weddingStart) {
    return { event: events[0], isSpecial: false };
  }

  const dayKey = now.toISOString().slice(0, 10);
  const todayEvents = events.filter((event) => event.date === dayKey);

  if (todayEvents.length > 0) {
    return { event: todayEvents[0], isSpecial: true };
  }

  const lastDay = "2026-06-14";
  if (dayKey > lastDay) {
    return { event: events[events.length - 1], isSpecial: false };
  }

  const next = events.find((event) => event.date > dayKey) || events[0];
  return { event: next, isSpecial: false };
}

function startPrototypeRotation(events) {
  let index = 0;

  const render = () => {
    const event = events[index % events.length];
    renderHero(event, {
      isSpecial: true,
      note: "Mode prototype activé : rotation automatique toutes les 15 secondes.",
    });
    index += 1;
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

  const current = getNextEventByDate(events, new Date());
  renderHero(current.event, {
    isSpecial: current.isSpecial,
    note: current.isSpecial ? "Moment à venir détecté automatiquement." : "Mode pré-mariage : contenu d'information générale.",
  });

  return () => {};
}
