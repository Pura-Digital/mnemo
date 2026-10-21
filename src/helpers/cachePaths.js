const fs = require("fs");
const os = require("os");
const path = require("path");

const CACHE_DIR_NAME = "mnemo";
const LEGACY_CACHE_DIR_NAME = "mnemo";

const WINDOWS_ASCII_CACHE_VENDOR = "Mnemo";
const LEGACY_WINDOWS_ASCII_CACHE_VENDOR = "Mnemo";

let migratedHomeCachePair = null;

function getCacheRootOverride() {
  return process.env.MNEMO_CACHE_ROOT || process.env.MNEMO_CACHE_ROOT || null;
}

function joinHomeCache(homeDir) {
  return path.join(homeDir, ".cache", CACHE_DIR_NAME);
}

function joinLegacyHomeCache(homeDir) {
  return path.join(homeDir, ".cache", LEGACY_CACHE_DIR_NAME);
}

function mergeLegacyCacheTree(legacyRoot, targetRoot) {
  if (!fs.existsSync(legacyRoot)) return true;

  try {
    fs.mkdirSync(targetRoot, { recursive: true });
    for (const entry of fs.readdirSync(legacyRoot)) {
      const from = path.join(legacyRoot, entry);
      const to = path.join(targetRoot, entry);
      if (fs.existsSync(to)) continue;

      try {
        fs.renameSync(from, to);
      } catch {
        fs.cpSync(from, to, { recursive: true });
        fs.rmSync(from, { recursive: true, force: true });
      }
    }

    if (fs.readdirSync(legacyRoot).length === 0) {
      fs.rmSync(legacyRoot, { recursive: true, force: true });
    }
    return true;
  } catch {
    return false;
  }
}

function migrateLegacyHomeCacheName(homeDir) {
  const pair = `${homeDir}\0${CACHE_DIR_NAME}`;
  if (migratedHomeCachePair === pair) {
    return joinHomeCache(homeDir);
  }

  const legacyRoot = joinLegacyHomeCache(homeDir);
  const targetRoot = joinHomeCache(homeDir);

  if (!fs.existsSync(legacyRoot)) {
    migratedHomeCachePair = pair;
    return targetRoot;
  }

  if (!fs.existsSync(targetRoot)) {
    try {
      fs.renameSync(legacyRoot, targetRoot);
      migratedHomeCachePair = pair;
      return targetRoot;
    } catch {
      if (mergeLegacyCacheTree(legacyRoot, targetRoot)) {
        migratedHomeCachePair = pair;
      }
      return targetRoot;
    }
  }

  if (mergeLegacyCacheTree(legacyRoot, targetRoot)) {
    migratedHomeCachePair = pair;
  }
  return targetRoot;
}

function getHomeCacheDir(homeDir = os.homedir()) {
  return migrateLegacyHomeCacheName(homeDir);
}

function getLinuxXdgCacheDir(xdgCacheHome) {
  return path.join(xdgCacheHome, CACHE_DIR_NAME);
}

function getWindowsRedirectedCacheDir(userProfile) {
  return path.join(userProfile, ".cache", CACHE_DIR_NAME);
}

function getWindowsAsciiSafeCacheCandidates() {
  return [
    path.join(process.env.ProgramData || "C:\\ProgramData", WINDOWS_ASCII_CACHE_VENDOR, "cache"),
    path.join(process.env.SystemDrive || "C:", WINDOWS_ASCII_CACHE_VENDOR, "cache"),
  ];
}

function getLegacyWindowsAsciiSafeCacheCandidates() {
  return [
    path.join(
      process.env.ProgramData || "C:\\ProgramData",
      LEGACY_WINDOWS_ASCII_CACHE_VENDOR,
      "cache"
    ),
    path.join(process.env.SystemDrive || "C:", LEGACY_WINDOWS_ASCII_CACHE_VENDOR, "cache"),
  ];
}

function migrateLegacyWindowsAsciiCache(targetRoot) {
  for (const legacyRoot of getLegacyWindowsAsciiSafeCacheCandidates()) {
    if (legacyRoot === targetRoot || !fs.existsSync(legacyRoot)) continue;
    mergeLegacyCacheTree(legacyRoot, targetRoot);
  }
}

module.exports = {
  CACHE_DIR_NAME,
  LEGACY_CACHE_DIR_NAME,
  WINDOWS_ASCII_CACHE_VENDOR,
  getCacheRootOverride,
  getHomeCacheDir,
  joinHomeCache,
  joinLegacyHomeCache,
  getLinuxXdgCacheDir,
  getWindowsRedirectedCacheDir,
  getWindowsAsciiSafeCacheCandidates,
  migrateLegacyWindowsAsciiCache,
  mergeLegacyCacheTree,
};
