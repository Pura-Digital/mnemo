const VALID_CHANNELS = new Set(["development", "staging", "production"]);

const DEFAULT_OAUTH_PROTOCOL_BY_CHANNEL = {
  development: "mnemo-dev",
  staging: "mnemo-staging",
  production: "mnemo",
};

const LEGACY_OAUTH_PROTOCOL_BY_CHANNEL = {
  development: "mnemo-dev",
  staging: "mnemo-staging",
  production: "mnemo",
};

function isElectronBinaryExec() {
  const execPath = (process.execPath || "").toLowerCase();
  return (
    execPath.includes("/electron.app/contents/macos/electron") ||
    execPath.endsWith("/electron") ||
    execPath.endsWith("\\electron.exe")
  );
}

function inferDefaultChannel() {
  if (process.env.NODE_ENV === "development" || process.defaultApp || isElectronBinaryExec()) {
    return "development";
  }
  const raw = (process.env.MNEMO_CHANNEL || process.env.VITE_MNEMO_CHANNEL || "")
    .trim()
    .toLowerCase();
  return VALID_CHANNELS.has(raw) ? raw : "production";
}

function resolveOAuthProtocolFromEnv() {
  const fromEnv = (
    process.env.VITE_MNEMO_PROTOCOL ||
    process.env.MNEMO_PROTOCOL ||
    process.env.VITE_MNEMO_PROTOCOL ||
    process.env.MNEMO_PROTOCOL ||
    ""
  )
    .trim()
    .toLowerCase();
  if (/^[a-z][a-z0-9+.-]*$/.test(fromEnv)) {
    return fromEnv;
  }
  return null;
}

function getOAuthProtocol() {
  return (
    resolveOAuthProtocolFromEnv() ||
    DEFAULT_OAUTH_PROTOCOL_BY_CHANNEL[inferDefaultChannel()] ||
    DEFAULT_OAUTH_PROTOCOL_BY_CHANNEL.production
  );
}

function getLegacyOAuthProtocol() {
  return (
    LEGACY_OAUTH_PROTOCOL_BY_CHANNEL[inferDefaultChannel()] ||
    LEGACY_OAUTH_PROTOCOL_BY_CHANNEL.production
  );
}

function getAcceptedOAuthProtocols() {
  const protocols = [getOAuthProtocol(), getLegacyOAuthProtocol()];
  return [...new Set(protocols.filter(Boolean))];
}

function matchOAuthProtocolUrl(url) {
  if (typeof url !== "string") return null;
  for (const protocol of getAcceptedOAuthProtocols()) {
    if (url.startsWith(`${protocol}://`)) return protocol;
  }
  return null;
}

function stripOAuthProtocolPrefix(url) {
  const protocol = matchOAuthProtocolUrl(url);
  if (!protocol) return null;
  return url.slice(`${protocol}://`.length);
}

function getDefaultPuraOAuthRedirectUri() {
  return `${getOAuthProtocol()}://pura-oauth`;
}

function findOAuthProtocolUrl(args) {
  if (!Array.isArray(args)) return null;
  return args.find((arg) => matchOAuthProtocolUrl(arg)) ?? null;
}

module.exports = {
  DEFAULT_OAUTH_PROTOCOL_BY_CHANNEL,
  LEGACY_OAUTH_PROTOCOL_BY_CHANNEL,
  inferDefaultChannel,
  getOAuthProtocol,
  getLegacyOAuthProtocol,
  getAcceptedOAuthProtocols,
  matchOAuthProtocolUrl,
  stripOAuthProtocolPrefix,
  getDefaultPuraOAuthRedirectUri,
  findOAuthProtocolUrl,
};
