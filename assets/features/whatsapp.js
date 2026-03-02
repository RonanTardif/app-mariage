import { WHATSAPP_LINK } from "../config.js";

export function initWhatsApp() {
  const btn = document.getElementById("waBtn");
  if (!btn) return;
  btn.href = WHATSAPP_LINK;
}
