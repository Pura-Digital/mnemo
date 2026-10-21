const MNEMO_AUTH_HOST_PATTERNS = [
  "https://auth.mnemo.com/*",
  "http://localhost:3000/*",
  "http://127.0.0.1:3000/*",
];

// Electron's file:// renderer sends Origin: null, which Better Auth's
// trustedOrigins check rejects. Spoof Origin to the request's own URL so calls
// to Mnemo's auth and API hosts are treated as same-origin. Every session
// that talks to those hosts needs this — webRequest hooks are per-session, so
// an isolated partition gets none of the default session's.
function applyMnemoOriginHeader(targetSession) {
  targetSession.webRequest.onBeforeSendHeaders(
    { urls: MNEMO_AUTH_HOST_PATTERNS },
    (details, callback) => {
      try {
        details.requestHeaders["Origin"] = new URL(details.url).origin;
      } catch {
        // malformed URL — leave Origin as-is
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );
}

module.exports = { applyMnemoOriginHeader };
