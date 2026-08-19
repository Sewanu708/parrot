/**
 * Global widget configuration & URL resolution
 */

export const config = {
  apiUrl:
    (import.meta.env?.VITE_API_URL as string | undefined) ||
    (import.meta.env?.PROD
      ? "https://api.parrot.app"
      : "http://localhost:8080"),
};

/**
 * Locate the running parrot.js <script> URL. document.currentScript is only
 * reliable during the script's synchronous execution, so this is called once at load time.
 */
export function getWidgetScriptSrc(): string {
  let src = (document.currentScript as HTMLScriptElement | null)?.src ?? "";
  if (!src) {
    const scripts = Array.from(document.getElementsByTagName("script"));
    for (let i = scripts.length - 1; i >= 0; i--) {
      const s = scripts[i]?.src;
      if (
        s &&
        (/\/parrot\.js(\?.*)?$/.test(s) ||
          /\/widget\.js(\?.*)?$/.test(s) ||
          /\/parrot\.iife\.js(\?.*)?$/.test(s))
      ) {
        src = s;
        break;
      }
    }
  }
  return src;
}

export const SCRIPT_SRC =
  typeof window !== "undefined" ? getWidgetScriptSrc() : "";

/**
 * Resolve the iframe host relative to the running parrot.js URL.
 * The loader and iframe are deployed together under the same versioned CDN prefix
 * (e.g. /v0.1.0/parrot.js + /v0.1.0/src/embed/embed.html).
 */
export function resolveFrameHost(): string {
  try {
    if (SCRIPT_SRC) return new URL("./src/embed/embed.html", SCRIPT_SRC).href;
  } catch {
    /* fall through to dev path */
  }
  return "/src/embed/embed.html";
}

export const FRAME_HOST =
  typeof window !== "undefined" ? resolveFrameHost() : "/src/embed/embed.html";

/**
 * The origin the iframe actually runs on. When the frame is served from the CDN
 * (cross-origin to the tenant page), postMessage targetOrigin must use THIS origin.
 */
export const IFRAME_ORIGIN = (() => {
  if (typeof window === "undefined") return "*";
  try {
    return new URL(FRAME_HOST, window.location.href).origin;
  } catch {
    return window.location.origin;
  }
})();

/**
 * Resolves the full URL for the embed iframe given a propertyId and optional host override.
 */
export function resolveEmbedUrl(
  propertyId: string,
  hostOverride?: string,
): string {
  if (hostOverride) {
    if (hostOverride.includes(".html") || hostOverride.includes("/embed")) {
      const separator = hostOverride.includes("?") ? "&" : "?";
      return `${hostOverride}${separator}propertyId=${encodeURIComponent(propertyId)}`;
    }
    return `${hostOverride.replace(/\/$/, "")}/src/embed/embed.html?propertyId=${encodeURIComponent(propertyId)}`;
  }
  const separator = FRAME_HOST.includes("?") ? "&" : "?";
  return `${FRAME_HOST}${separator}propertyId=${encodeURIComponent(propertyId)}`;
}
