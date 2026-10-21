/** @typedef {'light' | 'dark'} GlassAppearance */

const NATIVE_GLASS_PLATFORMS = new Set(["darwin", "win32"]);

/**
 * @param {string} platform
 */
function isNativeGlassSupported(platform) {
  return NATIVE_GLASS_PLATFORMS.has(platform);
}

/**
 * Windows NT build number is the third segment of os.release() (e.g. 10.0.22631 → 22631).
 * @param {string} release
 */
function isWindows11OrLater(release) {
  const parts = String(release || "").split(".");
  const build = parseInt(parts[2], 10);
  return Number.isFinite(build) && build >= 22000;
}

/**
 * @param {GlassAppearance} appearance
 */
function resolveMacVibrancy(appearance) {
  return appearance === "dark" ? "under-window" : "sidebar";
}

/** @typedef {'chrome' | 'overlay'} NativeGlassWindowRole */

/**
 * Small always-on-top overlays (dictation pill, meeting toast). OS materials
 * paint a full-screen blur rect and blow up the perceived window bounds — keep
 * them transparent only and let the renderer own pill surfaces.
 * @param {object} params
 * @param {string} params.platform
 * @param {string} [params.osRelease]
 * @param {GlassAppearance} [params.appearance]
 * @param {NativeGlassWindowRole} [params.windowRole]
 */
function resolveNativeGlassBrowserOptions({
  platform,
  osRelease,
  appearance = "dark",
  windowRole = "chrome",
}) {
  if (!isNativeGlassSupported(platform)) {
    return {};
  }

  const options = {
    transparent: true,
    backgroundColor: "#00000000",
  };

  if (windowRole === "overlay") {
    return options;
  }

  if (platform === "darwin") {
    options.vibrancy = resolveMacVibrancy(appearance);
    options.visualEffectState = "followWindow";
  } else if (platform === "win32") {
    options.backgroundMaterial = isWindows11OrLater(osRelease) ? "mica" : "acrylic";
  }

  return options;
}

/**
 * Merge native glass creation options onto a BrowserWindow config.
 * @param {Record<string, unknown>} baseConfig
 * @param {object} params
 * @param {string} params.platform
 * @param {string} [params.osRelease]
 * @param {GlassAppearance} [params.appearance]
 */
function withNativeGlassBrowserConfig(
  baseConfig,
  { platform, osRelease, appearance = "dark", windowRole = "chrome" }
) {
  const glass = resolveNativeGlassBrowserOptions({ platform, osRelease, appearance, windowRole });
  if (Object.keys(glass).length === 0) {
    return { ...baseConfig };
  }
  return { ...baseConfig, ...glass };
}

/**
 * @param {import('electron').BrowserWindow | null | undefined} win
 * @param {object} params
 * @param {string} params.platform
 * @param {string} [params.osRelease]
 * @param {GlassAppearance} params.appearance
 */
function applyNativeGlassToBrowserWindow(
  win,
  { platform, osRelease, appearance, windowRole = "chrome" }
) {
  if (!win || win.isDestroyed?.()) {
    return;
  }
  if (!isNativeGlassSupported(platform)) {
    return;
  }

  if (windowRole === "overlay") {
    if (platform === "darwin" && typeof win.setVibrancy === "function") {
      win.setVibrancy(null);
    }
    if (platform === "win32" && typeof win.setBackgroundMaterial === "function") {
      win.setBackgroundMaterial("none");
    }
    return;
  }

  if (platform === "darwin") {
    const vibrancy = resolveMacVibrancy(appearance);
    if (typeof win.setVibrancy === "function") {
      win.setVibrancy(vibrancy);
    }
    if (typeof win.setVisualEffectState === "function") {
      win.setVisualEffectState("followWindow");
    }
  } else if (platform === "win32") {
    const material = isWindows11OrLater(osRelease) ? "mica" : "acrylic";
    if (typeof win.setBackgroundMaterial === "function") {
      win.setBackgroundMaterial(material);
    }
  }
}

/**
 * @param {boolean} shouldUseDarkColors
 * @returns {GlassAppearance}
 */
function appearanceFromNativeTheme(shouldUseDarkColors) {
  return shouldUseDarkColors ? "dark" : "light";
}

module.exports = {
  isNativeGlassSupported,
  isWindows11OrLater,
  resolveMacVibrancy,
  resolveNativeGlassBrowserOptions,
  withNativeGlassBrowserConfig,
  applyNativeGlassToBrowserWindow,
  appearanceFromNativeTheme,
};
