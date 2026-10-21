const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isNativeGlassSupported,
  isWindows11OrLater,
  resolveMacVibrancy,
  resolveNativeGlassBrowserOptions,
  withNativeGlassBrowserConfig,
  applyNativeGlassToBrowserWindow,
} = require("../../src/helpers/nativeWindowGlassPolicy.js");

test("isNativeGlassSupported is true only on darwin and win32", () => {
  assert.equal(isNativeGlassSupported("darwin"), true);
  assert.equal(isNativeGlassSupported("win32"), true);
  assert.equal(isNativeGlassSupported("linux"), false);
});

test("isWindows11OrLater uses NT build number", () => {
  assert.equal(isWindows11OrLater("10.0.19045"), false);
  assert.equal(isWindows11OrLater("10.0.22000"), true);
  assert.equal(isWindows11OrLater("10.0.22631"), true);
});

test("resolveMacVibrancy maps appearance to material", () => {
  assert.equal(resolveMacVibrancy("dark"), "under-window");
  assert.equal(resolveMacVibrancy("light"), "sidebar");
});

test("resolveNativeGlassBrowserOptions on linux returns empty", () => {
  assert.deepEqual(resolveNativeGlassBrowserOptions({ platform: "linux" }), {});
});

test("resolveNativeGlassBrowserOptions on overlay windows skips OS materials", () => {
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({
      platform: "darwin",
      appearance: "dark",
      windowRole: "overlay",
    }),
    {
      transparent: true,
      backgroundColor: "#00000000",
    }
  );
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({
      platform: "win32",
      osRelease: "10.0.22631",
      appearance: "light",
      windowRole: "overlay",
    }),
    {
      transparent: true,
      backgroundColor: "#00000000",
    }
  );
});

test("resolveNativeGlassBrowserOptions on macOS", () => {
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({ platform: "darwin", appearance: "light" }),
    {
      transparent: true,
      backgroundColor: "#00000000",
      vibrancy: "sidebar",
      visualEffectState: "followWindow",
    }
  );
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({ platform: "darwin", appearance: "dark" }),
    {
      transparent: true,
      backgroundColor: "#00000000",
      vibrancy: "under-window",
      visualEffectState: "followWindow",
    }
  );
});

test("resolveNativeGlassBrowserOptions on Windows picks mica vs acrylic", () => {
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({
      platform: "win32",
      osRelease: "10.0.22631",
      appearance: "dark",
    }),
    {
      transparent: true,
      backgroundColor: "#00000000",
      backgroundMaterial: "mica",
    }
  );
  assert.deepEqual(
    resolveNativeGlassBrowserOptions({
      platform: "win32",
      osRelease: "10.0.19045",
      appearance: "light",
    }),
    {
      transparent: true,
      backgroundColor: "#00000000",
      backgroundMaterial: "acrylic",
    }
  );
});

test("withNativeGlassBrowserConfig merges onto base without linux changes", () => {
  const base = { width: 100, backgroundColor: "#1c1c2e", transparent: false };
  const linux = withNativeGlassBrowserConfig(base, { platform: "linux" });
  assert.deepEqual(linux, { width: 100, backgroundColor: "#1c1c2e", transparent: false });

  const darwin = withNativeGlassBrowserConfig(base, { platform: "darwin", appearance: "dark" });
  assert.equal(darwin.width, 100);
  assert.equal(darwin.transparent, true);
  assert.equal(darwin.vibrancy, "under-window");
});

test("applyNativeGlassToBrowserWindow clears materials on overlay windows", () => {
  const calls = [];
  const win = {
    isDestroyed: () => false,
    setVibrancy: (v) => calls.push(["vibrancy", v]),
    setBackgroundMaterial: (m) => calls.push(["material", m]),
  };

  applyNativeGlassToBrowserWindow(win, {
    platform: "darwin",
    appearance: "dark",
    windowRole: "overlay",
  });
  assert.deepEqual(calls, [["vibrancy", null]]);

  calls.length = 0;
  applyNativeGlassToBrowserWindow(win, {
    platform: "win32",
    osRelease: "10.0.22631",
    appearance: "dark",
    windowRole: "overlay",
  });
  assert.deepEqual(calls, [["material", "none"]]);
});

test("applyNativeGlassToBrowserWindow calls platform setters", () => {
  const calls = [];
  const win = {
    isDestroyed: () => false,
    setVibrancy: (v) => calls.push(["vibrancy", v]),
    setVisualEffectState: (s) => calls.push(["visualEffectState", s]),
    setBackgroundMaterial: (m) => calls.push(["material", m]),
  };

  applyNativeGlassToBrowserWindow(win, { platform: "darwin", appearance: "light" });
  assert.deepEqual(calls, [
    ["vibrancy", "sidebar"],
    ["visualEffectState", "followWindow"],
  ]);

  calls.length = 0;
  applyNativeGlassToBrowserWindow(win, {
    platform: "win32",
    osRelease: "10.0.19045",
    appearance: "dark",
  });
  assert.deepEqual(calls, [["material", "acrylic"]]);
});
