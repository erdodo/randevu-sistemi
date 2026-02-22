"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallToast() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Dismissed before
    if (localStorage.getItem("pwa_dismissed") === "true") return;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS fallback: show after 3 seconds if no prompt event
    const iosTimer = setTimeout(() => {
      const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)",
      ).matches;
      if (isIos && !isStandalone) {
        setShow(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      deferredPrompt.current = null;
    } else {
      // iOS: Show manual instructions
      alert("Safari'de paylaş butonuna (□↑) tıklayıp 'Ana Ekrana Ekle' seçin.");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-sm mx-auto animate-in slide-in-from-bottom">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">Hızlı Erişim</p>
          <p className="text-gray-500 text-xs">
            Ana ekrana ekle, uygulama gibi kullan
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-all flex-shrink-0"
        >
          Kur
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
