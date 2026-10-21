const test = require("node:test");
const assert = require("node:assert/strict");
const { createRendererServer, installBrowserGlobals } = require("../lib/rendererTestHarness");

test("default agent name is mnemo", async (t) => {
  installBrowserGlobals(t, { initialStorage: {} });
  const vite = await createRendererServer(t, {
    mockModules: {
      "/stores/settingsStore": `
        export const getSettings = () => ({ customDictionary: [] });
        export const useSettingsStore = {
          getState: () => ({ updateCustomDictionary: () => {} })
        };
      `,
    },
  });
  const { getAgentName } = await vite.ssrLoadModule("/utils/agentName.ts");
  assert.equal(getAgentName(), "mnemo");

  localStorage.setItem("agentName", "Aria");
  assert.equal(getAgentName(), "Aria");
});
