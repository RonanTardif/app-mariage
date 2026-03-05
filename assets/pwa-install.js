function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  const hasMatchMedia = typeof window.matchMedia === "function";
  const displayModeStandalone = hasMatchMedia && window.matchMedia("(display-mode: standalone)").matches;
  const displayModeFullscreen = hasMatchMedia && window.matchMedia("(display-mode: fullscreen)").matches;
  const displayModeMinimalUi = hasMatchMedia && window.matchMedia("(display-mode: minimal-ui)").matches;
  const iosStandalone = window.navigator.standalone === true;
  const androidTwaReferrer = typeof document.referrer === "string" && document.referrer.startsWith("android-app://");

  return displayModeStandalone || displayModeFullscreen || displayModeMinimalUi || iosStandalone || androidTwaReferrer;
}

export function initPwaInstall() {
  const installBtn = document.getElementById("installBtn");
  const iosModal = document.getElementById("iosInstallModal");
  const closeModalBtn = document.getElementById("closeIosModal");

  if (!installBtn || !iosModal || !closeModalBtn) {
    return;
  }

  const rootEl = document.documentElement;
  let deferredPrompt = null;

  const setIosModalVisibility = (isVisible) => {
    iosModal.hidden = !isVisible;
    iosModal.style.display = isVisible ? "grid" : "none";
  };


  const openIosModal = () => setIosModalVisibility(true);
  const closeIosModal = () => setIosModalVisibility(false);

  const hideInstallCta = () => {
    installBtn.hidden = true;
  };

  const showInstallCta = (label) => {
    installBtn.textContent = label;
    installBtn.hidden = false;
  };

  const applyStandaloneState = () => {
    const standalone = isInStandaloneMode();
    rootEl.classList.toggle("is-standalone", standalone);

    if (standalone) {
      hideInstallCta();
      closeIosModal();
    }

    return standalone;
  };

  closeIosModal();
  const startsInStandalone = applyStandaloneState();

  if (typeof window.matchMedia === "function") {
    const displayModeMedia = window.matchMedia("(display-mode: standalone)");
    if (displayModeMedia.addEventListener) {
      displayModeMedia.addEventListener("change", applyStandaloneState);
    } else if (displayModeMedia.addListener) {
      displayModeMedia.addListener(applyStandaloneState);
    }
  }

  window.addEventListener("pageshow", applyStandaloneState);
  window.addEventListener("focus", applyStandaloneState);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      applyStandaloneState();
    }
  });

  [100, 500, 1500].forEach((delay) => {
    window.setTimeout(applyStandaloneState, delay);
  });

  if (startsInStandalone) {
    return;
  }

  if (isIos()) {
    if (applyStandaloneState()) {
      return;
    }

    showInstallCta("Installer");
    installBtn.addEventListener("click", openIosModal);
    closeModalBtn.addEventListener("click", closeIosModal);
    iosModal.addEventListener("click", (event) => {
      if (event.target === iosModal) {
        closeIosModal();
      }
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeIosModal();
      }
    });
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    if (isInStandaloneMode()) {
      return;
    }

    event.preventDefault();
    deferredPrompt = event;
    showInstallCta("Installer l'app");
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt || isInStandaloneMode()) {
      return;
    }

    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      deferredPrompt = null;
      hideInstallCta();
    }
  });

  window.addEventListener("appinstalled", () => {
    hideInstallCta();
    deferredPrompt = null;
  });
}
