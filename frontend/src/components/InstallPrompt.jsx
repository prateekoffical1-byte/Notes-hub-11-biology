import { useEffect, useState } from "react";
import { DownloadSimple, X } from "@phosphor-icons/react";

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js").catch(() => {});
      });
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      if (sessionStorage.getItem("install_dismissed") !== "1") setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true); setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || installed || !deferred) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
  };
  const dismiss = () => {
    sessionStorage.setItem("install_dismissed", "1");
    setVisible(false);
  };

  return (
    <div
      data-testid="install-prompt"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40 border border-ink bg-paper p-4 sm:p-5 shadow-[6px_6px_0_0_var(--accent-green)] fade-in"
    >
      <button
        onClick={dismiss}
        className="absolute right-2 top-2 text-ink-light hover:text-ink-dark"
        data-testid="install-dismiss"
        aria-label="Dismiss"
      >
        <X size={16} weight="bold" />
      </button>
      <p className="font-mono-arch text-[10px] tracking-widest uppercase text-accent-green mb-1">Install app</p>
      <h3 className="font-serif-display text-2xl text-ink-dark leading-tight">Add Notes Hub to your home screen.</h3>
      <p className="font-body text-sm text-ink-medium mt-2">
        Works offline. Opens in its own window. Free forever.
      </p>
      <button onClick={install} className="btn-primary mt-4 w-full justify-center" data-testid="install-confirm">
        <DownloadSimple size={14} weight="bold" /> Install
      </button>
    </div>
  );
}
