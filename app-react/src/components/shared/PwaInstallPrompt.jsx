import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  )
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIosDevice, setIsIosDevice] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showIosModal, setShowIosModal] = useState(false)

  useEffect(() => {
    if (isInStandaloneMode()) return

    const ios = isIos()
    setIsIosDevice(ios)

    if (ios) {
      setShow(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  return (
    <>
      {/* Bannière en bas */}
      <div className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-border bg-white/95 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="App icon" className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Installer l'app</p>
            <p className="text-xs text-stone-500 mt-0.5">Accès rapide depuis l'écran d'accueil ✨</p>
          </div>
          <button onClick={() => setShow(false)} className="shrink-0 text-stone-400 hover:text-stone-600">
            <X size={16} />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          {isIosDevice ? (
            <button
              onClick={() => setShowIosModal(true)}
              className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Installer
            </button>
          ) : (
            <button
              onClick={handleAndroidInstall}
              className="flex-1 rounded-xl bg-rose-500 py-2 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Installer l'app
            </button>
          )}
          <button
            onClick={() => setShow(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Plus tard
          </button>
        </div>
      </div>

      {/* Modal iOS avec instructions */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={() => setShowIosModal(false)}>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-lg">Installer l'app</p>
              <button onClick={() => setShowIosModal(false)} className="text-stone-400">
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">1</span>
                <span>Appuie sur le bouton <strong>Partager</strong> <span className="text-lg">⬆️</span> en bas de ton navigateur Safari</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">2</span>
                <span>Fais défiler et appuie sur <strong>« Sur l'écran d'accueil »</strong> 📲</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">3</span>
                <span>Appuie sur <strong>Ajouter</strong> en haut à droite ✅</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white"
            >
              Compris !
            </button>
          </div>
        </div>
      )}
    </>
  )
}
