function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function initPwaInstall() {
  const installBtn = document.getElementById("installBtn");
  const clockChip = document.getElementById("clockChip");
  const iosModal = document.getElementById("iosInstallModal");
  const closeModalBtn = document.getElementById("closeIosModal");

  if (!installBtn || !iosModal || !closeModalBtn) {
    return;
  }

  let deferredPrompt = null;

  const setIosModalVisibility = (isVisible) => {
    iosModal.hidden = !isVisible;
    iosModal.style.display = isVisible ? "grid" : "none";
  };

  const setClockVisibility = (isVisible) => {
    if (!clockChip) {
      return;
    }
    clockChip.hidden = !isVisible;
  };

  const openIosModal = () => setIosModalVisibility(true);
  const closeIosModal = () => setIosModalVisibility(false);

  const hideInstallCta = () => {
    installBtn.hidden = true;
  };

  const applyStandaloneState = () => {
    const standalone = isInStandaloneMode();
    setClockVisibility(standalone);
    if (standalone) {
      hideInstallCta();
      closeIosModal();
    }
    return standalone;
  };

  closeIosModal();
  const startsInStandalone = applyStandaloneState();

  const displayModeMedia = window.matchMedia("(display-mode: standalone)");
  if (displayModeMedia.addEventListener) {
    displayModeMedia.addEventListener("change", applyStandaloneState);
  } else if (displayModeMedia.addListener) {
    displayModeMedia.addListener(applyStandaloneState);
  }

  if (startsInStandalone) {
    return;
  }

  if (isIos()) {
    installBtn.hidden = false;
    installBtn.textContent = "Installer";
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
    event.preventDefault();
    deferredPrompt = event;
    installBtn.textContent = "Installer l'app";
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      deferredPrompt = null;
      installBtn.hidden = true;
    }
  });

  window.addEventListener("appinstalled", () => {
    hideInstallCta();
    setClockVisibility(true);
    deferredPrompt = null;
  });
}
