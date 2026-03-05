function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export function initPwaInstall() {
  const installBtn = document.getElementById("installBtn");
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

  const openIosModal = () => setIosModalVisibility(true);
  const closeIosModal = () => setIosModalVisibility(false);

  const hideInstallCta = () => {
    installBtn.hidden = true;
  };

  closeIosModal();

  if (isInStandaloneMode()) {
    hideInstallCta();
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
    deferredPrompt = null;
  });
}
