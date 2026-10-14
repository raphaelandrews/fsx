import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** The site key of this deployment; undefined means the challenge is off. */
export const TURNSTILE_SITE_KEY = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TURNSTILE_SITE_KEY || undefined;

let scriptLoaded: Promise<void> | undefined;
function loadTurnstile() {
  scriptLoaded ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoaded = undefined;
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptLoaded;
}

/** Cloudflare's invisible-when-possible challenge. Tokens are single use: remount it to get a new one. */
export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const report = useRef(onToken);
  report.current = onToken;

  useEffect(() => {
    let widgetId: string | undefined;
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !container.current || !window.turnstile) return;
        widgetId = window.turnstile.render(container.current, {
          sitekey: siteKey,
          language: "pt-br",
          callback: (token: string) => report.current(token),
          "expired-callback": () => report.current(""),
          "error-callback": () => report.current(""),
        });
      })
      .catch(() => report.current(""));
    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
  }, [siteKey]);

  return <div ref={container} />;
}
