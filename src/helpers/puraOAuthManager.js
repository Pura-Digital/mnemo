const debugLogger = require("./debugLogger");
const { openExternalUrl } = require("./externalUrlOpener");
const puraTokenStore = require("./puraTokenStore");
const { getDefaultPuraOAuthRedirectUri } = require("./oauthProtocol");
const path = require("path");
const fs = require("fs");

let sdkPromise = null;
/** @type {Map<string, import('@pura-ai/sdk').PendingAuthorization>} */
const pendingByState = new Map();

function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = import("@pura-ai/sdk");
  }
  return sdkPromise;
}

function readRuntimeEnv() {
  const envPath = path.join(__dirname, "..", "dist", "runtime-env.json");
  try {
    if (fs.existsSync(envPath)) {
      return JSON.parse(fs.readFileSync(envPath, "utf8"));
    }
  } catch (err) {
    debugLogger.error("puraOAuthManager runtime-env read failed", { error: err?.message });
  }
  return {};
}

function pickEnv(runtimeEnv, ...keys) {
  for (const key of keys) {
    const fromProcess = process.env[key]?.trim();
    if (fromProcess) return fromProcess;
    const fromRuntime = runtimeEnv[key]?.trim?.() ?? runtimeEnv[key];
    if (typeof fromRuntime === "string" && fromRuntime.trim()) return fromRuntime.trim();
  }
  return "";
}

function getPuraClientConfig() {
  const runtimeEnv = readRuntimeEnv();
  const clientId = pickEnv(
    runtimeEnv,
    "VITE_PURA_CONNECT_CLIENT_ID",
    "VITE_PURA_CLIENT_ID"
  );
  const apiBase =
    pickEnv(runtimeEnv, "VITE_PURA_OAUTH_API_BASE", "VITE_PURA_API_BASE") ||
    "https://ai.puradigital.it/v1";
  const redirectUri =
    pickEnv(runtimeEnv, "VITE_PURA_CONNECT_REDIRECT_URI", "VITE_PURA_REDIRECT_URI") ||
    getDefaultPuraOAuthRedirectUri();
  return { clientId, apiBase, redirectUri };
}

function buildOAuthCallbackUrl(registeredRedirectUri, searchParams) {
  const base = registeredRedirectUri.split("?")[0];
  const query = searchParams.toString();
  return query ? `${base}?${query}` : base;
}

function isConfigured() {
  return Boolean(getPuraClientConfig().clientId);
}

function prunePending() {
  const cutoff = Date.now() - 10 * 60_000;
  for (const [state, pending] of pendingByState.entries()) {
    if (pending.createdAt < cutoff) pendingByState.delete(state);
  }
}

async function startConnection(locale = "it") {
  prunePending();
  const config = getPuraClientConfig();
  if (!config.clientId) {
    return { success: false, error: "Pura client ID not configured" };
  }
  const { createAuthorization } = await loadSdk();
  const { url, pending } = await createAuthorization({
    ...config,
    locale: locale === "en" ? "en" : "it",
  });
  pendingByState.set(pending.state, pending);
  await openExternalUrl(url);
  return { success: true };
}

async function completeFromCallbackUrl(callbackUrl) {
  const config = getPuraClientConfig();
  if (!config.clientId) {
    throw new Error("Pura client ID not configured");
  }
  const callback = new URL(callbackUrl);
  const state = callback.searchParams.get("state");
  if (!state) throw new Error("OAuth state missing.");
  const pending = pendingByState.get(state);
  if (!pending) throw new Error("No pending Pura connection.");
  pendingByState.delete(state);

  const { PuraOAuthClient } = await loadSdk();
  const oauth = new PuraOAuthClient(config);
  const tokens = await oauth.exchange(callbackUrl, pending);
  puraTokenStore.set(tokens);
  return tokens;
}

async function completeFromDeepLink(deepLinkUrl, oauthProtocol) {
  const parsed = new URL(deepLinkUrl);
  const host = parsed.hostname || parsed.pathname.replace(/^\/+/, "");
  if (host !== "pura-oauth") return { handled: false };

  const config = getPuraClientConfig();
  const callbackUrl = buildOAuthCallbackUrl(config.redirectUri, parsed.searchParams);
  const tokens = await completeFromCallbackUrl(callbackUrl);
  debugLogger.info("Pura OAuth connected", { puraUserId: tokens.pura_user_id }, "puraOAuth");
  return { handled: true, tokens, protocol: oauthProtocol };
}

async function getTokensForRenderer() {
  return puraTokenStore.get();
}

async function setTokensFromRenderer(tokens) {
  if (!tokens) {
    puraTokenStore.clear();
    return { success: true };
  }
  return { success: puraTokenStore.set(tokens) };
}

function disconnect() {
  puraTokenStore.clear();
  return { success: true };
}

function getConnectionState() {
  const tokens = puraTokenStore.get();
  return {
    configured: isConfigured(),
    connected: puraTokenStore.isConnected(),
    puraUserId: tokens?.pura_user_id ?? null,
  };
}

module.exports = {
  getPuraClientConfig,
  isConfigured,
  startConnection,
  completeFromCallbackUrl,
  completeFromDeepLink,
  getTokensForRenderer,
  setTokensFromRenderer,
  disconnect,
  getConnectionState,
  subscribe: puraTokenStore.subscribe,
};
