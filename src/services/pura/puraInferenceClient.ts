import { PuraInferenceClient, type StoredTokens, type TokenStore } from "@pura-ai/sdk";
import { getPuraBrowserConnectionOptions, isPuraConnectConfigured } from "../../config/puraConnect";

const BROWSER_TOKEN_STORAGE_KEY = "mnemo-pura-oauth-tokens";

let client: PuraInferenceClient | null = null;

function readBrowserTokens(): StoredTokens | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BROWSER_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

function writeBrowserTokens(tokens: StoredTokens | null) {
  if (typeof sessionStorage === "undefined") return;
  if (!tokens) {
    sessionStorage.removeItem(BROWSER_TOKEN_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(BROWSER_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

let refreshLock: Promise<unknown> = Promise.resolve();

function createTokenStore(): TokenStore {
  const useMain = Boolean(window.electronAPI?.puraGetTokens);
  return {
    async get() {
      if (useMain) {
        const tokens = await window.electronAPI?.puraGetTokens?.();
        return tokens ?? null;
      }
      return readBrowserTokens();
    },
    async set(tokens) {
      if (useMain) {
        await window.electronAPI?.puraSetTokens?.(tokens);
        return;
      }
      writeBrowserTokens(tokens);
    },
    async withRefreshLock(operation) {
      const run = refreshLock.then(operation, operation);
      refreshLock = run.catch(() => {});
      return run;
    },
  };
}

export async function readPuraConnectionFromStore(): Promise<{
  configured: boolean;
  connected: boolean;
  puraUserId: number | null;
}> {
  const configured = isPuraConnectConfigured();
  if (!configured) {
    return { configured: false, connected: false, puraUserId: null };
  }
  if (window.electronAPI?.puraGetConnectionState) {
    return window.electronAPI.puraGetConnectionState();
  }
  const tokens = readBrowserTokens();
  return {
    configured: true,
    connected: Boolean(tokens?.access_token),
    puraUserId: tokens?.pura_user_id ?? null,
  };
}

export function getPuraInferenceClient(): PuraInferenceClient | null {
  if (!isPuraConnectConfigured()) return null;
  if (!client) {
    client = new PuraInferenceClient({
      ...getPuraBrowserConnectionOptions(),
      store: createTokenStore(),
    });
  }
  return client;
}

export function resetPuraInferenceClient() {
  client = null;
}

export async function persistPuraTokens(tokens: StoredTokens | null) {
  resetPuraInferenceClient();
  if (window.electronAPI?.puraSetTokens) {
    await window.electronAPI.puraSetTokens(tokens);
    return;
  }
  writeBrowserTokens(tokens);
}
