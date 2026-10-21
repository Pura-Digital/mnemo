const { execFile } = require("child_process");

const PS_TIMEOUT_MS = 2000;

// The outermost bundle owns every helper nested inside it, so Chrome's audio
// service and a Teams WebView helper resolve to the app the user launched.
function appKeyFromExecutablePath(executablePath) {
  const trimmed = (executablePath || "").trim();
  if (!trimmed) return null;
  const bundleMatch = trimmed.match(/^(.*?\.app)(?:\/|$)/);
  return bundleMatch ? bundleMatch[1] : trimmed;
}

// Resolves to null whenever the owner cannot be read (process gone, platform
// without bundles); callers treat null as "unknown", never as "different app".
function resolveProcessAppKey(pid) {
  if (process.platform !== "darwin" || !Number.isInteger(pid) || pid <= 0) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    execFile(
      "ps",
      ["-o", "comm=", "-p", String(pid)],
      { timeout: PS_TIMEOUT_MS, encoding: "utf8" },
      (error, stdout) => resolve(error ? null : appKeyFromExecutablePath(stdout))
    );
  });
}

module.exports = { appKeyFromExecutablePath, resolveProcessAppKey };
