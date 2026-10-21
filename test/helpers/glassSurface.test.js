const test = require("node:test");
const assert = require("node:assert/strict");
const { createRendererServer, installBrowserGlobals } = require("../lib/rendererTestHarness");

async function loadGlassModule(t) {
  installBrowserGlobals(t);
  const vite = await createRendererServer(t, {
    cachePrefix: "mnemo-glass-surface-test-",
  });
  return vite.ssrLoadModule("/components/ui/glass.ts");
}

test("resolveGlassSurface uses CSS blur only when native glass is off", async (t) => {
  const { resolveGlassSurface, GLASS_SURFACE, NATIVE_GLASS_SURFACE } = await loadGlassModule(t);

  assert.equal(resolveGlassSurface(false), GLASS_SURFACE);
  assert.equal(resolveGlassSurface(true), NATIVE_GLASS_SURFACE);
  assert.ok(GLASS_SURFACE.includes("backdrop-blur-xl"));
  assert.ok(!NATIVE_GLASS_SURFACE.includes("backdrop-blur"));
  assert.ok(!NATIVE_GLASS_SURFACE.includes("backdrop-saturate"));
});
