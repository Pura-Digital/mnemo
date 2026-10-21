const { app } = require("electron");
const fs = require("fs");
const path = require("path");
const debugLogger = require("./debugLogger");
const secretCrypto = require("./secretCrypto");

const tokenFile = () => path.join(app.getPath("userData"), "pura-oauth-tokens.bin");

let cached = null;
const listeners = new Set();

function publish() {
  const snapshot = get();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (err) {
      debugLogger.error("puraTokenStore listener failed", { error: err?.message });
    }
  }
  return snapshot;
}

function persist(tokens) {
  const payload = JSON.stringify(tokens);
  const data = secretCrypto.isAvailable()
    ? secretCrypto.encrypt(payload)
    : Buffer.from(payload, "utf8");
  fs.writeFileSync(tokenFile(), data, { mode: 0o600 });
}

function get() {
  if (cached !== null) return cached;
  try {
    const file = tokenFile();
    if (!fs.existsSync(file)) {
      cached = null;
      return null;
    }
    const buf = fs.readFileSync(file);
    let json;
    if (!secretCrypto.isAvailable()) {
      json = buf.toString("utf8");
    } else {
      const { value, needsReencrypt } = secretCrypto.decrypt(buf);
      json = value;
      if (needsReencrypt) {
        try {
          persist(JSON.parse(json));
        } catch (err) {
          debugLogger.error("puraTokenStore re-encryption failed", { error: err?.message });
        }
      }
    }
    cached = JSON.parse(json);
    return cached;
  } catch (err) {
    debugLogger.error("puraTokenStore.get failed", { error: err?.message });
    cached = null;
    return null;
  }
}

function set(tokens) {
  if (!tokens || typeof tokens !== "object") return false;
  try {
    persist(tokens);
    cached = tokens;
    publish();
    return true;
  } catch (err) {
    debugLogger.error("puraTokenStore.set failed", { error: err?.message });
    return false;
  }
}

function clear() {
  cached = null;
  try {
    const file = tokenFile();
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch (err) {
    debugLogger.error("puraTokenStore.clear failed", { error: err?.message });
  }
  publish();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isConnected() {
  const tokens = get();
  return Boolean(tokens?.access_token && tokens?.refresh_token);
}

module.exports = { get, set, clear, subscribe, isConnected };
