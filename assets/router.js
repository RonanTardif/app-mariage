export const routes = {
  "/home": { file: "./pages/home.html", title: "Home" },
  "/programme": { file: "./pages/programme.html", title: "Programme" },
  "/plan": { file: "./pages/plan.html", title: "Plan" },
  "/chambre": { file: "./pages/chambre.html", title: "Trouver ma chambre" },
  "/photos": { file: "./pages/photos.html", title: "Trouver mon créneau photo" },
  "/quiz": { file: "./pages/quiz.html", title: "Quiz" },
  "/leaderboard": { file: "./pages/leaderboard.html", title: "Leaderboard" },
  "/infos": { file: "./pages/infos.html", title: "Infos pratiques" },
  "/whatsapp": { file: "./pages/whatsapp.html", title: "WhatsApp" },
};

export function getRouteFromHash() {
  const raw = location.hash || "#/home";
  const path = raw.replace(/^#/, "");
  return routes[path] ? path : "/home";
}
