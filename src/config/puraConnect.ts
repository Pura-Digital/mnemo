import type { BrowserConnectionOptions } from "@pura-ai/sdk";

const DEFAULT_API_BASE = "https://ai.puradigital.it/v1";

function defaultMnemoPuraRedirectUri(): string {
  const protocol =
    envTrim("VITE_MNEMO_OAUTH_PROTOCOL") ||
    envTrim("VITE_MNEMO_PROTOCOL") ||
    (import.meta.env.DEV ? "mnemo-dev" : "mnemo");
  return `${protocol}://pura-oauth`;
}

function envTrim(key: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv];
  return typeof value === "string" ? value.trim() : "";
}

export function getPuraConnectClientOptions() {
  const apiBase =
    envTrim("VITE_PURA_OAUTH_API_BASE") ||
    envTrim("VITE_PURA_API_BASE") ||
    DEFAULT_API_BASE;
  const clientId =
    envTrim("VITE_PURA_CONNECT_CLIENT_ID") || envTrim("VITE_PURA_CLIENT_ID") || "";
  const redirectUri =
    envTrim("VITE_PURA_CONNECT_REDIRECT_URI") ||
    envTrim("VITE_PURA_REDIRECT_URI") ||
    (typeof window !== "undefined" && window.electronAPI
      ? defaultMnemoPuraRedirectUri()
      : typeof window !== "undefined"
        ? `${window.location.origin}/auth/pura/callback`
        : defaultMnemoPuraRedirectUri());
  return { apiBase, clientId, redirectUri };
}

export function isPuraConnectConfigured(): boolean {
  return Boolean(getPuraConnectClientOptions().clientId);
}

export function getPuraBrowserConnectionOptions(
  locale: "it" | "en" = "it"
): BrowserConnectionOptions {
  const { apiBase, clientId, redirectUri } = getPuraConnectClientOptions();
  return { apiBase, clientId, redirectUri, locale };
}

/** Pathname of the registered OAuth callback (for AppRouter early exit). */
export function getPuraConnectCallbackPathname(): string {
  try {
    return new URL(getPuraConnectClientOptions().redirectUri).pathname;
  } catch {
    return "/auth/pura/callback";
  }
}

export function isPuraConnectCallbackLocation(pathname: string, search: string): boolean {
  if (!search.includes("state=")) return false;
  let redirect: URL;
  try {
    redirect = new URL(getPuraConnectClientOptions().redirectUri);
  } catch {
    return false;
  }
  if (redirect.protocol !== "http:" && redirect.protocol !== "https:") {
    return false;
  }
  const expected = redirect.pathname;
  return pathname === expected || pathname.replace(/\/+$/, "") === expected.replace(/\/+$/, "");
}
